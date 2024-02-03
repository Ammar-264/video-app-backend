import mongoose from 'mongoose'
import mongooseAggPaginate from 'mongoose-aggregate-paginate-v2'

const HistorySchema =new mongoose.Schema({
  user:
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    video:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
    }

}, {timestamps : true})



const HistoryModel = mongoose.model("History" , HistorySchema)

export {HistoryModel}