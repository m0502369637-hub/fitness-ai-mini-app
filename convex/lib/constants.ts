// Central place for the points economy. Change values here to rebalance the app.

export const WELCOME_POINTS = 250;
export const AI_COACH_COST = 50;
export const PLAN_COST = 250;

export interface PointPackage {
  key: string;
  title: string;
  description: string;
  points: number;
  stars: number;
}

export const DEFAULT_PACKAGES: PointPackage[] = [
  {
    key: "pack_1000",
    title: "1000 Points",
    description: "100 Telegram Stars",
    points: 1000,
    stars: 100,
  },
];
