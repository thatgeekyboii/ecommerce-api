import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
    _id: { type: String },
    name: String,
    email: String,
    age: Number,
    location: String,
    gender: String,
});

export default mongoose.model('Customer', customerSchema);