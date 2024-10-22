import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    // console.log("toggle video like starts", req.body);

    const { videoId } = req.params;
    const { likedBy, LikedorDisliked } = req.body;

    // Check if videoId and likedBy are provided
    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }
    if (!likedBy) {
        throw new ApiError(400, "User ID (likedBy) is required");
    }

    // Find if there is an existing like/dislike record for this video by this user
    const existingLike = await Like.findOne({
        video: videoId,
        likedBy,
    });

    let message;

    if (existingLike) {
        // Check if LikedorDisliked value has changed, and update if necessary
        if (LikedorDisliked !== undefined && existingLike.LikedorDisliked !== LikedorDisliked) {
            existingLike.LikedorDisliked = LikedorDisliked;
            await existingLike.save();
            message = LikedorDisliked === 1 ? "Video liked" : "Video disliked";
            console.log(message);
        } else {
            // Remove the like/dislike if the same action is performed again
            await Like.findByIdAndDelete(existingLike._id);
            message = "Video like/dislike removed";
            console.log("Video like/dislike removed");
        }
    } else {
        // Create a new like/dislike entry if one doesn't exist
        const like = await Like.create({
            video: videoId,
            likedBy,
            LikedorDisliked,
        });

        if (!like) {
            throw new ApiError(500, "Something went wrong while liking the video");
        }

        message = LikedorDisliked === 1 ? "Video liked" : "Video disliked";
        console.log(message);
    }

    // Return the response with a status of 200 and the appropriate message
    return res.status(200).json(
        new ApiResponse(200, null, message)
    );
});



const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    // console.log("getLikedVideos starts", req.body); 

    const { videoId, channelId } = req.body;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    const LikedCount = await Like.countDocuments({
        video: videoId,
        LikedorDisliked: 1,
    });

    const DislikedCount = await Like.countDocuments({
        video: videoId,
        LikedorDisliked: 2,
    });

    const likeRecord = await Like.findOne({
        video: videoId,
        likedBy: channelId,
    });
    
    const isLiked = likeRecord ? likeRecord.LikedorDisliked : 3;
    // console.log("isLiked", likeRecord);
    

    // console.log(isLiked,"jk")

    let message;
   
    return res.status(200).json(
        new ApiResponse(200, {
            likedCount: LikedCount,
            dislikedCount: DislikedCount,
            isLiked, 
        },message)
    );
});


export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}