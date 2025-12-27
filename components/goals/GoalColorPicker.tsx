import { GOAL_COLORS, GoalColor, DEFAULT_GOAL_COLOR } from "@/lib/goalColors";

interface GoalColorPickerProps {
  value?: GoalColor;
  onChange: (color: GoalColor) => void;
  label?: string;
  className?: string;
}

export const GoalColorPicker = ({
  value,
  onChange,
  label = "Color",
  className = "",
}: GoalColorPickerProps) => {
  const activeColor = value ?? DEFAULT_GOAL_COLOR;

  return (
    <div className={className}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {GOAL_COLORS.map((color) => {
          const isActive = color === activeColor;
          return (
            <button
              key={color}
              type="button"
              className={`h-10 w-10 rounded-xl border transition focus:outline-none ${
                isActive ? "border-slate-900 ring-2 ring-slate-900/20" : "border-slate-200"
              }`}
              style={{ backgroundColor: color, color: "#0f172a" }}
              aria-label={`Select ${color}`}
              onClick={() => onChange(color)}
            >
              {isActive && <span className="text-lg leading-none">•</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};
