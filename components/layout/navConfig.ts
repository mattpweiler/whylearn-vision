import { ViewKey } from "@/lib/types";

export const DEMO_ALLOWED_VIEWS: ViewKey[] = [
  "today",
  "planner",
  "financial_freedom",
  "financial_profit",
];

export const navItems: {
  key: ViewKey;
  label: string;
  icon: string;
  comingSoon?: boolean;
}[] = [
  { key: "today", label: "Today", icon: "☀️" },
  { key: "planner", label: "Planner", icon: "🗓️" },
  { key: "year", label: "Year Goals Progress", icon: "🏔️" },
  {
    key: "financial_freedom",
    label: "Financial Freedom",
    icon: "💸",
  },
  {
    key: "financial_profit",
    label: "Monthly Profit",
    icon: "📈",
  },
  {
    key: "next_steps",
    label: "What are My Next Steps?",
    icon: "🤔",
    comingSoon: true,
  },
  { key: "direction", label: "Reflections", icon: "🧭" },
  { key: "settings", label: "Settings", icon: "⚙️" },
];
