import express from "express"
import userRoutes from "./routes/userRoutes.js"

const app = express();

const port = 4000;

// Middleware to parse JSON bodies
app.use(express.json());

// Mount your routes
app.use('/api', userRoutes); // Endpoints will be /api/users and /api/users/:id


app.listen(port,(req,res)=>{
    console.log(`server running on port ${port}`);
})