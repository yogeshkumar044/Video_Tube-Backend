import mongoose, {isValidObjectId} from "mongoose"
import { Video } from '../models/video.models.js';
import {User} from '../models/user.models.js';
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        query, 
        sortBy = 'createdAt', 
        sortType = 'desc', 
        ownerId = null 
    } = req.query;

    try {
        const pipeline = [];
        const pageNumber = Math.max(1, parseInt(page));
        const pageSize = Math.max(1, parseInt(limit));

        // Base match conditions
        const matchStage = {};

        // Handle ownerId if provided
        if (ownerId && ownerId !== "null") {
            if (mongoose.Types.ObjectId.isValid(ownerId)) {
                matchStage.owner = new mongoose.Types.ObjectId(ownerId);
            } else {
                return res.status(400).json(new ApiError(400, "Invalid ownerId format"));
            }
        }

        // If query exists, use custom scoring for prioritized search
        if (query?.trim()) {
            const searchTerm = query.trim();
            
            pipeline.push(
                {
                    $match: {
                        $or: [
                            { title: { $regex: searchTerm, $options: 'i' } },
                            { description: { $regex: searchTerm, $options: 'i' } }
                        ],
                        ...matchStage
                    }
                },
                {
                    $addFields: {
                        searchPriority: {
                            $switch: {
                                branches: [
                                    // Exact title match (highest priority)
                                    {
                                        case: { 
                                            $regexMatch: { 
                                                input: { $toLower: "$title" }, 
                                                regex: `^${searchTerm.toLowerCase()}$`
                                            } 
                                        },
                                        then: 3
                                    },
                                    // Partial title match (medium priority)
                                    {
                                        case: { 
                                            $regexMatch: { 
                                                input: { $toLower: "$title" }, 
                                                regex: searchTerm.toLowerCase()
                                            } 
                                        },
                                        then: 2
                                    },
                                    // Description match (lowest priority)
                                    {
                                        case: { 
                                            $regexMatch: { 
                                                input: { $toLower: "$description" }, 
                                                regex: searchTerm.toLowerCase()
                                            } 
                                        },
                                        then: 1
                                    }
                                ],
                                default: 0
                            }
                        }
                    }
                },
                {
                    $sort: {
                        searchPriority: -1,
                        [sortBy]: sortType === 'desc' ? -1 : 1
                    }
                }
            );
        } else {
            // If no search query, use regular sorting and matching
            pipeline.push(
                {
                    $match: matchStage
                },
                {
                    $sort: {
                        [sortBy]: sortType === 'desc' ? -1 : 1
                    }
                }
            );
        }

        // Add randomization if no search query
        if (!query?.trim()) {
            pipeline.push({ $sample: { size: pageSize * 10 } });
        }

        // Add pagination stages
        pipeline.push(
            {
                $skip: (pageNumber - 1) * pageSize
            },
            {
                $limit: pageSize
            }
        );

        // Execute the pipeline
        const videos = await Video.aggregate(pipeline);

        // Get total count for pagination
        const countPipeline = [
            {
                $match: query?.trim() 
                    ? {
                        $or: [
                            { title: { $regex: query, $options: 'i' } },
                            { description: { $regex: query, $options: 'i' } }
                        ],
                        ...matchStage
                    }
                    : matchStage
            },
            {
                $count: 'total'
            }
        ];

        const [countResult] = await Video.aggregate(countPipeline);
        const totalCount = countResult?.total || 0;

        return res.status(200).json(
            new ApiResponse(200, videos, "Videos fetched successfully", {
                total: totalCount,
                totalPages: Math.ceil(totalCount / pageSize),
                currentPage: pageNumber,
                hasNextPage: pageNumber < Math.ceil(totalCount / pageSize)
            })
        );

    } catch (error) {
        console.error("Error in getAllVideos:", error);
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
});


const publishAVideo = asyncHandler(async (req, res) => {
    console.log("publishAVideo start")
    const { title, description } = req.body;

    if ([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Title and description are required");
    }

    const videoLocalPath = req.files?.video[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!videoLocalPath) { 
        throw new ApiError(400, "Video is required");
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required");
    }


    const videoPath = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);



    const videoDuration = videoPath?.duration || 0;


    const user = req.user;
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const video = await Video.create({
        title,
        description,
        videoFile: videoPath.url,
        thumbnail: thumbnail.url,
        duration: videoDuration,
        owner: user,
    });


    if (!video) {
        throw new ApiError(500, "Something went wrong while uploading the video");
    }

    console.log("video upload successfully !!!")

    return res.status(201).json(
        new ApiResponse(200, video, "Video uploaded successfully")
    );
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params; // Extract videoId from the request parameters
    console.log(videoId)

    try {
        // Validate the provided videoId
        if (!mongoose.Types.ObjectId.isValid(videoId)) {
            return res.status(400).json(new ApiError(400, "Invalid videoId format"));
        }

        // Find the video by its ID
        const video = await Video.findById(videoId);

        // If the video is not found, return a 404 error
        if (!video) {
            return res.status(404).json(new ApiError(404, "Video not found"));
        }

        // console.log(video)
        // If the video is found, return it in the response
        return res.status(200).json(
            new ApiResponse(200, video, "Video fetched successfully")
        );

    } catch (error) {
        console.error("Error in getVideoById:", error.message);
        res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500, error.message));
    }
});


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})


const viewshandler = asyncHandler(async (req, res) => {
    // console.log("viewshandelr starts");

    const { videoId ,channelId } = req.body;

    // console.log(videoId , channelId, req.body);

    const video = await Video.findById(videoId);
    const user = await User.findById(channelId);


    if (!video) {
        return res.status(404).json({ message: "Video not found" });
    }

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    video.views = (video.views || 0) + 1;

    // Remove previous watch if exists (convert ObjectId to string for comparison)
    user.watchHistory = user.watchHistory.filter(
        id => id.toString() !== videoId.toString()
    );
    
    user.watchHistory.push(videoId);

    await Promise.all([
        video.save({ validateBeforeSave: true }),
        user.save({ validateBeforeSave: true })
    ]);


    return res.status(200).json(
        new ApiResponse(200, video, "Video viewed successfully")
    );

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    viewshandler
}