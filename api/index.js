const express = require("express");
const axios = require("axios");
const cors = require("cors");
const FormData = require("form-data");
const app = express();
const fs = require("fs");

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

// Test route to check if the API is working
app.get("/", (req, res) => {
  res.status(200).send("Working Successfully!");
});

// Upload route with logging at every step
app.post("/upload", async (req, res) => {
  console.log("[INFO] Upload request received.");

  const { partner_key, secret_key, first_name, last_name, email, resume_file } =
    req.body;

  console.log("[INFO] Extracting data from request body:");
  console.log(`Partner Key: ${partner_key}`);
  console.log(`Secret Key: ${secret_key}`);
  console.log(`First Name: ${first_name}`);
  console.log(`Last Name: ${last_name}`);
  console.log(`Email: ${email}`);
  console.log(`Resume File URL: ${resume_file}`);

  if (!resume_file) {
    console.error("[ERROR] Resume file URL is missing.");
    return res.status(400).json({ error: "Resume file URL is required" });
  }

  try {
    console.log(
      "[INFO] Attempting to download the resume file from the provided URL..."
    );

    // Step 1: Download the file from the provided URL
    const fileResponse = await axios({
      url: resume_file,
      method: "GET",
      responseType: "stream", // Treat response as a stream (binary)
    });

    console.log("[INFO] Resume file downloaded successfully.");

    // Step 2: Create FormData and append the downloaded file (stream)
    const formData = new FormData();
    formData.append("partner_key", partner_key);
    formData.append("secret_key", secret_key);
    formData.append("first_name", first_name);
    formData.append("last_name", last_name);
    formData.append("email", email);
    formData.append("resume_file", fileResponse.data, "resume.pdf"); // Append file stream

    console.log("[INFO] FormData created with all the necessary fields.");

    // Step 3: Send the FormData to the Talent Inc API
    console.log("[INFO] Sending the FormData to Talent Inc API...");
    const response = await axios.post(
      "https://api.talentinc.com/v1/resume",
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    console.log("[INFO] Received response from Talent Inc API:");
    console.log(response.data);

    res.status(200).json(response.data);
  } catch (error) {
    console.error("[ERROR] Error occurred while uploading resume:");
    console.error(error);

    if (error.response && error.response.status === 409) {
      console.log("[INFO] Duplicate detected: Resume or email already exists.");
      res.status(409).json({
        message: "Duplicate detected: Resume or email already exists.",
      });
    } else {
      console.log("[INFO] General error while uploading resume.");
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
