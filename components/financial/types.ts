export interface IncomeItem {
  id: string;
  description: string;
  amount: number; // monthly
}

export interface ExpenseItem {
  id: string;
  description: string;
  amount: number; // monthly
}

export interface FinancialSettings {
  currentNetWorth: number;
  annualReturnRate: number; // percent
  projectionYears: number;
}

export type FinancialItem = IncomeItem | ExpenseItem;

export const INCOME_STORAGE_KEY = "whylearn_incomes";
export const EXPENSE_STORAGE_KEY = "whylearn_expenses";
export const SETTINGS_STORAGE_KEY = "whylearn_financial_settings";

export const DEFAULT_FINANCIAL_SETTINGS: FinancialSettings = {
  currentNetWorth: 0,
  annualReturnRate: 5,
  projectionYears: 5,
};
