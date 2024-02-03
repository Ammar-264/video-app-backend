import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import { UserModel } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { emailRegex, usernameRegex } from "../utils/regExp.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export const registerUser = asyncHandler(async (req, res) => {
  // get user details -------------------------
  const { fullName, username, email, password } = req.body;

  // validation  - not empty -------------------------
  if (
    [fullName, username, email, password].some((field) => field?.trim === "")
  ) {
    throw new ApiError(400, "Kindly fill all the fields correctly");
  }

  // make username lowercase
  let trimUsername = username.trim();
  let trimEmail = email.trim();

  // check if username only has alphabets and numbers
  if (!usernameRegex.test(trimUsername))
    throw new ApiError(
      400,
      "username can only contain small alphabets and numbers"
    );

  // check email syntax is correct
  if (!emailRegex.test(trimEmail)) throw new ApiError(400, "Incorrect email");

  // check if user already exists - username & email-------------------------------
  const usernameExists = await UserModel.findOne({
    username: trimUsername,
  });
  if (usernameExists) throw new ApiError(409, "Username already exist");

  const emailExists = await UserModel.findOne({
    email: trimEmail,
  });
  if (emailExists) throw new ApiError(409, "email already exist");

  // check for images  -------------------------------
  const avatartLocalPath = req.files.avatar && req.files.avatar[0]?.path;
  const coverImageLocalPath =
    req.files.coverImage && req.files.coverImage[0]?.path;

  // check for avatar ----------------------------------
  if (!avatartLocalPath) throw new ApiError(400, "Avatar file is required");

  // upload them to cludinary , avatar ------------------------------------------
  const avatarUploadResponse = await uploadOnCloudinary(avatartLocalPath);
  const coverImageUploadResponse =
    await uploadOnCloudinary(coverImageLocalPath);

  if (!avatarUploadResponse) throw new ApiError(400, "Avatar file is required");

  // create user object - create entry in db ---------------------------
  const userCreated = await UserModel.create({
    fullName,
    username: usernameLowercase,
    email,
    password,
    avatar: avatarUploadResponse.url,
    coverImage: coverImageUploadResponse?.url || "",
  });

  // renmove password and refresh token field from response ------------------------------
  const userGet = await UserModel.findById(userCreated._id).select(
    "-password -refreshToken"
  );

  // check for user creation -----------------------------
  if (!userGet) throw new ApiError(500, "Something went wrong");

  // return res ------------------------------------
  res
    .status(201)
    .json(new ApiResponse(201, userGet, "User Created Successfully"));
});

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await UserModel.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something Went Wrong While Generating Tokens");
  }
};

// login user

export const loginUser = asyncHandler(async (req, res) => {
  //    get username/email and password
  const { emailOrUsername, password } = req.body;

  let username = "";
  let email = "";

  if (usernameRegex.test(emailOrUsername)) {
    username = emailOrUsername;
  } else if (emailRegex.test(emailOrUsername)) {
    email = emailOrUsername;
  } else {
    throw new ApiError(400, "Incorrect Username Or Email");
  }

  // check if user exists with username or email

  const userExists = await UserModel.findOne({
    $or: [{ username }, { email }],
  });

  if (!userExists) throw new ApiError(404, "Wrong Credentials");

  // check if password  is correct
  const passwordCheck = await userExists.isPasswordCorrect(password);
  if (!passwordCheck) throw new ApiError(400, "Wrong Credentials");

  // password correct => generate access token and login , generate refresh token

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    userExists._id
  );

  const loginedUser = await UserModel.findById(userExists._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  // send token in cookies
  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loginedUser,
          accessToken,
          refreshToken,
        },
        "user logined successfully"
      )
    );
});

// logout
export const logout = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  await UserModel.findByIdAndUpdate(
    userId,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user loged out successfully"));
});

// refresh access token
export const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies.refreshToken;

    if (!incomingRefreshToken) throw new ApiError(401, "unauthorized request");

    const decodedToken = jwt.verify(incomingRefreshToken, REFRESH_TOKEN_SECRET);

    const user = await UserModel.findById(decodedToken?.payload._id);

    if (!user) throw new ApiError(401, "Invalid Refresh Token");

    if (incomingRefreshToken !== user?.refreshToken)
      throw new ApiError(401, "Refresh Token Is Expired Or Used");

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(400, error.message || "Invalid refresh token");
  }
});

// changing current password
export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await UserModel.findById(req.user._id);

  const passwordCheck = user.isPasswordCorrect(oldPassword);

  if (!passwordCheck) throw new ApiError(400, "Wrong Old Password");

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"));
});

// loading current user
export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "user loaded successfully"));
});

export const updateAvatar = asyncHandler(async (req, res) => {
  const avatartLocalPath = req.file?.path;

  if (!avatartLocalPath) new ApiError(400, "image file is missing");

  const avatar = await uploadOnCloudinary(avatartLocalPath);

  if (!avatar.url) new ApiError(400, "error while uploading image");

  const userId = req.user._id;

  const user = await UserModel.findByIdAndUpdate(
    userId,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

export const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) new ApiError(400, "image file is missing");

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) new ApiError(400, "error while uploading image");

  const userId = req.user._id;

  const user = await UserModel.findByIdAndUpdate(
    userId,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image updated successfully"));
});

export const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) throw new ApiError(404, "username not found");

  const channel = await UserModel.aggregate([
    {
      $match: {
        username: username.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },

   

    {
        $addFields: {
            subscribersCount: {
                $size: "$subscribers",
            },
            subscribedLookupCondition: {
                $cond: {
                    if: { $eq: ["$_id", req.user._id] },
                    then: true,
                    else: false
                },
            },
        },
    },
    {
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribed",
        },
    },
    {
        $addFields: {
            isSubscribed: {
                $cond: {
                    if: { $in: [req.user._id, "$subscribers.subscriber"] },
                    then: true,
                    else: false
                }
            },
            subscribedCount: {
                $size: "$subscribed"
            }
        },
    },
    {
        $project:{
            fullName:1,
            username:1,
            subscribersCount:1,
            isSubscribed:1,
            avatar:1,
            coverImage:1,
            subscribedCount:{
                $cond:{if:"$subscribedLookupCondition",then:"$subscribedCount",else:false}
        }
    }
    }
  ]);

  console.log(channel);
  if (!channel.length) throw new ApiError(404, "channel does not exists");

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "channel loaded"));
});

export const getWatchHistory = asyncHandler(async (req, res) => {
    
    if (!req.user) throw new ApiError(404, "user not found");

    const userId = req.user._id;
    
  const watchHistory = await UserModel.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
              pipeline: [
                {
                  $project: {
                    avatar: 1,
                    fullName: 1,
                    username: 1,
                  },
                },
              ],
            },
          },

          {
            $project:{
                thumbnail:1,
                owner:1,
                title:1,
                ownerDetails:1,
                duration:1
            }
          }
        ],

      },
    },

    {
        $project:{
            watchHistory:1
        }
    }
  ]);

  if(!watchHistory.length) throw new ApiError(500 , "something went wrong")

  res.status(200).json(
    new ApiResponse(200 , watchHistory , "watch history loaded")
  )
});
