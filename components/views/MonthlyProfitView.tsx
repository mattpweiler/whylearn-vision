"use client";

import { FinancialPlanner } from "@/components/financial/FinancialPlanner";

export const MonthlyProfitView = () => (
  <FinancialPlanner
    showIntro={true}
    initialMode="statements"
    enableModeToggle={false}
  />
);
