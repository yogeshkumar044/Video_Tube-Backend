import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const getVideoComments = asyncHandler(async (req, res) => {
    // console.log("Get video comments starts");

    const { videoId } = req.params;
    const { page = 1, limit = 10, query, sortBy = 'createdAt', sortType = 'desc' } = req.query;

    // console.log("Video ID:", videoId);
    
    try {
        const videoObjectId = new mongoose.Types.ObjectId(videoId);
        
        const queryFilter = { video: videoObjectId }; 
        
        if (query?.trim()) {
            queryFilter.content = { $regex: query, $options: 'i' }; 
        }

        const pageNumber = Math.max(1, parseInt(page)); // Default page is 1, ensure no negative values
        const pageSize = Math.max(1, parseInt(limit)); // Default limit is 10, ensure at least 1 result per page

        const pipeline = [
            { $match: queryFilter },  // Filter comments based on videoId and optional content query
            { $sort: { [sortBy]: sortType === 'desc' ? -1 : 1 } }, // Sort comments by the chosen field and direction
            { $skip: (pageNumber - 1) * pageSize },  // Skip comments for previous pages (for pagination)
            { $limit: pageSize }  // Limit the number of comments returned to the page size
        ];

        const comments = await Comment.aggregate(pipeline);  
        const totalCount = await Comment.countDocuments(queryFilter);

        // If no comments are found, return a 404 error
        // if (!comments.length) {
        //     throw new ApiError(404, "No comments found for this video");
        // }

        // Return the comments along with metadata for pagination
        return res.status(200).json(
            new ApiResponse(200, { comments, totalCount }, "Comments fetched successfully", {
                total: totalCount,
                totalPages: Math.ceil(totalCount / pageSize),
                currentPage: pageNumber
            })
        );
    } catch (error) {
        console.error("Error in getVideoComments:", error.message);
        res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500, error.message));
    }
});
    




const addComment = asyncHandler(async (req, res) => {
    console.log("add comment starts");
    const {content , video} = req.body;
    // console.log(req.body)

    if ([content].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "comment is required");
    }

    const user = req.user;


    const comment = await Comment.create({
        content,
        video,
        owner:user,
    });

    if (!comment) {
        throw new ApiError(500, "Something went wrong while uploading the comment");
    }

    console.log("comment upload successfully");

    return res.status(201).json(
        new ApiResponse(200,comment,"comment upload successfully")
    );
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }