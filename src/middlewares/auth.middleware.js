import { UserModel } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'

const VerifyJwt = asyncHandler(async (req,_,next)=>{
  try {
    const accessToken =   req.cookies?.accessToken || req.header("Authorization")?.split(" ")[1]
  
    if(!accessToken) throw new ApiError(401 , "unauthorized request")
  
   const decodedToken =  jwt.verify(accessToken , process.env.ACCESS_TOKEN_SECRET)

  //  console.log(decodedToken.payload._id);

   const userId = decodedToken.payload && decodedToken.payload._id

  
   const user = await UserModel.findById(userId).select("-password -refreshToken")

  
   if(!user) throw new ApiError( 401, "Invalid Access Token when fetching user")
  
   req.user = user
  
   next()
  } catch (error) {
    throw new ApiError(401 , `error :-  ${error.message}` || "invalid access token")
  }
})

export default VerifyJwt