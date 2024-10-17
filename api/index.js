const express = require("express");
const axios = require("axios");
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

// Middleware to parse incoming JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route to check if the API is working
app.get("/", (req, res) => {
  res.status(200).send("Working Successfully!");
});

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

  const formData = new FormData();
  formData.append("partner_key", partner_key);
  formData.append("secret_key", secret_key);
  formData.append("first_name", first_name);
  formData.append("last_name", last_name);
  formData.append("email", email);
  formData.append("resume_file", resume_file); // Appending file URL instead of file path

  try {
    const response = await axios.post(
      "https://api.talentinc.com/v1/resume",
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    console.log("Response from Talent Inc API:", response.data);

    res.status(200).json(response.data); // Send response from the API back to the client
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

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;
