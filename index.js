require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = process.env.PORT || 3000;

// Configure CORS to allow all origins (or restrict as needed)
const corsOptions = {
  origin: (origin, callback) => {
    // For example, allow all origins:
    callback(null, true);
  }
};

app.use(cors(corsOptions));
app.use(express.json());

// Custom middleware to verify API key in request headers
function checkApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (apiKey && apiKey === process.env.MY_API_KEY) {
    next();
  } else {
    res.status(403).json({ error: "Forbidden. Invalid API key." });
  }
}

// Apply API key check on protected routes
app.use("/filter-songs", checkApiKey);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/song", (req, res) => {
  res.json({ message: "API running..." });
});

app.post("/filter-songs", async (req, res) => {
  const SongsforAI = req.body.songs || [];
  const filteredSongs = SongsforAI.map((element) => ({
    title: element.title,
    album: element.album,
    artist: element.artist,
    language: element.language,
    year: element.year,
  }));

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Suggest songs similar to the following: ${JSON.stringify(filteredSongs)}`;
    const response = await model.generateContent(prompt);
    // If you expect JSON output without markdown, adjust your prompt/system instructions accordingly.
    const output = response.response.text().replace(/```json\s*|```/g, "");
    const suggestedSongs = JSON.parse(output);
    res.json({ filteredSongs, suggestedSongs });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: "Error generating song suggestions" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
