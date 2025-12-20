export type FeatureVoteOption = {
  key: string;
  title: string;
  description: string;
  impact: string;
};

export const FEATURE_VOTE_OPTIONS: FeatureVoteOption[] = [
  {
    key: "ai_weekly_review",
    title: "What Are My Next Steps? AI Weekly Review + Plan",
    description:
      "Automatic recap of your week across goals, tasks, reflections, and finances, then generates a focused plan for next week.",
    impact: "Saves planning time and keeps you accountable to the right priorities.",
  },
  {
    key: "mobile_companion",
    title: "Weekly Texts + Mobile Companion App",
    description:
      "Lightweight mobile experience with quick add, offline capture, and push reminders for today's plan and habits.",
    impact: "Stay on track when you're away from your desk.",
  },
  {
    key: "finance_expansion",
    title: "Expand the Financial Features of this app",
    description:
      "More Detailed Budgeting, Expense Tracking, Investment Tracking, and Financial Goal Planning.",
    impact: "Tell us below any additional ideas.",
  },
];

export const findFeatureVoteOption = (key: string) =>
  FEATURE_VOTE_OPTIONS.find((option) => option.key === key);
