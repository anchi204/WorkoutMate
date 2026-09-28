import { useState } from "react";
import { Link } from "react-router-dom";
import { useGenerateWorkoutPlan } from "../hooks/useGenerateWorkoutPlan";
import "../scss/pages/aiWorkoutPlanner.scss";

const muscleOptions = [
  "chest",
  "back",
  "shoulder",
  "biceps",
  "triceps",
  "leg",
  "glute",
  "ab",
];

const equipmentOptions = [
  "full gym",
  "dumbbells",
  "barbell",
  "machines",
  "bodyweight",
];

export default function AIWorkoutPlanner() {
  const [goal, setGoal] = useState("general fitness");
  const [experienceLevel, setExperienceLevel] = useState("beginner");
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [minutesPerWorkout, setMinutesPerWorkout] = useState(60);
  const [equipment, setEquipment] = useState(["full gym"]);
  const [targetMuscles, setTargetMuscles] = useState(["chest", "back", "leg"]);
  const [plan, setPlan] = useState(null);

  const { generatePlan, loading, error } = useGenerateWorkoutPlan();

  const toggleItem = (value, current, setter) => {
    setter(
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!equipment.length || !targetMuscles.length) return;

    const result = await generatePlan({
      goal,
      experienceLevel,
      daysPerWeek: Number(daysPerWeek),
      minutesPerWorkout: Number(minutesPerWorkout),
      equipment,
      targetMuscles,
    });

    if (result) setPlan(result);
  };

  return (
    <div className="ai--planner--container">
      <div className="ai--planner">
        <Link className="ai--planner--back" to="/">
          ← Back to WorkoutMate
        </Link>

        <div className="ai--planner--intro">
          <p className="ai--eyebrow">AI POWERED</p>
          <h2>Build your workout plan</h2>
          <p>
            Tell WorkoutMate your goal, schedule and equipment. The AI also
            uses your recent workout history to make the plan more relevant.
          </p>
        </div>

        <form className="ai--planner--form" onSubmit={handleSubmit}>
          <div className="ai--field">
            <label htmlFor="goal">Goal</label>
            <select id="goal" value={goal} onChange={(e) => setGoal(e.target.value)}>
              <option value="general fitness">General fitness</option>
              <option value="muscle gain">Muscle gain</option>
              <option value="fat loss">Fat loss</option>
              <option value="strength">Strength</option>
            </select>
          </div>

          <div className="ai--field">
            <label htmlFor="experience">Experience</label>
            <select
              id="experience"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="ai--planner--row">
            <div className="ai--field">
              <label htmlFor="days">Days / week</label>
              <input
                id="days"
                type="number"
                min="1"
                max="7"
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(e.target.value)}
              />
            </div>

            <div className="ai--field">
              <label htmlFor="minutes">Minutes / workout</label>
              <input
                id="minutes"
                type="number"
                min="15"
                max="120"
                value={minutesPerWorkout}
                onChange={(e) => setMinutesPerWorkout(e.target.value)}
              />
            </div>
          </div>

          <fieldset className="ai--field">
            <legend>Equipment</legend>
            <div className="ai--chips">
              {equipmentOptions.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={equipment.includes(item) ? "ai--chip active" : "ai--chip"}
                  onClick={() => toggleItem(item, equipment, setEquipment)}
                >
                  {item}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="ai--field">
            <legend>Target muscles</legend>
            <div className="ai--chips">
              {muscleOptions.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={targetMuscles.includes(item) ? "ai--chip active" : "ai--chip"}
                  onClick={() => toggleItem(item, targetMuscles, setTargetMuscles)}
                >
                  {item}
                </button>
              ))}
            </div>
          </fieldset>

          <button
            className="ai--generate--btn"
            disabled={loading || !equipment.length || !targetMuscles.length}
          >
            {loading ? "Generating your plan..." : "Generate AI Workout Plan"}
          </button>

          {error && <p className="ai--planner--error">{error}</p>}
        </form>

        {plan && (
          <section className="ai--plan">
            <div className="ai--plan--header">
              <p className="ai--eyebrow">YOUR PLAN</p>
              <h3>{plan.title}</h3>
              <p>{plan.summary}</p>
            </div>

            <div className="ai--schedule">
              {plan.weeklySchedule.map((day) => (
                <article className="ai--day" key={day.day}>
                  <h4>{day.day}</h4>
                  <p className="ai--focus">{day.focus}</p>
                  {day.exercises.map((exercise) => (
                    <div className="ai--exercise" key={`${day.day}-${exercise.name}`}>
                      <strong>{exercise.name}</strong>
                      <span>
                        {exercise.sets} sets × {exercise.reps} · {exercise.restSeconds}s rest
                      </span>
                      {exercise.notes && <small>{exercise.notes}</small>}
                    </div>
                  ))}
                </article>
              ))}
            </div>

            <div className="ai--tip">
              <strong>Progression tip</strong>
              <p>{plan.progressionTip}</p>
            </div>

            <div className="ai--safety">
              <strong>Safety note</strong>
              <p>{plan.safetyNote}</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
