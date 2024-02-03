import mongoose from 'mongoose'
import mongooseAggPaginate from 'mongoose-aggregate-paginate-v2'

const SubscriptionSchema =new mongoose.Schema({
  subscriber:
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    channel:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }

}, {timestamps : true})



const SubscriptionModel = mongoose.model("Subscription" , SubscriptionSchema)

export {SubscriptionModel}