import { CurrencyCode } from "@/lib/types";

export const formatCurrency = (
  value: number,
  currency: CurrencyCode = "USD"
) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

export const parseAmountInput = (value: string) => {
  if (!value.trim()) return 0;
  const sanitized = value.replace(/[^\d-]/g, "");
  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const generateItemId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

type ScoreBand = {
  min: number;
  max: number;
  minScore: number;
  maxScore: number;
};

const scoreFromBands = (value: number, bands: ScoreBand[]): number => {
  for (const band of bands) {
    if (value < band.max) {
      if (!Number.isFinite(band.max)) {
        return band.maxScore;
      }
      const clampedValue = Math.max(band.min, value);
      const range = band.max - band.min;
      const progress = range === 0 ? 0 : (clampedValue - band.min) / range;
      return band.minScore + progress * (band.maxScore - band.minScore);
    }
  }
  return bands[bands.length - 1]?.maxScore ?? 0;
};

const stabilityBands: ScoreBand[] = [
  { min: -1, max: 0, minScore: 0, maxScore: 10 },
  { min: 0, max: 0.25, minScore: 10, maxScore: 18 },
  { min: 0.25, max: 0.5, minScore: 18, maxScore: 26 },
  { min: 0.5, max: 1, minScore: 26, maxScore: 35 },
  { min: 1, max: 2, minScore: 35, maxScore: 48 },
  { min: 2, max: Number.POSITIVE_INFINITY, minScore: 48, maxScore: 50 },
];

const netWorthBands: ScoreBand[] = [
  { min: -1, max: 0, minScore: 0, maxScore: 5 },
  { min: 0, max: 0.5, minScore: 5, maxScore: 12 },
  { min: 0.5, max: 1, minScore: 12, maxScore: 20 },
  { min: 1, max: 2, minScore: 20, maxScore: 30 },
  { min: 2, max: 4, minScore: 30, maxScore: 38 },
  { min: 4, max: 8, minScore: 38, maxScore: 46 },
  { min: 8, max: Number.POSITIVE_INFINITY, minScore: 46, maxScore: 50 },
];

export interface FreedomScoreResult {
  score: number;
  stabilityScore: number;
  netWorthScore: number;
}

interface FreedomNarrative {
  label: string;
  min: number;
  max: number;
  description: string;
  tips: string[];
}

const freedomNarratives: FreedomNarrative[] = [
  {
    label: "Survival Mode",
    min: 0,
    max: 20,
    description:
      "You’re in a vulnerable spot financially. Income is unstable or negative, expenses are heavier than they should be, and debt or lack of assets is creating stress. Without meaningful changes, future financial health will stay fragile and opportunities limited.",
    tips: [
      "Reduce expenses aggressively and slash anything nonessential.",
      "Pursue side work or skill upgrades to raise income quickly.",
      "Avoid taking on new debt while cashflow is negative.",
      "Build your first $1,000 emergency buffer.",
      "Focus every effort on stabilizing cashflow.",
    ],
  },
  {
    label: "Stress Mode",
    min: 20,
    max: 40,
    description:
      "Money is tight and most months feel stressful. You’re likely living paycheck-to-paycheck with little margin for emergencies. Progress is possible, but sustained improvements in cashflow or debt reduction are required to unlock long-term freedom.",
    tips: [
      "Track spending closely to spot leaks.",
      "Negotiate bills or lower fixed costs where possible.",
      "Build a starter buffer of $500–$2,000.",
      "Begin paying down any high-interest debt.",
      "Look for ways to increase reliable monthly income.",
    ],
  },
  {
    label: "Stable",
    min: 40,
    max: 60,
    description:
      "You’re managing monthly bills but stability is still fragile. Cashflow is steady yet there isn’t much runway or safety net. Consistent saving and investing over the next few years can move you firmly into financial growth territory.",
    tips: [
      "Build 1–3 months of expenses in a dedicated savings account.",
      "Automate investing, even with small recurring contributions.",
      "Trim low-value expenses to widen your margin.",
      "Invest in skills that strengthen your earning power.",
      "Maintain a simple budgeting or money check-in habit.",
    ],
  },
  {
    label: "Building Mode",
    min: 60,
    max: 80,
    description:
      "You have healthy cashflow and a growing net worth. Momentum is building and you have a solid safety margin. Staying consistent with saving, investing, and debt payoff will put you firmly on track for long-term freedom.",
    tips: [
      "Grow your emergency fund to at least 3–6 months of expenses.",
      "Increase the percentage of income you invest.",
      "Eliminate any remaining high-interest or lingering debts.",
      "Cultivate multiple income streams for resilience.",
      "Start mapping out your long-term wealth plan.",
    ],
  },
  {
    label: "Freedom Emerging",
    min: 80,
    max: 90,
    description:
      "Cashflow is strong, assets are solid, and financial stress is low. You’re gaining real flexibility in life choices. Continued consistency will bring you very close to full financial independence.",
    tips: [
      "Maintain 6+ months of savings as a durable safety net.",
      "Boost long-term investing and tax-advantaged contributions.",
      "Optimize taxes and retirement account strategies.",
      "Explore passive income opportunities.",
      "Protect gains with solid insurance and planning.",
    ],
  },
  {
    label: "Financial Independence Trajectory",
    min: 90,
    max: 101,
    description:
      "You’re in an excellent financial position with high stability and strong assets. Money is now a tool, not a source of stress. Keep refining your strategy and you’re very likely to reach full financial independence.",
    tips: [
      "Maintain a high savings and investment rate.",
      "Diversify investments across tax and asset buckets.",
      "Plan intentionally for taxes, estate needs, and future cashflow.",
      "Guard against lifestyle creep to preserve margins.",
      "Set explicit milestones for full financial independence.",
    ],
  },
];

export const calculateFreedomScore = ({
  monthlyIncome,
  monthlyExpenses,
  totalAssets,
  totalLiabilities,
}: {
  monthlyIncome: number;
  monthlyExpenses: number;
  totalAssets: number;
  totalLiabilities: number;
}): FreedomScoreResult => {
  const safeExpenses = Math.max(1, monthlyExpenses);
  const cashflow = monthlyIncome - monthlyExpenses;
  const cashflowRatio = cashflow / safeExpenses;
  const stabilityScore = Math.min(
    50,
    Math.max(0, scoreFromBands(cashflowRatio, stabilityBands))
  );

  const netWorth = totalAssets - totalLiabilities;
  const annualExpenses = safeExpenses * 12;
  const netWorthMultiple = netWorth / annualExpenses;
  const netWorthScore = Math.min(
    50,
    Math.max(0, scoreFromBands(netWorthMultiple, netWorthBands))
  );

  const score = Math.min(100, Math.max(0, stabilityScore + netWorthScore));

  return {
    score: Math.round(score),
    stabilityScore: Math.round(stabilityScore),
    netWorthScore: Math.round(netWorthScore),
  };
};

export const getFreedomNarrative = (score: number) => {
  const clamped = Math.max(0, Math.min(100, score));
  const narrative =
    freedomNarratives.find((item) => clamped >= item.min && clamped < item.max) ??
    freedomNarratives[freedomNarratives.length - 1];

  return {
    label: narrative.label,
    description: narrative.description,
    tips: narrative.tips.slice(0, 5),
  };
};
