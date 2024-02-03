import mongoose from "mongoose";
import { VideoModel } from "../models/video.model.js";
import { ApiError } from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { UserModel } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { HistoryModel } from "../models/history.model.js";


// video upload but dont publish
export const uploadVideo = asyncHandler(async (req,res)=>{

    if(!req.user) throw new ApiError(404 , 'user not logedIn')

    const {title , description} = req.body

    if(!title.trim() || !description.trim()) throw new ApiError(400 , "title and description required")

    // check for images  -------------------------------
  const videoLocalPath = req.files.video && req.files.video[0]?.path;
  const thumbnailLocalPath =
    req.files.thumbnail && req.files.thumbnail[0]?.path;

    if (!videoLocalPath || !thumbnailLocalPath) throw new ApiError(400, "video and thumbnail  file is required");

    const videoUploadResponse = await uploadOnCloudinary(videoLocalPath);
    const thumbnailUploadResponse = await uploadOnCloudinary(thumbnailLocalPath);


    if(!videoUploadResponse ) throw new ApiError(500 , "video not uploaded")

    if(!thumbnailUploadResponse ) throw new ApiError(500 , "thumbnail not uploaded")

    let data = {
        videoFile:videoUploadResponse.url,
        thumbnail:thumbnailUploadResponse.url,
        owner:req.user._id,
        title,
        description,
        duration:Math.round(videoUploadResponse.duration),
        isPublished:false
    }

    const uploadVideo = await VideoModel.create(data)

    if(!uploadVideo) throw new ApiError(500 , 'something went wrong')

    res.status(200).json(
        new ApiResponse(200 , uploadVideo , "video uploaded successfully")
    )

})

// video update 
export const updateVideo = asyncHandler(async (req,res)=>{})

// video delete
export const deleteVideo = asyncHandler(async (req,res)=>{

    if(!req.user) throw new ApiError(404 , "unauthorized user")

    const {videoId} = req.params

    if(!videoId.trim()) throw new ApiError(404 , "Video Id required")

    const getVideo = await VideoModel.findById(videoId)

    if(!getVideo) throw new ApiError(404 , "video not found")

    if(String(getVideo.owner) != req.user._id) throw new ApiError(404 , "Invalid owner")

    // checking if video already exists in user watch history
    const checkLogedinUserHistory = await HistoryModel.find({video:videoId })

    // if exists in history then first delete from history
    if(checkLogedinUserHistory.length > 0){
        await HistoryModel.deleteMany({
            video:videoId
        })   
    }

    const deletedVideo = await VideoModel.findByIdAndDelete(videoId)
    
    if(!deletedVideo) throw new ApiError(500 , "something went wrong")

    res.status(200).json(
        new ApiResponse(200 , {} , "video deleted successfully")
    )
})

// change publish status 
export const changePublishStatus = asyncHandler(async (req,res)=>{})

// get single video 
export const getSingleVideo = asyncHandler(async (req,res )=>{
    const videoId = req.video


    if(!videoId) throw new ApiError(400 , "video id required")

    const getVideo = await VideoModel.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(videoId)
            }
        },
    {
        $lookup:{
            from:"users",
            localField:"owner",
            foreignField:'_id',
            as:"publisher",
            pipeline:[
                {
                    $lookup:{
                        from:"subscriptions",
                        localField:"_id",
                        foreignField:"channel",
                        as:"subscribers"

                    }
                },
                {
                    $addFields:{
                        isSubscribed: {
                            $cond:{
                                if : {$eq : [req.user._id , "$_id"]},
                                then: "cant",
                                else:{
                                    $cond: {
                                        if: { $in: [req.user._id, "$subscribers.subscriber"] },
                                        then: true,
                                        else: false
                                    }
                                }
                            }
                        },
                        subscribersCount:{
                            $size:"$subscribers"
                        }
                    }
                },
                {
                    $project:{
                        fullName:1,
                        avatar:1,
                        subscribersCount:1,
                        isSubscribed:1,
                        username:1
                    }
                }
            ]
        },
        
    },
    {
        $project:{
            videoFile:1,
            title:1,
            description:1,
            duration:1,
            views:1,
            publisher:1
        }
    }
    ])

    

    if(!getVideo.length) throw new ApiError("404" , "video not found")

    res.status(200 ).json(
        new ApiResponse(200 , getVideo[0] , "video loaded")
    )
})

export const updateVideoViewAndHistory = asyncHandler(async (req,_ , next)=>{
    if(!req.user) throw new ApiError(404 , "unauthorized user")

    const userId = req.user._id

    const {videoId} = req.params

    if(!videoId.trim()) throw new ApiError(400 , "Video id required")

    // finding video
    const videoDoc = await VideoModel.findById(videoId)

    if(!videoDoc) throw new ApiError(500 , "something went wrong")

    // checking if video already exists in user watch history
    const checkLogedinUserHistory = await HistoryModel.findOne({user:userId , video:videoId  })
   

    if(!checkLogedinUserHistory && String(userId) !== String(videoDoc.owner)){
        // condition ---> if video is not in history and logedin user is not the owner of video
        // then =>

            videoDoc.views += 1 // increment 1 in video views
            await videoDoc.save()
        }else{ // other wise =>
            // delete video from history to add it again in start as user watched it again
            await HistoryModel.findOneAndDelete({
                user:userId,
                video:videoId
            })
        }

        // adding video in watch history
        await HistoryModel.create( {user:userId,video:videoId})

        req.video = videoId

        next()


})
// get all videos

export const getChannelVideos = asyncHandler(async (req,res)=>{
    if(!req.user ) throw new ApiError(404 , "unauthorized user")

    const {username} = req.params

    if (!username?.trim()) throw new ApiError(404, "username not found");


    const userDetail = await UserModel.findOne({username})

    if(!userDetail) throw new ApiError(404 , "channel not found")

    const videos = await VideoModel.find({owner:userDetail._id})

    if(!videos) throw new ApiError(500 , "something went wrong")

    res.status(200).json(
        new ApiResponse(200 , videos , "videos loaded succesfully")
    )
})