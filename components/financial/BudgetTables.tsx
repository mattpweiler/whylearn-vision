"use client";

import { ExpenseItem, FinancialItem, IncomeItem } from "./types";
import { formatCurrency, generateItemId, parseAmountInput } from "./utils";

interface BudgetTableProps<T extends FinancialItem> {
  title: string;
  items: T[];
  onChange: (items: T[]) => void;
  actionLabel: string;
  emptyHelper: string;
}

const BudgetTable = <T extends FinancialItem>({
  title,
  items,
  onChange,
  actionLabel,
  emptyHelper,
}: BudgetTableProps<T>) => {
  const handleItemChange = (
    id: string,
    updates: Partial<Pick<FinancialItem, "description" | "amount">>
  ) => {
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const handleDelete = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const handleAdd = () => {
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
          className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
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
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                placeholder="Description"
                value={item.description}
                onChange={(event) =>
                  handleItemChange(item.id, {
                    description: event.target.value,
                  })
                }
              />
              <input
                type="number"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 md:w-40"
                placeholder="Amount"
                value={
                  Number.isFinite(item.amount) ? item.amount : ""
                }
                onChange={(event) =>
                  handleItemChange(item.id, {
                    amount: parseAmountInput(event.target.value),
                  })
                }
              />
              <button
                type="button"
                className="text-sm text-slate-500 transition hover:text-rose-500"
                onClick={() => handleDelete(item.id)}
              >
                Remove
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
}

export const IncomeTable = ({ items, onChange }: IncomeTableProps) => (
  <BudgetTable
    title="Income"
    items={items}
    onChange={onChange}
    actionLabel="Add Income"
    emptyHelper="Map the money coming in each month."
  />
);

interface ExpenseTableProps {
  items: ExpenseItem[];
  onChange: (items: ExpenseItem[]) => void;
}

export const ExpenseTable = ({ items, onChange }: ExpenseTableProps) => (
  <BudgetTable
    title="Expenses"
    items={items}
    onChange={onChange}
    actionLabel="Add Expense"
    emptyHelper="List recurring bills, lifestyle, and investments."
  />
);
