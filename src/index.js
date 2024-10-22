// require('dotenv').config({path:'./env'})
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from './app.js'

dotenv.config({
  path: './.env'
})

connectDB()
  .then(() => {
    console.log("MongoDB connection established successfully!");
    app.on("error", (error) => {
      console.log("error : ", error);
    })

    const port = process.env.PORT || 8000;
    if (isNaN(port) || port <= 0) {
      throw new Error(`Invalid port number: ${port}`);
    }

    try {
      app.listen(port, () => {
        console.log(`server is running on port : ${port}`);
      });
    } catch (error) {
      console.log("Error starting server: ", error);
      console.error("Error starting server: ", error.message);
      console.error("Error Stack: ", error.stack);
      process.exit(1); // Exit the process with failure
    }
  })
  .catch((error) => {
    console.log("MONGO db connection failed !!!!", error)
    console.error("MONGO db connection failed: ", error.message);
    console.error("Error Stack: ", error.stack);
    console.log("MongoDB connection string:", process.env.MONGODB_URI);
    process.exit(1); 
  })



// import express from 'express';
// const app = express();

// (async()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

//         app.on("error",(error)=>{
//             console.log("error : ",error);
//             throw error;
//         })

//         app.listen(process.env.PORT , ()=>{
//             console.log(`App is listening on port ${process.env.PORT}`);
//         })
//     }
//     catch(error){
//         console.log('Error connecting to MongoDB : ', error)
//         throw error;
//     }
// })

