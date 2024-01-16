import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB =async ()=>{
    try {
        const connectionInstance =await mongoose.connect(`mongodb+srv://ammar26apr:ammar123@cluster0.eku1wqz.mongodb.net/${DB_NAME}`)

        console.log(`Mongo DB connected !! DB Host : ${connectionInstance.connection.host}`);
    } catch (error) {

        console.log(`Mongodb connection error ${error}`);       
    }
}

export default connectDB