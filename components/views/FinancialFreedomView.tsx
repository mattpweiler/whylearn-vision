"use client";

import { FinancialPlanner } from "@/components/financial/FinancialPlanner";

export const FinancialFreedomView = () => (
  <FinancialPlanner
    showIntro={true}
    initialMode="projections"
    enableModeToggle={false}
  />
);
