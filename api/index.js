const express = require("express");
const axios = require("axios");
const cors = require("cors");
const multer = require("multer"); // Import Multer for handling file uploads
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const app = express();
const tmp = require("tmp"); // Temporary file storage

// Enable CORS for all routes with explicit headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "https://www.medspajobs.com");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Function to download file from URL
async function downloadFile(url) {
  const response = await axios({
    method: "GET",
    url: url,
    responseType: "stream",
  });

  // Create a temporary file
  const tempFile = tmp.fileSync();
  const filePath = tempFile.name;

  // Pipe the download stream to the temporary file
  const writer = fs.createWriteStream(filePath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(filePath)); // Resolve with the file path
    writer.on("error", reject); // Reject on error
  });
}

// Upload route
app.post("/upload", async (req, res) => {
  const { partner_key, secret_key, first_name, last_name, email, resume_file } =
    req.body;

  console.log("Incoming data:", {
    partner_key,
    secret_key,
    first_name,
    last_name,
    email,
    resume_file,
  });

  if (!resume_file) {
    return res.status(400).json({ error: "Resume file URL is required" });
  }

  try {
    // Download the file from the provided URL
    const downloadedFilePath = await downloadFile(resume_file);

    // Prepare form data for sending the binary file to Talent Inc.
    const formData = new FormData();
    formData.append("partner_key", partner_key);
    formData.append("secret_key", secret_key);
    formData.append("first_name", first_name);
    formData.append("last_name", last_name);
    formData.append("email", email);
    formData.append("resume_file", fs.createReadStream(downloadedFilePath)); // Upload the binary file

    // Make the request to the Talent Inc API
    const response = await axios.post(
      "https://api.talentinc.com/v1/resume",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    console.log("Response from Talent Inc API:", response.data);
    res.status(200).json(response.data);

    // Clean up the temporary file after the upload
    fs.unlinkSync(downloadedFilePath);
  } catch (error) {
    console.error("Error uploading resume:", error);

    if (error.response && error.response.status === 409) {
      res.status(409).json({
        message: "Duplicate detected: Resume or email already exists.",
      });
    } else {
      res.status(500).json({
        message: "Error uploading resume",
        error: error.response?.data || error.message,
      });
    }
  }
});

// Start the server
app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;
