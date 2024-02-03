import { Router } from "express";
// import { upload } from "../middlewares/multer.middleware.js";
import VerifyJwt from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";

const router = Router()


router.route('/toggleSubscription/:channelId').post(VerifyJwt,toggleSubscription)
router.route('/getChannelSubscribers/:channelId').get(VerifyJwt,getUserChannelSubscribers)
router.route('/getSubscribedChannels').get(VerifyJwt,getSubscribedChannels)
// router.route('/un-subscribe/:channelId').post(VerifyJwt,unSubscribeChannel)



export default router