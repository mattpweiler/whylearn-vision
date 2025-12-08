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
  annualReturnRate: number; // percent
  projectionYears: number;
  inflationRate: number;
}

export interface AssetItem {
  id: string;
  description: string;
  amount: number;
}

export interface LiabilityItem {
  id: string;
  description: string;
  amount: number;
}

export type StatementLineItemType = "income" | "expense";

export interface StatementLineItem {
  id: string;
  description: string;
  amount: number;
  type: StatementLineItemType;
}

export interface MonthlyStatement {
  id: string;
  month: string; // YYYY-MM
  income: number;
  expenses: number;
  notes?: string;
  incomeItems?: StatementLineItem[];
  expenseItems?: StatementLineItem[];
}

export type FinancialItem =
  | IncomeItem
  | ExpenseItem
  | AssetItem
  | LiabilityItem;

export const INCOME_STORAGE_KEY = "whylearn_incomes";
export const EXPENSE_STORAGE_KEY = "whylearn_expenses";
export const ASSET_STORAGE_KEY = "whylearn_assets";
export const LIABILITY_STORAGE_KEY = "whylearn_liabilities";
export const SETTINGS_STORAGE_KEY = "whylearn_financial_settings";
export const STATEMENTS_STORAGE_KEY = "whylearn_financial_statements";

export const DEFAULT_FINANCIAL_SETTINGS: FinancialSettings = {
  annualReturnRate: 5,
  projectionYears: 5,
  inflationRate: 2,
};
