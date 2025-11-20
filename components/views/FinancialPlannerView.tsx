"use client";

import { FinancialPlanner } from "@/components/financial/FinancialPlanner";
import { AppState } from "@/lib/types";

interface ViewProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

export const FinancialPlannerView = ({}: ViewProps) => {
  return (
    <div className="space-y-6">
      <FinancialPlanner showIntro={false} />
    </div>
  );
};
