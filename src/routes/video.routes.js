import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
    viewshandler,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import multer from 'multer';

// File type validation function
const fileFilter = (req, file, cb) => {
    if (file.fieldname === "video") {
        // Check if the uploaded file is a video
        if (file.mimetype.startsWith("video/")) {
            cb(null, true); // Accept the file
        } else {
            cb(new Error("Invalid file type for video. Please upload a video file."), false); // Reject the file
        }
    } else if (file.fieldname === "thumbnail") {
        // Check if the uploaded file is an image
        if (file.mimetype.startsWith("image/")) {
            cb(null, true); // Accept the file
        } else {
            cb(new Error("Invalid file type for thumbnail. Please upload an image file."), false); // Reject the file
        }
    } else {
        cb(new Error("Invalid file field."), false); // Reject any other files
    }
};

const uploadWithValidation = multer({
    storage: upload.storage, // Use the storage setup from your existing multer middleware
    fileFilter: fileFilter,  // Apply the file filter
});

const router = Router();

// Apply verifyJWT middleware to all routes
router.use(verifyJWT);

router
    .route("/")
    .get(getAllVideos) // Fetches all videos, authentication required
    .post(
        uploadWithValidation.fields([ // Middleware to handle file uploads with validation for video and thumbnail
            {
                name: "video", // Expecting the video file field with name 'video'
                maxCount: 1, // Only one video file can be uploaded at a time
            },
            {
                name: "thumbnail", // Expecting the thumbnail image field with name 'thumbnail'
                maxCount: 1, // Only one thumbnail image can be uploaded at a time
            },
        ]),
        publishAVideo // Controller to handle the video publishing
    );

router
    .route("/:videoId")
    .get(getVideoById) 
    .delete(deleteVideo) // Deletes a video by its ID, authentication required
    .patch(
        uploadWithValidation.fields([ // Middleware to handle file updates for video and thumbnail with validation
            {
                name: "videoFile", // Optional: To update the video file
                maxCount: 1, 
            },
            {
                name: "thumbnail", // Optional: To update the thumbnail image
                maxCount: 1,
            },
        ]),
        updateVideo // Controller to handle updating video details, authentication required
    );

router.route("/toggle/publish/:videoId")
    .patch(togglePublishStatus); 

router.route("/views/:videoId").post(viewshandler);

export default router;
