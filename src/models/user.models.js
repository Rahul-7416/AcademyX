import mongoose from "mongoose";
import bcrypt from "bcrypt";

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

// to hash the password before saving it into the db
userSchema.pre("save", async function (next) {
    if(!this.modifiedPaths("password")) return next();

    // hashing the password
    this.password = bcrypt.hash(this.password, 10);
    next();
})

// custom method -> to compare passwordProvided and prasswordSaved are same or not
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

export const User = mongoose.model("User", userSchema, "Users");