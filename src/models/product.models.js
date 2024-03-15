import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
       name: {
        type: String, 
        required: true,
       },
       description: {
        type: String,
        required: true,
       },
       price: {
        type: Number,
        required: true,
       },
       category: {
        type: String,
        enum: ["Courses", "Event"],
        required: true,
       },
       imageUrl: {
        type: String,
        required: true,
       },
    },
);

export const Product = mongoose.model("Product", productSchema, "Products");