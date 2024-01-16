import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'

const UserSchema =new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true  // it will get searchable when index is true (already its searchable but idex true will optimized it)
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String, // cloudinary url for image
        required:true
    },
    coverImage:{
        type:String
    },
    password:{
        type:String,
        required:[true , 'Password is required'],
    },
    refreshToken:{
        type:String
    },
    watchHistory :[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Video"
        }
    ]
}, {timestamps : true})

UserSchema.pre("save" , async function (next){

    if(this.isModified("password")){
        this.password =await bcryptjs(this.password , 10)
    }
    next()
})

UserSchema.methods.isPasswordCorrect = async function(password){
    return await bcryptjs.compare(password , this.password)
}

UserSchema.methods.generateAccessToken = function(){
    jwt.sign(
        {
            payload:{
                _id:this._id,
                email:this.email,
                username:this.username,
                fullName:this.fullName
            }
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
UserSchema.methods.generateRefreshToken = function(){
    jwt.sign(
        {
            payload:{
                _id:this._id,
                
            }
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

const UserModel = mongoose.model("User" , UserSchema)

export {UserModel}