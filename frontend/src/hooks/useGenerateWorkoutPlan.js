import { useState } from "react";
import { useSelector } from "react-redux";

export const useGenerateWorkoutPlan = () => {
  const user = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const url = process.env.REACT_APP_API || "http://localhost:6060/api";

  const generatePlan = async (preferences) => {
    setLoading(true);
    setError("");

    try {
      if (!user) {
        throw new Error("Please log in to use the AI planner.");
      }

      const response = await fetch(`${url}/ai/workout-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(preferences),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Could not generate workout plan.");
      }

      return json;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { generatePlan, loading, error };
};
