# ecommerce-mongo-api

This is a full-featured GraphQL API for an e-commerce platform. It includes functionalities such as retrieving customer spending, top-selling products, and sales analytics, as well as placing orders. The API integrates with MongoDB and provides a mutation for order placement.


## Table of Contents

1) Prerequisites
2) Setup Instructions
3) Database Schema
4) GraphQL Queries and Mutations
5) Testing Queries
6) Additional Features

## Prerequisites

Node.js (v14+)
MongoDB (local or cloud instance, e.g., MongoDB Atlas)
npm or yarn (for managing dependencies)


## Setup Instructions

### 1. Clone the repository

`git clone [https://github.com/yourusername/graphql-mongo-api.git]`
`cd graphql-mongo-api`

### 2. Install dependencies
Install the required dependencies using npm or yarn.

`npm install`
or
`yarn install`


### 3. Configure environment variables
Create a .env file at the root of your project and add the following environment variables:

`MONGO_URI=mongodb://localhost:27017/e-commerce `  # MongoDB connection URI (can also use MongoDB Atlas)
`PORT=4000`                                        # Port to run the server on (default 4000)

For MongoDB Atlas, the connection URI will look something like:

`MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/e-commerce?retryWrites=true&w=majority`


### 4. Start the server
Once your environment variables are set, you can start the server:

`npm start`


# Database Schema

The following MongoDB collections are used in this project:

### customers : Contains customer information.
### orders: Stores order details for customers.
### products: Contains product details.


 ## Order Schema (MongoDB)
 ``` const orderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number,
      priceAtPurchase: Number,
    },
  ],
  totalAmount: Number,
  orderDate: Date,
  status: String,
});
```

 ## Customer Schema (MongoDB)

```
const customerSchema = new mongoose.Schema({
    _id: { type: String },
    name: String,
    email: String,
    age: Number,
    location: String,
    gender: String,
});
```

## Product Schema (MongoDB)

```
 const productSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  stock: Number,
});
 ```
 

# GraphQL Queries and Mutations

## Queries

`getCustomerSpending`: 
Fetches the total spending, average order value, and last order date for a customer.

```
query {
  getCustomerSpending(customerId: "adf96a4e-6987-4731-8798-09b109ff65c3") {
    customerId
    totalSpent
    averageOrderValue
    lastOrderDate
  }
}
```

`getTopSellingProducts`
Fetches the top-selling products, with an optional limit on the number of products.

```
query {
  getTopSellingProducts(limit: 10) {
    productId
    name
    totalSold
  }
}
```

`getSalesAnalytics`
Fetches the sales analytics for a specific date range.

```
query {
  getSalesAnalytics(startDate: "2024-12-01", endDate: "2025-01-31") {
    totalRevenue
    completedOrders
    categoryBreakdown {
      category
      revenue
    }
  }
}
```


## Mutations

`placeOrder`
Allows a customer to place an order by providing order details.

```
mutation {
  placeOrder(input: {
    customerId: "1234",
    products: [
      { productId: "product-uuid-1", quantity: 2, priceAtPurchase: 19.99 },
      { productId: "product-uuid-2", quantity: 1, priceAtPurchase: 39.99 }
    ],
    totalAmount: 79.97,
    orderDate: "2025-05-15T14:00:00Z",
    status: "pending"
  }) {
    _id
    totalAmount
    orderDate
    status
  }
}
```



