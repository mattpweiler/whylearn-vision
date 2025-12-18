"use client";

import { FinancialPlanner } from "@/components/financial/FinancialPlanner";

export const FinancialFreedomView = ({ readOnly = false }: { readOnly?: boolean }) => (
  <FinancialPlanner
    showIntro={true}
    initialMode="projections"
    enableModeToggle={false}
    readOnly={readOnly}
  />
);
