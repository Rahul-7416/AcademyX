import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.utils.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        console.log("Error while generating tokens: ", error);
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
    const existedUser = await User.findOne({ email });

    if (existedUser) {
        throw new ApiError(409, "User with same email already exists!");
    }

    // create an entry in the db -> by creating new User document
    const user = await User.create({
        name,
        email: email.toLowerCase(),
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

const loginUser = asyncHandler( async (req, res) => {

    // get the user login details
    const { email, password } = req.body;
    
    // validation -> to check that data received is not empty
    if (
        [email, password].some((field) => {
            return field.trim() === ""
        })
    ) {
        throw new ApiError(400, "All fields are required");
    }
    console.log(email, password);

    // find the user based on the email received
    const user = await User.findOne({email});
    
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // password check
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user password");
    }

    // generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    // console.log("AT: ", accessToken); // testing purpose

    // removing confedential details from the response
    const loggedInUser = await User.findById(user._id).select(" -password -refreshToken");

    // send cookies
    const options = {
        httpOnly: true,
        secure: true,
    }

    // return response 
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            loggedInUser,
            "User logged in successfully"
        )
    )

});


const logoutUser = asyncHandler( async (req, res) => {

    // use the manually created req.user object to find the user
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            }
        },
        {
            new: true,
        }
    )

    // creating cookie options
    const options = {
        httpOnly: true,
        secure: true,
    }

    // returning the response
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(
            200,
            {},
            "User logged out",
        )
    )
})

const regenerateAccessAndRefreshToken = asyncHandler(async (req, res) => {
    try {
        
        // checking if the req have the refreshToken or not
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!incomingRefreshToken) {
            throw new ApiError(401, "Unauthorized request")
        }

        // decoding the token -> to access it's payload
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        );

        // finding the user -> using the _id received from the payload
        const user = await User.findById(decodedToken?._id);

        // if no user present with that id
        if(!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        // checking if the refreshToken received from the req is equal to the user.refreshToken or not
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        // setting cookies options
        const options = {
            httpOnly: true,
            secure: true,
        }

        // generating new accessToken and refreshToken
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

        // returning the response
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken },
                "Access token refreshed"
            )
        )

    } catch (error) {
        throw new ApiError(401, error?.message || "Inavlid Refresh Token");
    }
})

export {
    registerUser,
    loginUser,
    logoutUser,
    regenerateAccessAndRefreshToken,
}