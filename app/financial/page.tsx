"use client";

import { FinancialPlanner } from "@/components/financial/FinancialPlanner";

const FinancialPlannerPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <FinancialPlanner showIntro />
      </div>
    </div>
  );
};

export default FinancialPlannerPage;
