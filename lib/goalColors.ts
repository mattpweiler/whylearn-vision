export const GOAL_COLORS = [
  "#FFE5EC", // light pink
  "#E3F2FD", // light blue
  "#E8F5E9", // light green
  "#FFF8E1", // light yellow
  "#F3E5F5", // light purple
  "#E0F7FA", // light teal
] as const;

export type GoalColor = (typeof GOAL_COLORS)[number];

export const DEFAULT_GOAL_COLOR: GoalColor = GOAL_COLORS[1];

export const isValidGoalColor = (value?: string | null): value is GoalColor =>
  Boolean(value && GOAL_COLORS.includes(value as GoalColor));

export const normalizeGoalColor = (value?: string | null): GoalColor =>
  isValidGoalColor(value) ? (value as GoalColor) : DEFAULT_GOAL_COLOR;
