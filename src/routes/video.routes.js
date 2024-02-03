import { Router } from "express";
// import { upload } from "../middlewares/multer.middleware.js";
import VerifyJwt from "../middlewares/auth.middleware.js";
import { deleteVideo, getChannelVideos, getSingleVideo, updateVideoViewAndHistory, uploadVideo } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()


router.route('/upload-video').post(VerifyJwt, upload.fields([
    {
        name : "video" ,
        maxCount:1
    },
    {
        name : "thumbnail" ,
        maxCount:1
    },
]),uploadVideo)
router.route('/video/:videoId').get(VerifyJwt,updateVideoViewAndHistory ,getSingleVideo )
router.route('/delete/:videoId').delete(VerifyJwt,deleteVideo )
router.route('/channel/:username').get(VerifyJwt,getChannelVideos)



export default router