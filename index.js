require("dotenv").config();
const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();
const port = process.env.myport || 3000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.json()); // Middleware to parse JSON requests
app.post("/song", (req, res) => {
  res.json({ message: "api running..." });
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

  // Generate song suggestions using Gemini AI
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Suggest songs similar to the following: ${JSON.stringify(
      filteredSongs
    )}`;
    const response = await model.generateContent(prompt);
    const suggestedSongs = response.response.text();

    res.json({ filteredSongs, suggestedSongs });
  } catch (error) {
    res.status(500).json({ error: "Error generating song suggestions" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
