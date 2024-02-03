import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from 'dotenv'


dotenv.config()

connectDB()
.then(()=>{
    app.listen(process.env.PORT , ()=>{
        console.log(`server running on port ${process.env.PORT}`);
    })
})
.catch((err)=> console.log(`db error : ${err}`))