import React, { memo, useId, useMemo } from "react";
import { Activity, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import { motion } from "framer-motion";

const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

const InsightsPanel = memo(function InsightsPanel({
  insights = [],
  completionRate = 0,
  trendData = [],
}) {
  const gid = useId(); // unique ids for SVG defs
  const safeRate = clamp(Number(completionRate) || 0, 0, 100);

  const healthColor = useMemo(() => {
    if (safeRate > 75) return "text-emerald-400";
    if (safeRate > 40) return "text-blue-400";
    return "text-rose-400";
  }, [safeRate]);

  const spark = useMemo(() => {
    const data = Array.isArray(trendData) ? trendData : [];
    const series = data
      .slice(-14)
      .map((d) => ({ value: Number(d?.resolved ?? 0) }));
    return series.length ? series : [{ value: 0 }];
  }, [trendData]);

  const deltaPct = useMemo(() => {
    const data = Array.isArray(trendData) ? trendData : [];
    if (data.length < 2) return 0;
    const a = Number(data[data.length - 2]?.total ?? 0);
    const b = Number(data[data.length - 1]?.total ?? 0);
    if (!a) return b ? 100 : 0;
    return ((b - a) / a) * 100;
  }, [trendData]);

  const DeltaIcon = deltaPct >= 0 ? TrendingUp : TrendingDown;
  const deltaTextColor = deltaPct >= 0 ? "text-emerald-400" : "text-rose-400";

  const showSpark = spark.length >= 2; // avoids rendering chart on empty mount

  return (
    <div className="flex min-w-0 flex-col rounded-3xl border border-white/5 bg-slate-900 p-6 text-white shadow-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-lg bg-blue-500/10 p-2">
            <Activity className={`h-5 w-5 ${healthColor}`} />
          </div>
          <h3 className="truncate text-lg font-bold tracking-tight">
            Analytics Insights
          </h3>
        </div>
        <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-tighter text-slate-400">
          Live
        </span>
      </div>

      <div className="flex-grow space-y-3">
        {insights.length ? (
          insights.slice(0, 6).map((insight, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="group flex cursor-default items-center gap-3 rounded-2xl border border-white/[0.03] bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.05]"
            >
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-500 transition-colors group-hover:text-blue-400" />
              <p className="text-sm font-medium leading-snug text-slate-300">
                {insight}
              </p>
            </motion.div>
          ))
        ) : (
          <div className="py-8 text-center text-sm italic text-slate-500">
            No insights available for this period.
          </div>
        )}
      </div>

      <div className="mt-8 border-t border-white/5 pt-6">
        <div className="mb-4 flex items-end justify-between gap-4 min-w-0">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Overall Health
            </p>
            <div className="flex items-baseline gap-2">
              <span className="tabular-nums text-3xl font-bold">
                {safeRate.toFixed(0)}%
              </span>
              <span
                className={`flex items-center gap-1 text-xs font-bold ${deltaTextColor}`}
              >
                <DeltaIcon className="h-3 w-3" />
                {deltaPct >= 0 ? "+" : ""}
                {deltaPct.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Fixed-size box so ResponsiveContainer always has dimensions */}
          <div className="min-w-0" style={{ width: 112, height: 48 }}>
            {showSpark ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={112}
                minHeight={48}
              >
                <AreaChart data={spark}>
                  <YAxis hide domain={["dataMin", "dataMax"]} />
                  <defs>
                    <linearGradient
                      id={`healthFill-${gid}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    fill={`url(#healthFill-${gid})`}
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full rounded-xl bg-white/[0.03]" />
            )}
          </div>
        </div>

        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${safeRate}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400"
          />
        </div>

        <p className="mt-3 flex justify-between text-[10px] font-medium text-slate-500">
          <span>Based on selected window</span>
          <span>Updates on refresh</span>
        </p>
      </div>
    </div>
  );
});

export default InsightsPanel;
