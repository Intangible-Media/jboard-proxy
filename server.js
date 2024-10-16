const express = require("express");
const axios = require("axios");
const cors = require("cors");
const multer = require("multer");
const FormData = require("form-data");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to enable CORS
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up Multer to handle file uploads
const upload = multer({ dest: "uploads/" });

// API Endpoint to handle the file upload
app.post("/upload-resume", upload.single("resume_file"), async (req, res) => {
  const { partner_key, secret_key, first_name, last_name, email } = req.body;
  const resumeFilePath = req.file.path; // Path to the uploaded file

  // Construct form data without the tags
  const formData = new FormData();
  formData.append("partner_key", partner_key);
  formData.append("secret_key", secret_key);
  formData.append("first_name", first_name);
  formData.append("last_name", last_name);
  formData.append("email", email);
  formData.append("resume_file", fs.createReadStream(resumeFilePath)); // Stream the file

  try {
    // Send request to Talent Inc. API
    const response = await axios.post(
      "https://api.talentinc.com/v1/resume",
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    // Send the API response back to the client
    res.json(response.data);
  } catch (error) {
    // Handle any error and send a response to the client
    res.status(error.response?.status || 500).json({
      message: "Error uploading resume",
      error: error.response?.data || error.message,
    });
  } finally {
    // Clean up the uploaded file
    fs.unlinkSync(resumeFilePath);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
