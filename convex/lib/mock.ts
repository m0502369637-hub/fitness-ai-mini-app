// Deterministic mock "AI" for the coach and workout-plan generator.
//
// The plan generator now draws from the vendored free-exercise-db catalog so
// every generated exercise carries its id, muscle groups, equipment, image and
// instructions. Swap the coach/plan bodies for a real model later — the points
// charging and history remain unchanged.

import { CatalogExercise, EXERCISE_CATALOG, ExerciseGroup } from "./exercises";

export interface PlanExercise {
  exerciseId: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment?: string;
  level?: string;
  image: string;
  instructions: string[];
  sets: number;
  reps: string;
}

export interface PlanDay {
  day: string;
  exercises: PlanExercise[];
}

const SETS: Record<ExerciseGroup, number> = {
  push: 3,
  pull: 3,
  legs: 3,
  core: 3,
  cardio: 2,
};

function repsFor(group: ExerciseGroup, e: CatalogExercise): string {
  if (group === "core") return /plank|raise/i.test(e.name) ? "30–45s" : "15–20";
  if (group === "cardio") return /squat|climber/i.test(e.name) ? "15" : "20 min";
  return "8–12";
}

function adjustSets(sets: number, level: string): number {
  const l = level.toLowerCase();
  if (l.includes("beginner")) return Math.max(2, sets - 1);
  if (l.includes("advanced")) return sets + 1;
  return sets;
}

function toPlanExercise(e: CatalogExercise, sets: number, reps: string): PlanExercise {
  return {
    exerciseId: e.id,
    name: e.name,
    primaryMuscles: e.primaryMuscles,
    secondaryMuscles: e.secondaryMuscles,
    equipment: e.equipment ?? undefined,
    level: e.level ?? undefined,
    image: e.image,
    instructions: e.instructions,
    sets,
    reps,
  };
}

function buildDay(title: string, group: ExerciseGroup, level: string): PlanDay {
  const n = group === "core" ? 4 : 4;
  const exercises = EXERCISE_CATALOG[group].slice(0, n).map((e, i) =>
    toPlanExercise(e, adjustSets(SETS[group] + (i === 0 ? 1 : 0), level), repsFor(group, e)),
  );
  return { day: title, exercises };
}

export function generateMockPlan(
  goal: string,
  level: string,
): { title: string; days: PlanDay[] } {
  const g = goal.toLowerCase();

  let days: PlanDay[];
  if (g.includes("muscle") || g.includes("gain") || g.includes("strong")) {
    days = [
      buildDay("Monday — Push", "push", level),
      buildDay("Wednesday — Pull", "pull", level),
      buildDay("Friday — Legs", "legs", level),
      buildDay("Saturday — Core", "core", level),
    ];
  } else if (g.includes("lose") || g.includes("fat") || g.includes("weight")) {
    days = [
      buildDay("Monday — Conditioning", "cardio", level),
      buildDay("Tuesday — Legs", "legs", level),
      buildDay("Thursday — Core", "core", level),
      buildDay("Friday — Cardio", "cardio", level),
    ];
  } else if (g.includes("endurance") || g.includes("cardio") || g.includes("run")) {
    days = [
      buildDay("Monday — Intervals", "cardio", level),
      buildDay("Wednesday — Strength", "legs", level),
      buildDay("Friday — Cardio", "cardio", level),
      buildDay("Saturday — Core", "core", level),
    ];
  } else {
    days = [
      buildDay("Monday — Lower Body", "legs", level),
      buildDay("Wednesday — Push", "push", level),
      buildDay("Friday — Pull", "pull", level),
      buildDay("Saturday — Core", "core", level),
    ];
  }

  const title = `${toTitle(goal || "General Fitness")} Plan (${toTitle(level || "Intermediate")})`;
  return { title, days };
}

function toTitle(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
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
