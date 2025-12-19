import React, { useMemo } from "react";
import {
  TrendingUp,
  CheckCircle2,
  Award,
  Calendar,
  Shield,
  Clock,
} from "lucide-react";
import InfoCard from "./InfoCard";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const formatDate = (date) => {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ProfileSidebar = ({ user, completeness }) => {
  const pct = clamp(Number(completeness) || 0, 0, 100);

  const missingFields = useMemo(() => {
    const steps = 5;
    const completedSteps = Math.floor((pct / 100) * steps);
    return Math.max(0, steps - completedSteps);
  }, [pct]);

  const memberSince = useMemo(
    () => formatDate(user?.createdAt),
    [user?.createdAt]
  );
  const lastLogin = useMemo(
    () => formatDateTime(user?.lastLogin),
    [user?.lastLogin]
  );

  return (
    <aside className="space-y-6 lg:w-1/3">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-900/80 p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-extrabold">
                <TrendingUp className="h-5 w-5 text-indigo-200" />
                Profile strength
              </h3>
              <p className="mt-1 text-sm font-medium text-white/70">
                Complete your profile
              </p>
            </div>

            <div className="text-right">
              <div className="leading-none">
                <span className="text-4xl font-extrabold tracking-tight">
                  {pct}
                </span>
                <span className="ml-1 text-xl font-semibold text-white/70">
                  %
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold text-white/60">
                Progress
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="h-3 w-full overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 transition-[width] duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="mt-5">
            {pct === 100 ? (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-semibold">
                <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                Profile complete
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                Add{" "}
                <span className="font-bold text-white">{missingFields}</span>{" "}
                more field(s) to complete.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-4 flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 ring-1 ring-indigo-100">
            <Award className="h-5 w-5 text-indigo-600" />
          </span>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Account details
            </h3>
            <p className="text-xs font-medium text-slate-500">
              Account and activity info
            </p>
          </div>
        </header>

        <div className="space-y-4">
          <InfoCard icon={Calendar} label="Member since" value={memberSince} />
          <InfoCard icon={Shield} label="Status" value="Active & verified" />
          {lastLogin && (
            <InfoCard icon={Clock} label="Last login" value={lastLogin} />
          )}
        </div>
      </section>
    </aside>
  );
};

export default ProfileSidebar;
