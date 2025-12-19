import React, { memo, useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { PieChart as PieIcon } from "lucide-react";

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#64748B",
];
const nf = new Intl.NumberFormat("en-IN");

const toArray = (v) => (Array.isArray(v) ? v : []);

const StatusTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-lg">
      <p className="text-sm font-extrabold text-gray-900">{p.name}</p>
      <p className="text-xs font-semibold text-gray-500">
        Count:{" "}
        <span className="font-extrabold text-gray-800">
          {nf.format(p.value || 0)}
        </span>
      </p>
    </div>
  );
};

export default memo(function StatusDonut({ data }) {
  const chartData = useMemo(() => {
    return toArray(data)
      .map((d) => ({
        name: String(d?.name ?? "UNKNOWN"),
        value: Number(d?.value ?? 0),
      }))
      .filter((d) => d.value > 0);
  }, [data]);

  const total = useMemo(
    () => chartData.reduce((acc, d) => acc + (Number(d.value) || 0), 0),
    [chartData]
  );

  return (
    <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-extrabold text-gray-900">
          <PieIcon className="h-5 w-5 text-orange-500" />
          Status distribution
        </h3>
        <p className="text-xs font-bold text-gray-500">
          Total: <span className="text-gray-900">{nf.format(total)}</span>
        </p>
      </div>

      {chartData.length ? (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={78}
              outerRadius={112}
              paddingAngle={4}
              isAnimationActive
            >
              {chartData.map((d, i) => (
                <Cell
                  key={d.name}
                  fill={COLORS[i % COLORS.length]}
                  stroke="none"
                />
              ))}
            </Pie>

            <Tooltip content={<StatusTooltip />} />
            <Legend
              verticalAlign="middle"
              align="right"
              layout="vertical"
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm font-semibold text-gray-500">
          No status data available.
        </p>
      )}
    </div>
  );
});
