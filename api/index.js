const express = require("express");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
const fs = require("fs");
const cors = require("cors"); // Import cors
const app = express();

// Manually add CORS headers for all routes
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://www.medspajobs.com"); // Allow requests from your frontend
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

// Enable CORS for all routes as backup (optional)
app.use(
  cors({
    origin: "https://www.medspajobs.com", // Allow requests from your frontend
  })
);

// Test route to check if the API is working
app.get("/", (req, res) => {
  res.status(200).send("Working Successfully!");
});

// Use multer to handle file uploads, store in /tmp/ (required for serverless)
const upload = multer({ dest: "/tmp/" });

// Upload route
app.post("/upload", upload.single("resume_file"), async (req, res) => {
  const { partner_key, secret_key, first_name, last_name, email } = req.body;
  console.log("This is inside of the request from a custom endpoint");
  console.log(partner_key, secret_key, first_name, last_name, email);
  const resumeFilePath = req.file.path;

  const formData = new FormData();
  formData.append("partner_key", partner_key);
  formData.append("secret_key", secret_key);
  formData.append("first_name", first_name);
  formData.append("last_name", last_name);
  formData.append("email", email);
  formData.append("resume_file", fs.createReadStream(resumeFilePath));

  try {
    const response = await axios.post(
      "https://api.talentinc.com/v1/resume",
      formData,
      {
        headers: formData.getHeaders(),
      }
    );
    console.log("This is inside of the talent endpoint");
    console.log(response.data);

    res.status(200).json(response.data); // Send response from the API back to the client
  } catch (error) {
    console.error("Stevens Upload error:", error); // Inside your catch block

    if (error.response && error.response.status === 409) {
      // If a 409 Conflict occurs (duplicate resume or email)
      res.status(409).json({
        message: "Duplicate detected: Resume or email already exists.",
      });
    } else {
      res.status(500).json({
        message: "Error uploading resume",
        error: error.response?.data || error.message,
      });
    }
  } finally {
    // Clean up the file after upload
    fs.unlinkSync(resumeFilePath);
  }
});

app.listen(3000, () => console.log("Server ready on port 3000."));

// Export the app for serverless function handling
module.exports = app;
