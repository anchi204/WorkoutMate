const Workout = require("../models/workoutModel");

const ALLOWED_GOALS = ["muscle gain", "fat loss", "strength", "general fitness"];
const ALLOWED_EXPERIENCE = ["beginner", "intermediate", "advanced"];

const clamp = (value, min, max) => Math.min(Math.max(Number(value), min), max);

const workoutPlanSchema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    summary: { type: "STRING" },
    weeklySchedule: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          day: { type: "STRING" },
          focus: { type: "STRING" },
          exercises: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" },
                sets: { type: "INTEGER" },
                reps: { type: "STRING" },
                restSeconds: { type: "INTEGER" },
                notes: { type: "STRING" },
              },
              required: ["name", "sets", "reps", "restSeconds", "notes"],
            },
          },
        },
        required: ["day", "focus", "exercises"],
      },
    },
    progressionTip: { type: "STRING" },
    safetyNote: { type: "STRING" },
  },
  required: ["title", "summary", "weeklySchedule", "progressionTip", "safetyNote"],
};

const generateWorkoutPlan = async (req, res) => {
  try {
    const {
      goal,
      experienceLevel,
      daysPerWeek,
      minutesPerWorkout,
      equipment,
      targetMuscles,
    } = req.body;

    if (!ALLOWED_GOALS.includes(goal)) {
      return res.status(400).json({ error: "Please select a valid fitness goal" });
    }

    if (!ALLOWED_EXPERIENCE.includes(experienceLevel)) {
      return res.status(400).json({ error: "Please select a valid experience level" });
    }

    const days = clamp(daysPerWeek, 1, 7);
    const minutes = clamp(minutesPerWorkout, 15, 120);

    if (!Array.isArray(equipment) || equipment.length === 0 || equipment.length > 10) {
      return res.status(400).json({ error: "Please select at least one equipment option" });
    }

    if (!Array.isArray(targetMuscles) || targetMuscles.length === 0 || targetMuscles.length > 8) {
      return res.status(400).json({ error: "Please select at least one target muscle" });
    }

    const recentWorkouts = await Workout.find({ user_id: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .select("title muscle_group reps load createdAt")
      .lean();

    const workoutHistory = recentWorkouts.map((workout) => ({
      exercise: workout.title,
      muscleGroup: workout.muscle_group,
      reps: workout.reps,
      loadKg: workout.load,
      date: workout.createdAt,
    }));

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: "AI planner is not configured. Add GEMINI_API_KEY to the backend environment.",
      });
    }

    const systemPrompt = [
      "You are WorkoutMate's workout-planning assistant.",
      "Create a practical gym workout plan from the user's goals and recent workout history.",
      "Use the history to avoid unnecessary repetition and to provide sensible progression when enough history exists.",
      "Never invent a user's previous performance.",
      "Do not provide medical diagnosis or treatment. Keep recommendations general and include a short safety note.",
      "Return only valid JSON matching the supplied schema.",
    ].join(" ");

    const userPrompt = JSON.stringify({
      goal,
      experienceLevel,
      daysPerWeek: days,
      minutesPerWorkout: minutes,
      equipment,
      targetMuscles,
      recentWorkoutHistory: workoutHistory,
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || "gemini-2.5-flash"}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json",
            responseSchema: workoutPlanSchema,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return res.status(502).json({ error: "The AI service could not generate a plan right now." });
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      return res.status(502).json({ error: "The AI service returned an empty plan." });
    }

    let plan;
    try {
      plan = JSON.parse(content);
    } catch {
      return res.status(502).json({ error: "The AI service returned an invalid plan." });
    }

    return res.status(200).json(plan);
  } catch (error) {
    console.error("Error in generateWorkoutPlan:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { generateWorkoutPlan };
