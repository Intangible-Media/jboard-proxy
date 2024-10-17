const express = require("express");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
const fs = require("fs");
const cors = require("cors");
const app = express();

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

// Test route to check if the API is working
app.get("/", (req, res) => {
  res.status(200).send("Working Successfully!");
});

// Use multer to handle file uploads, store in /tmp/
const upload = multer({ dest: "/tmp/" });

// Upload route
app.post("/upload", upload.single("resume_file"), async (req, res) => {
  const { partner_key, secret_key, first_name, last_name, email } = req.body;
  console.log("This is inside of the request from a custom endpoint");
  console.log(partner_key, secret_key, first_name, last_name, email);

  const resumeFilePath = req.file?.path; // Check if file exists to avoid undefined errors

  if (!resumeFilePath) {
    return res.status(400).json({ error: "File is required" });
  }

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
    fs.unlinkSync(resumeFilePath); // Clean up the file after upload
  }
});

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;
