import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { UserModel } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/apiResponse.js";


export const registerUser =asyncHandler(async(req,res)=>{
    // get user details
    // validation  - not empty
    // check if user already exists - username & email
    // check for images , check for avata
    // upload them to cludinary , avatar
    // create user object - create entry in db
    // renmove password and refresh token field from response
    // check for user creation
    // return res

    const {fullName , username , email , password} = req.body

    if([fullName , username , email , password].some((field)=>field?.trim === '')){
        throw new ApiError(400 , "Kindly fill all the fields correctly")
    }

    let usernameLowercase = username.toLowerCaser()

   const usernameExists =  UserModel.findOne({
        username:usernameLowercase
    })
    if(usernameExists) throw new ApiError(409 , "Username already exist")
    


   const emailExists =  UserModel.findOne({
        email
    })
    if(emailExists) throw new ApiError(409 , "email already exist")


    const avatartLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path
    
    if(!avatartLocalPath) throw new ApiError(400 , "Avatar file is required")
    
    
    const avatarUploadResponse =  await uploadOnCloudinary(avatartLocalPath)
    const coverImageUploadResponse =  await uploadOnCloudinary(coverImageLocalPath)
    
    if(!avatarUploadResponse) throw new ApiError(400 , "Avatar file is required")

    const userCreated = await UserModel.create({
        fullName,
        username:usernameLowercase,
        email,
        password,
        avatar:avatarUploadResponse.url,
        coverImage:coverImageUploadResponse?.url || "" 
    })

    const userGet = await UserModel.findById(userCreated._id).select("-password -refreshToken")

    if(!userGet) throw new ApiError(500 , "Something went wrong")

    res.status(201).json(
        new ApiResponse(201 , userGet , "User Created Successfully")
        ) 
})



export const loginUser =asyncHandler(async(req,res)=>{
    res.status(200).json({
        message:"ok"
    })
})


