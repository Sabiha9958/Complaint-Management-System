import React, { memo, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { BarChart2 } from "lucide-react";

const nf = new Intl.NumberFormat("en-IN");
const toArray = (v) => (Array.isArray(v) ? v : []);

const sortDesc = (arr) =>
  [...arr].sort((a, b) => (b.value || 0) - (a.value || 0));

const calcAxisWidth = (labels) => {
  const maxLen = labels.reduce(
    (m, s) => Math.max(m, String(s || "").length),
    0
  );
  return Math.min(180, Math.max(90, maxLen * 7)); // simple heuristic
};

const CategoryTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-lg">
      <p className="text-sm font-extrabold text-gray-900">{p.payload?.name}</p>
      <p className="text-xs font-semibold text-gray-500">
        Complaints:{" "}
        <span className="font-extrabold text-gray-800">
          {nf.format(p.value || 0)}
        </span>
      </p>
    </div>
  );
};

export default memo(function CategoryBar({
  data,
  title = "Volume by category",
}) {
  const chartData = useMemo(() => {
    const clean = toArray(data)
      .map((d) => ({
        name: String(d?.name ?? "Uncategorized"),
        value: Number(d?.value ?? 0),
      }))
      .filter((d) => d.value > 0);

    return sortDesc(clean).slice(0, 10); // top 10 categories looks best in vertical bars
  }, [data]);

  const axisWidth = useMemo(
    () => calcAxisWidth(chartData.map((d) => d.name)),
    [chartData]
  );
  const total = useMemo(
    () => chartData.reduce((acc, d) => acc + d.value, 0),
    [chartData]
  );

  return (
    <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-extrabold text-gray-900">
          <BarChart2 className="h-5 w-5 text-purple-500" />
          {title}
        </h3>
        <p className="text-xs font-bold text-gray-500">
          Total: <span className="text-gray-900">{nf.format(total)}</span>
        </p>
      </div>

      {chartData.length ? (
        <ResponsiveContainer width="100%" height={320} minHeight={320}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
          >
            <CartesianGrid
              horizontal
              vertical={false}
              stroke="#E2E8F0"
              strokeDasharray="3 3"
            />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={axisWidth}
              tick={{ fontSize: 12, fill: "#475569" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CategoryTooltip />}
              cursor={{ fill: "#F1F5F9" }}
            />
            <Bar
              dataKey="value"
              radius={[0, 8, 8, 0]}
              barSize={18}
              isAnimationActive
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={i === 0 ? "#7C3AED" : "#8B5CF6"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm font-semibold text-gray-500">
          No category data available.
        </p>
      )}
    </div>
  );
});
