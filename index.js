
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS if you plan to call this from a different origin
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Initialize Gemini AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);



app.post("/filter-songs", async (req, res) => {
  try {
    // 1. Extract the array of songs from the request body
    const SongsforAI = req.body.songs || [];

    // 2. Create a prompt instructing Gemini to return valid JSON only
    const prompt = `
Return your output as valid JSON. The JSON should have a key "suggestions" that holds an array of objects. 
Each object must have "name", "artist", and "reason" keys. Do not include markdown or triple backticks.
Suggest songs similar to: ${JSON.stringify(SongsforAI)}
`;

    // 3. (Optional) Provide system instructions to further ensure JSON output
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // or "Gemini 2.0 Flash"
      systemInstruction: {
        role: "model",
        parts: [
          {
            text: `
You are an expert music recommender. 
Only output valid JSON in your final response. 
No markdown formatting or extra text.
          `
          }
        ]
      }
    });

    // 4. Call Gemini to generate content
    const response = await model.generateContent(prompt);

    // 5. Get the raw text. Sometimes Gemini might still add extra backticks or text
    let output = response.response.text();

    // Strip out possible triple backticks or "```json"
    output = output.replace(/```json\s*|```/g, "");

    // 6. Parse the JSON string
    const parsedJSON = JSON.parse(output);

    // 7. Return a JSON response to the client
    res.json({
      filteredSongs: SongsforAI,
      suggestedSongs: parsedJSON
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
