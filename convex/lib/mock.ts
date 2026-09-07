// Deterministic mock "AI" for the coach and workout-plan generator.
//
// These are placeholders behind a clean interface. When you're ready to use a
// real model (OpenAI / Claude / DeepSeek, etc.), replace the bodies of
// `mockCoachResponse` and `generateMockPlan` with calls to your provider —
// everything else (points charging, saving, history) stays identical.

export interface PlanExercise {
  name: string;
  sets: number;
  reps: string;
}

export interface PlanDay {
  day: string;
  exercises: PlanExercise[];
}

export function mockCoachResponse(message: string, name: string): string {
  const m = message.toLowerCase();

  if (m.includes("lose") || m.includes("fat") || m.includes("weight")) {
    return `${name}, for fat loss I'd prioritize a small calorie deficit (~300–500 kcal/day), 8–10k daily steps, and 3 strength sessions + 2 cardio sessions per week. Keep protein around 1.8g per kg of bodyweight to hold on to muscle.\n\n(Mock coach — wire in a real model for personalized advice.)`;
  }
  if (m.includes("muscle") || m.includes("gain") || m.includes("bulk") || m.includes("strong")) {
    return `${name}, to build muscle aim for a small surplus (+200–300 kcal), 1.6–2.2g protein per kg, and progressive overload on compound lifts 3–4x a week. Sleep (7–9h) is where the growth actually happens.\n\n(Mock coach)`;
  }
  if (m.includes("cardio") || m.includes("endurance") || m.includes("run") || m.includes("stamina")) {
    return `${name}, build endurance with 2–3 zone-2 sessions (30–45 min) plus one interval session per week. Increase weekly volume by no more than ~10% to stay injury-free.\n\n(Mock coach)`;
  }
  if (m.includes("eat") || m.includes("diet") || m.includes("food") || m.includes("nutrition") || m.includes("protein")) {
    return `${name}, center every meal on protein, lots of vegetables, and whole-food carbs around training. Stay hydrated and time carbs before/after workouts for better energy and recovery.\n\n(Mock coach)`;
  }
  if (m.includes("recover") || m.includes("sleep") || m.includes("sore") || m.includes("rest")) {
    return `${name}, recovery is training. Aim for 7–9h sleep, keep easy days easy, and use light movement (walking, mobility) on rest days to flush soreness.\n\n(Mock coach)`;
  }
  return `${name}, great question! As a baseline: stay consistent, train with progressive overload 3–4x a week, eat enough protein, and get 7–9h of sleep. Want me to go deeper on muscle, fat loss, cardio, or nutrition?\n\n(Mock coach)`;
}

const EXERCISES: Record<string, PlanExercise[]> = {
  legs: [
    { name: "Back Squat", sets: 4, reps: "6–8" },
    { name: "Romanian Deadlift", sets: 3, reps: "8–10" },
    { name: "Walking Lunges", sets: 3, reps: "12 / leg" },
    { name: "Leg Press", sets: 3, reps: "10–12" },
    { name: "Calf Raises", sets: 4, reps: "15" },
  ],
  push: [
    { name: "Bench Press", sets: 4, reps: "6–8" },
    { name: "Overhead Press", sets: 3, reps: "8–10" },
    { name: "Incline Dumbbell Press", sets: 3, reps: "8–12" },
    { name: "Lateral Raises", sets: 3, reps: "15" },
    { name: "Triceps Pushdown", sets: 3, reps: "10–12" },
  ],
  pull: [
    { name: "Pull-ups / Lat Pulldown", sets: 4, reps: "8–10" },
    { name: "Barbell Row", sets: 4, reps: "8–10" },
    { name: "Seated Cable Row", sets: 3, reps: "10–12" },
    { name: "Face Pulls", sets: 3, reps: "15" },
    { name: "Biceps Curl", sets: 3, reps: "10–12" },
  ],
  full: [
    { name: "Goblet Squat", sets: 3, reps: "10–12" },
    { name: "Push-ups", sets: 3, reps: "10–15" },
    { name: "Dumbbell Row", sets: 3, reps: "10–12" },
    { name: "Plank", sets: 3, reps: "30–45s" },
    { name: "Glute Bridge", sets: 3, reps: "15" },
  ],
  core: [
    { name: "Plank", sets: 3, reps: "45s" },
    { name: "Hanging Leg Raise", sets: 3, reps: "10–12" },
    { name: "Cable Crunch", sets: 3, reps: "12–15" },
    { name: "Russian Twist", sets: 3, reps: "20" },
  ],
  cardio: [
    { name: "Incline Walk", sets: 1, reps: "20 min" },
    { name: "Intervals (run / bike)", sets: 8, reps: "30s on / 60s off" },
    { name: "Steady State", sets: 1, reps: "30 min" },
  ],
};

function toTitle(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function generateMockPlan(
  goal: string,
  level: string,
): { title: string; days: PlanDay[] } {
  const g = goal.toLowerCase();
  const l = level.toLowerCase();

  let days: PlanDay[];
  if (g.includes("muscle") || g.includes("gain") || g.includes("strong")) {
    days = [
      { day: "Monday — Push", exercises: EXERCISES.push },
      { day: "Wednesday — Pull", exercises: EXERCISES.pull },
      { day: "Friday — Legs", exercises: EXERCISES.legs },
      { day: "Saturday — Core", exercises: EXERCISES.core },
    ];
  } else if (g.includes("lose") || g.includes("fat") || g.includes("weight")) {
    days = [
      { day: "Monday — Full Body", exercises: EXERCISES.full },
      { day: "Tuesday — Cardio", exercises: EXERCISES.cardio },
      { day: "Thursday — Full Body", exercises: EXERCISES.full },
      { day: "Friday — Cardio", exercises: EXERCISES.cardio },
      { day: "Saturday — Core", exercises: EXERCISES.core },
    ];
  } else if (g.includes("endurance") || g.includes("cardio") || g.includes("run")) {
    days = [
      { day: "Monday — Intervals", exercises: EXERCISES.cardio },
      { day: "Wednesday — Strength", exercises: EXERCISES.full },
      { day: "Friday — Long Steady State", exercises: EXERCISES.cardio },
      { day: "Saturday — Core", exercises: EXERCISES.core },
    ];
  } else {
    days = [
      { day: "Monday — Full Body", exercises: EXERCISES.full },
      { day: "Wednesday — Push", exercises: EXERCISES.push },
      { day: "Friday — Pull", exercises: EXERCISES.pull },
      { day: "Saturday — Core", exercises: EXERCISES.core },
    ];
  }

  const adjust = (ex: PlanExercise): PlanExercise => {
    if (l.includes("beginner")) return { ...ex, sets: Math.max(2, ex.sets - 1) };
    if (l.includes("advanced")) return { ...ex, sets: ex.sets + 1 };
    return ex;
  };

  const title = `${toTitle(goal || "General Fitness")} Plan (${toTitle(level || "Intermediate")})`;

  return {
    title,
    days: days.map((d) => ({ day: d.day, exercises: d.exercises.map(adjust) })),
  };
}
