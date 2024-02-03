import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import { SubscriptionModel } from "../models/subscription.model.js";
import { UserModel } from "../models/user.model.js";
import mongoose from "mongoose";

export const toggleSubscription = asyncHandler(async (req,res)=>{
    
    const {channelId} = req.params
    

    if(!req.user) throw new ApiError(401 , "user unauthorized")

    if(!req.params || !channelId.trim()) throw new ApiError(400 , "cannot subscribe")

    const currentUser = String(req.user._id)

    if(channelId === String(currentUser)) throw new ApiError(400 , "cannot self subscribe")

    
    const getChannel = await UserModel.findById(channelId)

    if(!getChannel) throw new ApiError(404 ,"channel not exist")

    const isAlreadySubscribed = await SubscriptionModel.findOne({
        subscriber:currentUser,
        channel:channelId
    })

    if(!isAlreadySubscribed){
        const subscribed = await SubscriptionModel.create({
            subscriber:currentUser,
            channel:channelId
        })

        if(!subscribed) throw new ApiError(500 , "something went wrong")

        res.status(201).json(
            new ApiResponse(201 , subscribed , "subscribed successfully")
        )
    }else{
        const unSubscribed = await SubscriptionModel.findByIdAndDelete(isAlreadySubscribed._id)

        if(!unSubscribed) throw new ApiError(500 , "something went wrong")

        res.status(201).json(
            new ApiResponse(201 , unSubscribed , "unSubscribed successfully")
        )
    }

    
}) 


export const getUserChannelSubscribers = asyncHandler (async(req,res)=>{
      
    const {channelId} = req.params
    

    if(!req.user) throw new ApiError(401 , "user unauthorized")

    if(!req.params || !channelId.trim()) throw new ApiError(400 , "cannot get subscribers")
    
    const getChannel = await UserModel.findById(channelId)

    if(!getChannel) throw new ApiError(404 ,"channel not exist")

    const getSubscribers  = await SubscriptionModel.find({channel:channelId})

    console.log(getSubscribers);

    if(!getSubscribers.length) throw new ApiError(500, "something went wrong")

    res.status(200).json(
        new ApiResponse(200 , {totalSubscribers :getSubscribers.length} , "subscribers loaded")
    )
})

export const getSubscribedChannels = asyncHandler(async (req,res)=>{
    if(!req.user) throw new ApiError(404 , "unauthorized request")
    
    const channelId = req.user._id

    const subscribedChannels = await SubscriptionModel.aggregate([
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"channelDetails",
                pipeline:[
                    {
                        $project:{
                            fullName:1,
                            coverImage:1,
                            username:1
                        }
                    }
                ]
            }
        },
        {
            $project:{
                channelDetails:1
            }
        }
    ])

    if(!subscribedChannels) throw new ApiError(500 , 'something went wrong')

    // console.log(subscribedChannels);

    res.status(200).json(
        new ApiResponse(200 , subscribedChannels , "subscribed channels loaded")
    )
})