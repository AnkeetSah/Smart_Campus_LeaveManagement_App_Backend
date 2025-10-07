import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import protect from "../middleware/protect.js";
dotenv.config();
const router = express.Router();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post("/ask", protect,async (req, res) => {
    
  try {
    const { userResponse, previousQuestion = "", leaveData = {}, userLocation = "", user } = req.body;
    console.log(user)
    const today = new Date().toISOString().split("T")[0];

    // Helper: parse and validate date string, return YYYY-MM-DD or null if invalid
    const parseDate = (input) => {
      const d = new Date(input);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().split("T")[0];
    };

    // Validate date input according to previous question context
    if (previousQuestion.toLowerCase().includes("start date")) {
      const startDate = parseDate(userResponse);
      if (!startDate || startDate <= today) {
        return res.json({
          nextQuestion:
            "Hmm, I think the dates might need a quick check. Can you clarify them for me again?",
          leaveData,
          isComplete: false,
        });
      }
      leaveData.fromDate = startDate;
    }

    if (previousQuestion.toLowerCase().includes("end date")) {
      const endDate = parseDate(userResponse);
      if (!endDate || !leaveData.fromDate || endDate <= leaveData.fromDate) {
        return res.json({
          nextQuestion:
            "Hmm, your end date seems to be before or on the start date. Can you give me the correct one?",
          leaveData,
          isComplete: false,
        });
      }
      leaveData.toDate = endDate;
    }

    const prompt = `
You are a warm, friendly, and intelligent conversational AI assistant helping a student of a college named ${user.name} fill out a leave application form step-by-step. 
Your goal is to make this process smooth, natural, and logical — as if a helpful human is guiding the student with empathy and awareness.
Keep analysing the user's responses and the context provided to ensure you ask the right questions and validate their answers.
Validate the user's responses to ensure they make sense and are appropriate for a student leave application.
Each question should be short, friendly, and human-like, guiding the user to provide the necessary information without overwhelming them.

**Important rules:**
- Always use today's date ("${today}") for date checks. its very important be strict with dates.
- If the user provides a date in the past, ask them to clarify it.
- You should not automatically update the leave Date — always question the user again if they give wrong dates.
- If the user provides an invalid date, ask them to clarify it.
- If user says a past date, say: "Hmm, I think the dates might need a quick check. Can you clarify them for me again?"
- Validate dates:
  * Start date must be after today.
  * End date must be after the start date.
- Don't repeat a question word-for-word if the user doesn't respond clearly — rephrase slightly.
- Don't ask for specific date formats; accept anything and convert to YYYY-MM-DD.
- Don't repeat questions for fields already answered.
- Auto-correct location using detected location: "${userLocation}"
- No emojis.

**Tone:**
- Warm, friendly, and encouraging.
- Conversational and natural.
- Empathetic and respectful.
- Student-focused, not corporate.
- Always in a human-like conversation mood with small talk.

**Logic rules:**
1. Validate Leave Type vs Reason:
   - If leave type is "personal" but reason is health/emergency, flag and re-confirm.
2. Polish Reason for clarity without changing meaning and the sentence should be detailed not very short.
3. Validate Dates strictly against "${today}".
4. Ask one question at a time in this order:
   1. leaveType it should be one of ["personal", "medical", "emergency"] or "other" no type error keep in this type only.
   2. fromDate always after today.
   3. toDate   always after fromDate.
   4. currentAttendance It should be a percentage (e.g., 75%). only keep percentage value data type in number. dont add % sign.
   5. reason
   6. emergencyContact (digits only) 
   7. addressDuringLeave (optional)

**Context:**
Previous Question: "${previousQuestion}"
User Response: "${userResponse}"
Leave data so far:
${JSON.stringify(leaveData, null, 2)}


**Output format (strict):**
\`\`\`json
{
  "nextQuestion": "Short, friendly, and human-like question",
  "leaveData": {
    "leaveType": "...",
    "fromDate": "...",
    "toDate": "...",
    "currentAttendance": "...",
    "reason": "...",
    "emergencyContact": "...",
    "addressDuringLeave": "..."
  },
  "isComplete": true/false
}
\`\`\`
`.trim();

    // Use the correct @google/genai syntax
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Use the model that works with your package
      contents: prompt,
    });

    let text = response.text;
    
    // Clean the response text
    text = text.replace(/```json|```/g, "").trim();

    const parsedResponse = JSON.parse(text);

    return res.json(parsedResponse);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({
      error: "Gemini processing failed",
      message: error.message || "An unexpected error occurred while generating the response.",
    });
  }
});

export default router;