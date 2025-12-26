"use client";

import {
  AssetItem,
  ExpenseItem,
  FinancialItem,
  IncomeItem,
  LiabilityItem,
} from "./types";
import { formatCurrency, generateItemId, parseAmountInput } from "./utils";
import { TrashIcon } from "@/components/financial/TrashIcon";

interface BudgetTableProps<T extends FinancialItem> {
  title: string;
  items: T[];
  onChange: (items: T[]) => void;
  actionLabel: string;
  emptyHelper: string;
  readOnly?: boolean;
}

const BudgetTable = <T extends FinancialItem>({
  title,
  items,
  onChange,
  actionLabel,
  emptyHelper,
  readOnly = false,
}: BudgetTableProps<T>) => {
  const handleItemChange = (
    id: string,
    updates: Partial<Pick<FinancialItem, "description" | "amount">>
  ) => {
    if (readOnly) return;
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const handleDelete = (id: string) => {
    if (readOnly) return;
    onChange(items.filter((item) => item.id !== id));
  };

  const handleAdd = () => {
    if (readOnly) return;
    const newItem = {
      id: generateItemId(),
      description: "",
      amount: 0,
    } as T;
    onChange([...items, newItem]);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="flex flex-col rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">{emptyHelper}</p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={readOnly}
          className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          + {actionLabel}
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3"
          >
            <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
              <input
                className="min-w-[200px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                placeholder="Description"
                value={item.description}
                readOnly={readOnly}
                disabled={readOnly}
                onChange={(event) =>
                  handleItemChange(item.id, {
                    description: event.target.value,
                  })
                }
              />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-[120px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 sm:w-[140px] md:w-40"
                placeholder="Amount"
                value={
                  Number.isFinite(item.amount) && item.amount !== 0
                    ? item.amount.toString()
                    : ""
                }
                readOnly={readOnly}
                disabled={readOnly}
                onChange={(event) =>
                  handleItemChange(item.id, {
                    amount: parseAmountInput(event.target.value),
                  })
                }
              />
              <button
                type="button"
                className="flex-shrink-0 rounded-full p-2 text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => handleDelete(item.id)}
                aria-label={`Remove ${title} entry`}
                disabled={readOnly}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">
          Start by adding your first entry.
        </p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm font-semibold text-slate-900">
        <span>Total</span>
        <span>{formatCurrency(totalAmount)}</span>
      </div>
    </div>
  );
};

interface IncomeTableProps {
  items: IncomeItem[];
  onChange: (items: IncomeItem[]) => void;
  readOnly?: boolean;
}

export const IncomeTable = ({ items, onChange, readOnly }: IncomeTableProps) => (
  <BudgetTable
    title="Income"
    items={items}
    onChange={onChange}
    actionLabel="Add Income"
    emptyHelper="Map the money coming in each month."
    readOnly={readOnly}
  />
);

interface ExpenseTableProps {
  items: ExpenseItem[];
  onChange: (items: ExpenseItem[]) => void;
  readOnly?: boolean;
}

export const ExpenseTable = ({ items, onChange, readOnly }: ExpenseTableProps) => (
  <BudgetTable
    title="Expenses"
    items={items}
    onChange={onChange}
    actionLabel="Add Expense"
    emptyHelper="List recurring bills, lifestyle, and investments."
    readOnly={readOnly}
  />
);

interface AssetTableProps {
  items: AssetItem[];
  onChange: (items: AssetItem[]) => void;
  readOnly?: boolean;
}

export const AssetTable = ({ items, onChange, readOnly }: AssetTableProps) => (
  <BudgetTable
    title="Assets"
    items={items}
    onChange={onChange}
    actionLabel="Add Asset"
    emptyHelper="Track savings, investments, business equity."
    readOnly={readOnly}
  />
);

interface LiabilityTableProps {
  items: LiabilityItem[];
  onChange: (items: LiabilityItem[]) => void;
  readOnly?: boolean;
}

export const LiabilityTable = ({ items, onChange, readOnly }: LiabilityTableProps) => (
  <BudgetTable
    title="Liabilities"
    items={items}
    onChange={onChange}
    actionLabel="Add Liability"
    emptyHelper="Mortgages, loans, and other obligations."
    readOnly={readOnly}
  />
);
