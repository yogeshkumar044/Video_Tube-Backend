import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    console.log("toggle subscription starts", req.body);
    const { channelId ,subscriberId } = req.body;
    // console.log(req.body,"toggle")

    if (!channelId) {
        throw new ApiError(400, "Channel ID is required" );
    }
    if (!subscriberId) {
        throw new ApiError(400, "subscriber ID is required");
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId,
    });

    let message;

    if (existingSubscription) {
        await Subscription.findByIdAndDelete(existingSubscription._id);
        message = "Unsubscribed successfully";
        console.log("Unsubscribed successfully");
    } else {
        const subscription = await Subscription.create({
            subscriber: subscriberId,
            channel: channelId,
        });

        if (!subscription) {
            throw new ApiError(500, "Something went wrong while subscribing to the channel");
        }

        message = "Subscribed successfully";
        console.log("Subscribed successfully");
    }

    return res.status(200).json(
        new ApiResponse(200, null, message)
    );
});


const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId , userId } = req.body;
    // console.log(req.body,"getgetgetet")

    if (!channelId) {
        throw new ApiError(400, "Channel ID is required");
    }
    if (!userId) {
        throw new ApiError(400, "user ID is required");
    }

    const subscribers = await Subscription.find({ channel: channelId })
        .populate('subscriber', 'username email');

    const isSubscribed = await Subscription.exists({
        channel: channelId,
        subscriber: userId
    });

    // Prepare the response data
    const response = {
        subscribers: subscribers.map(sub => ({
            username: sub.subscriber.username,
            email: sub.subscriber.email,
        })),
        subscriberCount: subscribers.length,
        isSubscribed: Boolean(isSubscribed)
    };

    // Return the response
    return res.status(200).json(new ApiResponse(200, response, "Subscribers fetched successfully"));
});




const getSubscribedChannels = asyncHandler(async (req, res) => {
    console.log("getSubscribedChannels start" , req.body)
    const { subscriberId } = req.body;

    if (!subscriberId) {
        throw new ApiError(400, "Subscriber ID is required");
    }
 
    const subscriptions = await Subscription.find({ subscriber: subscriberId }).populate('channel', 'name description');

    // if (!subscriptions) {
    //     throw new ApiError(404, "No subscriptions found for this user");
    // }

    console.log(`Found ${subscriptions.length} channels for subscriber: ${subscriberId}`);

    return res.status(200).json(new ApiResponse(200, subscriptions, "Subscribed channels fetched successfully"));
});



export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}