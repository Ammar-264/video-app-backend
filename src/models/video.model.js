import mongoose from 'mongoose'
import mongooseAggPaginate from 'mongoose-aggregate-paginate-v2'

const VideoSchema =new mongoose.Schema({
   videoFile:{
    type:String,
    required:true
   },

   thumbnail:{
    type:String,
    required:true
   },

   owner:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User'
   },

   title:{
    type:String,
    required:true,
   },

   description:{
    type:String,
    required:true,
   },

   duration:{
    type:Number,
    required:true
   },

   views:{
    type:Number,
    default:0
   },

   isPublished:{
    type:Boolean,
    default:true
   },

}, {timestamps : true})


VideoSchema.plugin(mongooseAggPaginate)

const VideoModel = mongoose.model("Video" , VideoSchema)

export {VideoModel}