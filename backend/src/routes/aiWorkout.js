const express = require("express");
const router = express.Router();
const aiWorkoutController = require("../controllers/aiWorkoutController");
const requireAuth = require("../middleware/requireAuth");
const { tryCatch } = require("../error/tryCatch");

router.use(requireAuth);

router.post("/workout-plan", tryCatch(aiWorkoutController.generateWorkoutPlan));

module.exports = router;
