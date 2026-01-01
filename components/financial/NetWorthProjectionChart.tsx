"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "./utils";

interface NetWorthProjectionChartProps {
  currentNetWorth: number;
  netCashFlow: number;
  annualReturnRate: number;
  projectionYears: number;
  inflationRate: number;
}

interface ProjectionPoint {
  month: number;
  year: number;
  netWorth: number;
  label: string;
}

const buildProjectionData = (
  startingNetWorth: number,
  netCashFlow: number,
  annualReturnRate: number,
  projectionYears: number,
  inflationRate: number
) => {
  const totalMonths = Math.max(1, Math.round(projectionYears * 12));
  const effectiveAnnual = Math.max(
    -1,
    (1 + annualReturnRate / 100) / (1 + inflationRate / 100) - 1
  );
  const monthlyRate = effectiveAnnual / 12;
  const points: ProjectionPoint[] = [];
  let current = startingNetWorth;

  for (let month = 0; month <= totalMonths; month += 1) {
    if (month > 0) {
      // Compound after applying monthly contribution/expense.
      current = (current + netCashFlow) * (1 + monthlyRate);
    }
    const years = month / 12;
    points.push({
      month,
      year: years,
      netWorth: current,
      label:
        month === 0
          ? "Now"
          : Number.isInteger(years)
            ? `${years} yr`
            : `${years.toFixed(1)} yr`,
    });
  }

  return points;
};

export const NetWorthProjectionChart = ({
  currentNetWorth,
  netCashFlow,
  annualReturnRate,
  projectionYears,
  inflationRate,
}: NetWorthProjectionChartProps) => {
  const data = buildProjectionData(
    currentNetWorth,
    netCashFlow,
    annualReturnRate,
    projectionYears,
    inflationRate
  );

  const lastPoint = data[data.length - 1];

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-1 text-slate-900">
        <h3 className="text-lg font-semibold">Net Worth Projection</h3>
        <p className="text-sm text-slate-500">
          {projectionYears} year outlook ending at{" "}
          <span className="font-semibold">
            {formatCurrency(lastPoint?.netWorth ?? currentNetWorth)}
          </span>
        </p>
      </div>
      <div className="h-80">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ left: 8, right: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="year"
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              domain={[0, projectionYears]}
              tick={{ fill: "#475569", fontSize: 12 }}
              tickFormatter={(value: number) => `${value} yr`}
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(value as number)}
              tickLine={false}
              axisLine={false}
              width={90}
              tick={{ fill: "#475569", fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label: string, payload) => {
                const point = payload?.[0]?.payload as ProjectionPoint | undefined;
                return point ? `Year ${point.year.toFixed(1)}` : label;
              }}
              contentStyle={{
                borderRadius: 16,
                borderColor: "#cbd5f5",
              }}
            />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="netWorth"
              stroke="#10b981"
              strokeWidth={6}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
