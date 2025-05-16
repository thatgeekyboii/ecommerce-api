import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
customerId: { type: String, ref: 'Customer' },
  products: [
    {
      productId: { type: String, ref: 'Product' },  
      quantity: Number,
      priceAtPurchase: Number,
    },
  ],
  totalAmount: Number,
  orderDate: Date,
  status: String,
});

export default mongoose.model('Order', orderSchema);
