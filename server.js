import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import connectDatabase from './db/connectDatabase.js';
import donationRoutes from './Routes/donationRoutes.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Middleware for parsing JSON and URL-encoded data (for other routes)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Database connection
connectDatabase();

// API routes
app.use('/api/donations', donationRoutes);  // This includes the /webhook route

// Default route
app.get("/", (req, res) => {
  res.json({ message: "Hello from Server" });
});

// Start the server
const port = process.env.PORT || 6000;

const server = app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
