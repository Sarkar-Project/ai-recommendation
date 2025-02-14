
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all origins (adjust as needed)
app.use(cors());

// Parse JSON bodies
app.use(express.json());

/**
 * Middleware to check for a valid API key in the request header.
 * Clients must include the header "x-api-key" with the correct value.
 */
function checkApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (apiKey && apiKey === process.env.CLIENT_API_KEY) {
    return next();
  }
  return res.status(403).json({ error: "Forbidden: Invalid API key." });
}

// Apply the API key check to the /filter-songs endpoint
app.use("/filter-songs", checkApiKey);

// Initialize Gemini AI with your key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * POST /filter-songs
 * Expects: { songs: [ { title, album, artist, language, year }, ... ] }
 * Returns: JSON containing filteredSongs and a parsed suggestedSongs JSON.
 */
app.post("/filter-songs", async (req, res) => {
  try {
    const songs = req.body.songs || [];

    // Create a prompt instructing Gemini to output only valid JSON
    const prompt = `
Return your output as valid JSON. The JSON should have a key "suggestions" that holds an array of objects.
Each object must have "name", "artist", and "reason" keys. Do not include any markdown or extra text.
Suggest songs similar to: ${JSON.stringify(songs)}
    `;

    // Set up the model with a system instruction to enforce JSON output
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash", // or "Gemini 2.0 Flash" if preferred
      systemInstruction: {
        role: "model",
        parts: [
          {
            text: "You are an expert music recommender. Only output valid JSON without markdown formatting or extra text."
          }
        ]
      }
    });

    // Generate content using Gemini
    const response = await model.generateContent(prompt);
    let output = response.response.text();

    // Remove possible markdown code fences (```json and ```)
    output = output.replace(/```json\s*|```/g, "");

    // Parse the cleaned output as JSON
    const suggestions = JSON.parse(output);

    // Send the response back to the client
    res.json({
      filteredSongs: songs,
      suggestedSongs: suggestions
    });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: "Error generating song suggestions" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
