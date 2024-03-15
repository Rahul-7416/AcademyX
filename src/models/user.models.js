import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "password is required"],
        },
        isAdmin: {
            type: Boolean,
            required: true,
        },
        referralCode: {
            type: String,
            unique: true,
        },
        refferedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true
    },
);

export const User = mongoose.model("User", userSchema, "Users");