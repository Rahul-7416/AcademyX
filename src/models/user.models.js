import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
            unique: true, // Unique index for referralCode
            sparse: true, // Allow multiple documents to have null values for referralCode
        },
        refferedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        refreshToken: {
            type: String,
        },
    },
    {
        timestamps: true
    },
);

// to hash the password before saving it into the db
userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    // hashing the password
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// custom method -> to compare passwordProvided and prasswordSaved are same or not
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

// custom method -> to generate short span accessToken
userSchema.methods.generateAccessToken = function() {
    return jwt.sign(

        //payload 
        {
            _id: this._id,
            email: this.email,
            name: this.name,
            isAdmin: this.isAdmin,
        },

        // secret key 
        process.env.ACCESS_TOKEN_SECRET,

        // options
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        },
    )
}

// custom method -> to generate long span refreshToken
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(

        // payload
        {
            _id: this._id,
            email: this.email, 
            name: this.name,
            isAdmin: this.isAdmin,
        },

        // secret key
        process.env.REFRESH_TOKEN_SECRET,

        // options 
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        },
    )
}

export const User = mongoose.model("User", userSchema, "Users");