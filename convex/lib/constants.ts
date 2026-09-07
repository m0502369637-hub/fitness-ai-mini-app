// Central place for the points economy. Change values here to rebalance the app.

export const WELCOME_POINTS = 50;
export const AI_COACH_COST = 5;
export const PLAN_COST = 15;

export interface PointPackage {
  key: string;
  title: string;
  description: string;
  points: number;
  stars: number;
}

export const DEFAULT_PACKAGES: PointPackage[] = [
  {
    key: "pack_50",
    title: "50 Points",
    description: "A small boost for a few sessions",
    points: 50,
    stars: 10,
  },
  {
    key: "pack_150",
    title: "150 Points",
    description: "Best value for serious training",
    points: 150,
    stars: 25,
  },
];
