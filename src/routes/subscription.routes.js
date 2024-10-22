import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/t/:channelId").post(toggleSubscription);
router.route("/u/:subscriberId").post(getUserChannelSubscribers);
router.route("/c/:channelId").post(getSubscribedChannels);                                                                                                                          

export default router