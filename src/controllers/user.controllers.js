import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.utils.js";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refreshToken and accessToken");
    }
}

const registerUser = asyncHandler( async (req, res) => {

    // get user details from the frontend
    const {name, email, password, isAdmin, referralCode, refferedBy} = req.body;

    // validation -> to check if all the required fields are non-empty
    if (
        [name, email, password, isAdmin].some((field) => 
        field.trim === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // check if the user already exists or not
    const existedUser = await User.findOne({
        $or: [ { email } ]
    })

    if (existedUser) {
        throw new ApiError(409, "User with same email already exists!");
    }

    // create an entry in the db -> by creating new User document
    const user = await User.create({
        name,
        email,
        password,
        isAdmin,
        referralCode,
        refferedBy,
    });

    // remove password and refresh token from the response 
    const createdUser = await User.findById(user._id).select(" -password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    // return the response -> that data is saved
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            createdUser,
            "user created successfully"
        )
    );

});

export {
    registerUser,
}