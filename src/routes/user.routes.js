import { Router } from "express";
import { getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logout, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import VerifyJwt from "../middlewares/auth.middleware.js";

const router = Router()

router.route('/register').post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
    )
router.route('/login').post(loginUser)


// secured routes --------------
router.route('/logout').post(VerifyJwt,logout)
router.route('/refreshToken').post(VerifyJwt,refreshAccessToken)
router.route('/channel/:username').get(VerifyJwt,getUserChannelProfile)
router.route('/current-user').get(VerifyJwt,getCurrentUser)
router.route('/watchHistory').get(VerifyJwt,getWatchHistory)



export default router