// src/pages/Home.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import {
  FileText,
  Clock,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Users,
  Search,
  Zap,
  BellRing,
  Sparkles,
  LayoutDashboard,
  MessageSquareText,
  ChevronRight,
  School,
  HelpCircle,
} from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { y: 18, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

const LiveActivityTicker = () => {
  const activities = useMemo(
    () => [
      "Ticket #2093 (Hostel Wi‑Fi) resolved by IT Dept",
      "New complaint submitted: Canteen Hygiene",
      "Ticket #2101 status updated to “In Progress”",
      "Admin posted a new announcement: Exam Schedule",
    ],
    []
  );
  const [index, setIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;
    const timer = setInterval(
      () => setIndex((prev) => (prev + 1) % activities.length),
      4000
    );
    return () => clearInterval(timer);
  }, [activities.length, shouldReduceMotion]);

  return (
    <div className="flex w-full max-w-lg items-center gap-3 rounded-full border border-slate-200 bg-white/90 px-4 py-2 shadow-sm backdrop-blur-md">
      <span className="relative flex h-3 w-3">
        {!shouldReduceMotion && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        )}
        <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={
            shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }
          }
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          className="min-w-[220px] truncate text-xs font-medium text-slate-600"
        >
          {activities[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

const BentoCard = ({
  title,
  desc,
  icon: Icon,
  className = "",
  tint = "indigo",
}) => {
  const tintClasses = {
    indigo: {
      bg: "bg-indigo-50",
      icon: "text-indigo-600",
      halo: "bg-indigo-100",
    },
    blue: {
      bg: "bg-blue-50",
      icon: "text-blue-600",
      halo: "bg-blue-100",
    },
    emerald: {
      bg: "bg-emerald-50",
      icon: "text-emerald-600",
      halo: "bg-emerald-100",
    },
    amber: {
      bg: "bg-amber-50",
      icon: "text-amber-600",
      halo: "bg-amber-100",
    },
    rose: {
      bg: "bg-rose-50",
      icon: "text-rose-600",
      halo: "bg-rose-100",
    },
    purple: {
      bg: "bg-purple-50",
      icon: "text-purple-600",
      halo: "bg-purple-100",
    },
  }[tint];

  return (
    <motion.article
      variants={itemVariants}
      whileHover={{ y: -4 }}
      className={`relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40 ${className}`}
    >
      <div
        className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full ${tintClasses.halo} opacity-60 blur-2xl`}
      />
      <div className={`mb-4 w-fit rounded-2xl ${tintClasses.bg} p-3`}>
        <Icon className={`h-6 w-6 ${tintClasses.icon}`} />
      </div>
      <h3 className="mb-2 text-lg font-bold text-slate-900">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
    </motion.article>
  );
};

const StatBox = ({ label, value, trend }) => (
  <div className="flex flex-col">
    <p className="mb-1 text-sm font-medium text-slate-500">{label}</p>
    <div className="flex items-end gap-2">
      <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
      {trend && (
        <span className="mb-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-bold text-emerald-600">
          {trend}
        </span>
      )}
    </div>
  </div>
);

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [ticketId, setTicketId] = useState("");
  const shouldReduceMotion = useReducedMotion();

  const handleQuickTrack = (e) => {
    e.preventDefault();
    const trimmed = ticketId.trim();
    if (!trimmed) return;
    navigate(`/complaints/track/${trimmed}`);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
      {/* hero */}
      <section className="relative px-6 pb-20 pt-28 lg:pb-32 lg:pt-36">
        <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-indigo-50 to-transparent" />
        {!shouldReduceMotion && (
          <>
            <div className="animate-blob absolute right-0 top-16 -z-10 h-[420px] w-[420px] rounded-full bg-indigo-200/40 blur-3xl" />
            <div className="animation-delay-2000 animate-blob absolute left-0 top-40 -z-10 h-[360px] w-[360px] rounded-full bg-sky-200/40 blur-3xl" />
          </>
        )}

        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={shouldReduceMotion ? false : "hidden"}
            animate={shouldReduceMotion ? "visible" : "visible"}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="mb-6">
              <LiveActivityTicker />
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="mb-6 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl lg:text-6xl"
            >
              Resolve campus issues{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                faster.
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mb-8 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg"
            >
              A centralized complaint portal for students and staff to report
              problems, follow progress, and close the loop with clear
              accountability.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="mb-8 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:gap-6"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-slate-50 sm:text-sm">
                <Sparkles className="h-4 w-4 text-amber-300" />
                Built for colleges and universities
              </div>
              <p>
                No training required. Log in and submit a complaint in under a
                minute.
              </p>
            </motion.div>

            {/* primary actions */}
            <motion.div
              variants={itemVariants}
              className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center"
            >
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => navigate("/complaints/my")}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-slate-300/40 transition-all hover:scale-[1.02] hover:bg-slate-800 active:scale-95"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Go to my complaints
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-indigo-300/40 transition-all hover:scale-[1.02] hover:bg-indigo-700 active:scale-95"
                >
                  Get started
                  <ArrowRight className="h-5 w-5" />
                </button>
              )}

              <Link
                to="/help"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                <HelpCircle className="h-4 w-4" />
                How to use the portal
              </Link>
            </motion.div>

            {/* quick track */}
            <motion.div
              variants={itemVariants}
              className="max-w-md rounded-2xl border border-slate-100 bg-white p-2 shadow-lg"
            >
              <form
                onSubmit={handleQuickTrack}
                className="flex items-center gap-2"
              >
                <div className="pl-3 text-slate-400">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter ticket ID to track status…"
                  className="flex-1 border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:ring-0"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  aria-label="Track complaint by ticket ID"
                />
                <button
                  type="submit"
                  disabled={!ticketId.trim()}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Track
                </button>
              </form>
            </motion.div>
          </motion.div>

          {/* hero right */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: 18 }}
            animate={
              shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }
            }
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="relative hidden lg:block"
            aria-hidden="true"
          >
            <div className="relative z-10 rotate-1 rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl transition-transform duration-500 ease-out hover:rotate-0">
              <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-slate-50">
                    <School className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Campus admin
                    </h3>
                    <p className="text-xs text-slate-500">Overview dashboard</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
              </div>

              <div className="mb-5 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <StatBox label="Total tickets" value="1,284" trend="+12%" />
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <StatBox label="Avg resolution" value="14h" trend="-5%" />
                </div>
              </div>

              <div className="space-y-3">
                {["Hostel Wi‑Fi", "Canteen hygiene", "Library AC"].map(
                  (label, i) => (
                    <div
                      key={label}
                      className="flex cursor-default items-center justify-between rounded-xl p-3 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            i === 0 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                        />
                        <p className="text-xs font-medium text-slate-600">
                          {label}
                        </p>
                      </div>
                      <div className="h-2 w-16 rounded-full bg-slate-100" />
                    </div>
                  )
                )}
              </div>
            </div>

            {!shouldReduceMotion && (
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  ease: "easeInOut",
                }}
                className="absolute -bottom-10 -left-8 z-20 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl"
              >
                <div className="rounded-full bg-emerald-100 p-2 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Ticket resolved
                  </p>
                  <p className="text-xs text-slate-500">Just now</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* features */}
      <section className="relative bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <header className="mx-auto mb-14 max-w-2xl text-center">
            <span className="inline-flex items-center justify-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-indigo-600">
              Why use this portal?
            </span>
            <h2 className="mt-4 mb-3 text-3xl font-bold text-slate-900 md:text-4xl">
              Everything you need to manage campus issues.
            </h2>
            <p className="text-sm text-slate-500 md:text-base">
              From maintenance to academics, every complaint stays organized,
              traceable, and accountable.
            </p>
          </header>

          <motion.div
            initial={shouldReduceMotion ? "visible" : "hidden"}
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={containerVariants}
            className="grid auto-rows-[250px] grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4"
          >
            <motion.article
              variants={itemVariants}
              className="md:col-span-2 lg:col-span-2 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-xl shadow-indigo-500/30"
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
                <Zap className="h-4 w-4" />
                Smart routing system
              </div>
              <h3 className="mb-3 text-xl font-bold">
                Complaints auto‑routed to the right department.
              </h3>
              <p className="text-sm leading-relaxed text-indigo-100">
                Categories like hostel, academics, IT, or facilities route
                directly to the correct team, so issues are seen and acted on
                quickly instead of getting lost in inboxes.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs text-indigo-100/80">
                <Users className="h-4 w-4" />
                Teams only see the tickets that matter to them.
              </div>
            </motion.article>

            <BentoCard
              title="Real‑time tracking"
              desc="Follow progress from Open to Resolved with clear statuses and timestamps."
              icon={Clock}
              tint="blue"
            />
            <BentoCard
              title="Private & secure"
              desc="Role‑based access and optional anonymity for sensitive categories."
              icon={ShieldCheck}
              tint="emerald"
            />
            <BentoCard
              title="Evidence upload"
              desc="Attach photos or PDFs so admins understand your issue at a glance."
              icon={FileText}
              tint="amber"
            />
            <BentoCard
              className="md:col-span-2"
              title="Instant notifications"
              desc="Email and in‑app alerts when your complaint is updated, commented, or closed."
              icon={BellRing}
              tint="rose"
            />
            <BentoCard
              title="Actionable analytics"
              desc="Admins see resolution times, hotspots, and department performance trends."
              icon={TrendingUp}
              tint="purple"
            />
          </motion.div>
        </div>
      </section>

      {/* how it works */}
      <section className="border-t border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="mb-2 text-3xl font-bold text-slate-900">
                How it works
              </h2>
              <p className="text-slate-500">
                A simple three‑step flow from problem to resolution.
              </p>
            </div>
            <Link
              to="/help"
              className="group mt-2 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
            >
              View full guide
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Submit issue",
                desc: "Log in, choose a category, describe the problem, and attach any supporting media.",
                icon: MessageSquareText,
              },
              {
                step: "02",
                title: "Auto‑assignment",
                desc: "The system sends your ticket to the right team and keeps you updated as they work.",
                icon: Users,
              },
              {
                step: "03",
                title: "Resolution & feedback",
                desc: "When the task is completed, you confirm and optionally rate the experience.",
                icon: Sparkles,
              },
            ].map((item) => (
              <article
                key={item.step}
                className="group relative rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="pointer-events-none absolute right-6 top-6 -z-10 select-none text-6xl font-black text-slate-100 transition-colors group-hover:text-indigo-50">
                  {item.step}
                </div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900">
                  {item.title}
                </h3>
                <p className="leading-relaxed text-slate-500">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* final CTA */}
      <section className="bg-slate-900 px-6 py-20 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-5xl">
            Ready to make your voice heard?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-400">
            Use ComplaintMS to report issues, track progress, and help improve
            campus life for everyone.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="rounded-xl bg-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-900/40 transition-transform hover:scale-[1.02] hover:bg-indigo-500 active:scale-95"
            >
              Register now
            </button>
            <button
              type="button"
              onClick={() => navigate("/complaints/new")}
              className="rounded-xl border border-slate-700 px-8 py-4 text-sm font-bold text-white transition-colors hover:bg-slate-800"
            >
              Submit a complaint
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
