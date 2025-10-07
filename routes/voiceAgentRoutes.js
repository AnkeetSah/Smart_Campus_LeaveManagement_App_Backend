import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import protect from "../middleware/protect.js";

dotenv.config();
const router = express.Router();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ✅ Helper: Count working days between two dates (Mon–Fri)
function getWorkingDaysBetween(start, end) {
  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) { // 0 = Sunday, 6 = Saturday
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

router.post("/ask", protect, async (req, res) => {
  console.log(req.user);
  try {
    const {
      userResponse,
      previousQuestion = "",
      leaveData = {},
      userLocation = "",
      user,
    } = req.body;

    const today = new Date().toISOString().split("T")[0];

    // Helper: parse and validate date string, return YYYY-MM-DD or null if invalid
    const parseDate = (input) => {
      const d = new Date(input);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().split("T")[0];
    };

    // ✅ Date validation based on question context
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

    // ✅ Prompt for Gemini
    const prompt = `
You are a conversational AI helping ${user.name} fill out a college leave application form step-by-step. 
Return ONLY valid JSON — no greetings, no explanations, no markdown, no code fences.

**Rules:**
- Always use today's date ("${today}") for validation.
- Start date > today.
- End date > start date.
- Accept any date format, normalize to YYYY-MM-DD.
- Ask in this order:
   1. leaveType ["personal","medical","emergency","other"]
   2. fromDate
   3. toDate
   4. currentAttendance (number only, no % sign)
   5. reason
   6. emergencyContact (digits only)
   7. addressDuringLeave (optional)

**Context:**
Previous Question: "${previousQuestion}"
User Response: "${userResponse}"
Leave data so far:
${JSON.stringify(leaveData, null, 2)}

**Output format (strict):**
{
  "nextQuestion": "Short, friendly question",
  "leaveData": {
    "leaveType": "...",
    "fromDate": "...",
    "toDate": "...",
    "currentAttendance": "...",
    "attendanceAfterLeave": "...",
    "reason": "...",
    "emergencyContact": "...",
    "addressDuringLeave": "..."
  },
  "isComplete": true/false
}
`.trim();

    // ✅ Call Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    // ✅ Extract text safely
    let rawText = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    rawText = rawText.replace(/```json|```/g, "").trim();

    // ✅ Extract only JSON part if extra text exists
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Gemini did not return valid JSON");
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);

    // ✅ Attendance calculation if we have all required data
    if (
      parsedResponse.leaveData.fromDate &&
      parsedResponse.leaveData.toDate &&
      parsedResponse.leaveData.currentAttendance
    ) {
      const semStart = new Date(req.user.semesterStartDate);
      const semEnd = new Date(req.user.semesterEndDate);
      const totalWorkingDays = getWorkingDaysBetween(semStart, semEnd);
      const estimatedTotalClasses = totalWorkingDays * 4;

      const currentAttendance = Number(
        parsedResponse.leaveData.currentAttendance
      );
      const attendedClasses =
        (currentAttendance / 100) * estimatedTotalClasses;

      // Leave period working days
      const leaveDays = getWorkingDaysBetween(
        new Date(parsedResponse.leaveData.fromDate),
        new Date(parsedResponse.leaveData.toDate)
      );

      const missedLeaveClasses = leaveDays * 4;
      const newTotalClasses = estimatedTotalClasses + missedLeaveClasses;
      const attendanceAfterLeave =
        (attendedClasses / newTotalClasses) * 100;

      parsedResponse.leaveData.attendanceAfterLeave =
        attendanceAfterLeave.toFixed(2);
    }

    return res.json(parsedResponse);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({
      error: "Gemini processing failed",
      message:
        error.message ||
        "An unexpected error occurred while generating the response.",
    });
  }
});

export default router;
