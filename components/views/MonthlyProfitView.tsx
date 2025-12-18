"use client";

import { FinancialPlanner } from "@/components/financial/FinancialPlanner";

export const MonthlyProfitView = ({ readOnly = false }: { readOnly?: boolean }) => (
  <FinancialPlanner
    showIntro={true}
    initialMode="statements"
    enableModeToggle={false}
    readOnly={readOnly}
  />
);
