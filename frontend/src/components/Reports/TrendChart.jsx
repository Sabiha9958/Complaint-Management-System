import React, { memo, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";

const nf = new Intl.NumberFormat("en-IN");
const COLORS = { incoming: "#3B82F6", resolved: "#10B981", urgent: "#EF4444" };

const toArray = (v) => (Array.isArray(v) ? v : []);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-lg">
      <p className="mb-2 text-sm font-extrabold text-gray-900">{label}</p>
      {payload.map((p) => (
        <div
          key={p.dataKey}
          className="flex items-center justify-between gap-4 text-xs"
        >
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="font-semibold text-gray-500">{p.name}</span>
          </div>
          <span className="font-extrabold text-gray-800">
            {nf.format(p.value || 0)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default memo(function TrendChart({ data }) {
  const chartData = useMemo(() => {
    return toArray(data)
      .map((d) => ({
        date: String(d?.date ?? ""),
        total: Number(d?.total ?? 0),
        resolved: Number(d?.resolved ?? 0),
        urgent: Number(d?.urgent ?? 0),
      }))
      .slice(-14);
  }, [data]);

  const ymax = useMemo(() => {
    const m = chartData.reduce(
      (acc, d) => Math.max(acc, d.total, d.resolved, d.urgent),
      0
    );
    return Math.max(5, m);
  }, [chartData]);

  return (
    <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="flex items-center gap-2 text-lg font-extrabold text-gray-900">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Intake vs resolution
        </h3>
        <p className="text-sm font-semibold text-gray-500">
          Last 14 days inside the selected range.
        </p>
      </div>

      {chartData.length ? (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData} accessibilityLayer>
            <defs>
              <linearGradient id="fillIncoming" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={COLORS.incoming}
                  stopOpacity={0.18}
                />
                <stop
                  offset="95%"
                  stopColor={COLORS.incoming}
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="fillResolved" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={COLORS.resolved}
                  stopOpacity={0.18}
                />
                <stop
                  offset="95%"
                  stopColor={COLORS.resolved}
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="fillUrgent" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={COLORS.urgent}
                  stopOpacity={0.12}
                />
                <stop offset="95%" stopColor={COLORS.urgent} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#E2E8F0"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 12 }}
              interval="preserveStartEnd"
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              domain={[0, ymax]}
              tick={{ fill: "#64748B", fontSize: 12 }}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" />

            <Area
              type="monotone"
              dataKey="total"
              name="Incoming"
              stroke={COLORS.incoming}
              strokeWidth={3}
              fill="url(#fillIncoming)"
              dot={false}
            />

            <Area
              type="monotone"
              dataKey="resolved"
              name="Resolved"
              stroke={COLORS.resolved}
              strokeWidth={3}
              fill="url(#fillResolved)"
              dot={false}
            />

            <Area
              type="monotone"
              dataKey="urgent"
              name="Urgent"
              stroke={COLORS.urgent}
              strokeWidth={2}
              fill="url(#fillUrgent)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm font-semibold text-gray-500">
          No trend data available.
        </p>
      )}
    </div>
  );
});
