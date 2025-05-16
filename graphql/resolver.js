import Order from '../models/Order.js';

const resolvers = {
  Query: {
getCustomerSpending: async (_, { customerId }) => {
  try {
    // Default response if no orders exist
    const defaultResponse = {
      customerId,
      totalSpent: 0,
      averageOrderValue: 0,
      lastOrderDate: null,
    };

    // Aggregation query
    const [result] = await Order.aggregate([
      {
        $match: {
          customerId,
          status: { $in: ["completed", "shipped", "delivered"] },
        },
      },
      {
        $group: {
          _id: null, // Group all matched orders
          totalSpent: { $sum: "$totalAmount" },
          averageOrderValue: { $avg: "$totalAmount" },
          lastOrderDate: { $max: "$orderDate" },
        },
      },
      {
        $project: {
          _id: 0, // Exclude _id from the result
          customerId: { $literal: customerId }, // Inject customerId into the output
          totalSpent: 1,
          averageOrderValue: 1,
          lastOrderDate: 1,
        },
      },
    ]);
    // Return result or default if no orders found
    return result || defaultResponse;
  } catch (error) {
    console.error("Error fetching customer spending:", error);
    return {
      customerId,
      totalSpent: 0,
      averageOrderValue: 0,
      lastOrderDate: null,
    };
  }
},

async getTopSellingProducts(_, { limit = 10 }) {
  try {
    // Validate input
    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error("Limit must be a positive integer");
    }

    const products = await Order.aggregate([
      // Optional: Filter by order status first
      { $match: { status: { $in: ["completed", "shipped"] } } },
      
      // Deconstruct products array
      { $unwind: "$products" },
      
      // Group by productId and sum quantities
      {
        $group: {
          _id: "$products.productId",
          totalSold: { $sum: "$products.quantity" },
        },
      },
      
      // Join with product details
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      
      // Handle missing products gracefully
      { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
      
      // Shape the output
      {
        $project: {
          productId: "$_id",
          name: "$productDetails.name", // Will be null if product missing
          totalSold: 1,
          _id: 0,
        },
      },
      
      // Sort and limit
      { $sort: { totalSold: -1 } },
      { $limit: limit },
    ]);

    return products.filter(p => p.name);
  } catch (error) {
    console.error("Error in getTopSellingProducts:", error);
    return []; // Fallback empty array
  }
},
//         console.log('endDate', endDate);
//       const result = await Order.aggregate([
//         {
//             $addFields: {
//                 orderDateISO: { $toDate: "$orderDate" }  // Convert string to Date
//             }
//         },
//         {
//           $match: {
//             status: "completed",
//             orderDateISO: {
//               $gte: new Date(startDate + "T00:00:00Z"),
//               $lte: new Date(endDate + "T23:59:59Z"),
//             },
//           },
//         },
//         {
//           $facet: {
//             revenueStats: [
//               {
//                 $group: {
//                   _id: null,
//                   totalRevenue: { $sum: "$totalAmount" },
//                   completedOrders: { $sum: 1 },
//                 },
//               },
//             ],
//             categoryBreakdown: [
//               { $unwind: "$products" },
//               {
//                 $lookup: {
//                   from: "products",
//                   localField: "products.productId",
//                   foreignField: "_id",
//                   as: "productDetails",
//                 },
//               },
//               { $unwind: "$productDetails" },
//               {
//                 $group: {
//                   _id: "$productDetails.category",
//                   revenue: {
//                     $sum: {
//                       $multiply: ["$products.quantity", "$products.priceAtPurchase"],
//                     },
//                   },
//                 },
//               },
//               {
//                 $project: {
//                   category: "$_id",
//                   revenue: 1,
//                   _id: 0,
//                 },
//               },
//             ],
//           },
//         },
//         {
//   $project: {
//     totalRevenue: {
//       $ifNull: [{ $arrayElemAt: ["$revenueStats.totalRevenue", 0] }, 0]
//     },
//     completedOrders: {
//       $ifNull: [{ $arrayElemAt: ["$revenueStats.completedOrders", 0] }, 0]
//     },
//     categoryBreakdown: "$categoryBreakdown",
//   }
// },
//       ]);
//       return result[0];
//     },
async getSalesAnalytics(_, { startDate, endDate }) {
  try {
    // Validate dates
    if (!startDate || !endDate || isNaN(new Date(startDate)) || isNaN(new Date(endDate))) {
      throw new Error("Invalid date range. Use YYYY-MM-DD format.");
    }

    const analyticsResult = await Order.aggregate([
      // 1. Filter by status FIRST (performance)
      { $match: { status: "completed" } },

      // 2. Convert orderDate to Date type
      { $addFields: { orderDateISO: { $toDate: "$orderDate" } } },

      // 3. Filter by date range
      {
        $match: {
          orderDateISO: {
            $gte: new Date(`${startDate}T00:00:00Z`),
            $lte: new Date(`${endDate}T23:59:59Z`),
          },
        },
      },

      // 4. Compute stats in parallel using $facet
      {
        $facet: {
          revenueStats: [
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: "$totalAmount" },
                completedOrders: { $sum: 1 },
              },
            },
          ],
          categoryBreakdown: [
            { $unwind: "$products" },
            {
              $lookup: {
                from: "products",
                localField: "products.productId",
                foreignField: "_id",
                as: "productDetails",
              },
            },
            { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
            {
              $group: {
                _id: "$productDetails.category",
                revenue: {
                  $sum: {
                    $multiply: ["$products.quantity", "$products.priceAtPurchase"],
                  },
                },
              },
            },
            {
              $project: {
                category: "$_id",
                revenue: 1,
                _id: 0,
              },
            },
            { $match: { category: { $ne: null } } }, // Exclude null categories
          ],
        },
      },

      // 5. Shape the final output
      {
        $project: {
          totalRevenue: {
            $ifNull: [{ $arrayElemAt: ["$revenueStats.totalRevenue", 0] }, 0],
          },
          completedOrders: {
            $ifNull: [{ $arrayElemAt: ["$revenueStats.completedOrders", 0] }, 0],
          },
          categoryBreakdown: {
            $ifNull: ["$categoryBreakdown", []], // Default to empty array
          },
        },
      },
    ]);

    return analyticsResult[0] || { 
      totalRevenue: 0, 
      completedOrders: 0, 
      categoryBreakdown: [] 
    };
  } catch (error) {
    console.error("Error in getSalesAnalytics:", error);
    return { 
      totalRevenue: 0, 
      completedOrders: 0, 
      categoryBreakdown: [] 
    };
  }
},
  },
  Mutation: {
    placeOrder: async (_, { input }) => {
      const { customerId, products, totalAmount, orderDate, status } = input;

      const newOrder = new Order({
        customerId,
        products,
        totalAmount,
        orderDate,
        status,
      });
      console.log('newOrderVal', newOrder)

      const savedOrder = await newOrder.save();
      return savedOrder;
    },
  },
};

export default resolvers;
