import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  HelpCircle,
  Info,
  Lock,
  LogIn,
  Mail,
  PencilLine,
  Shield,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const cn = (...c) => c.filter(Boolean).join(" ");

const Tile = ({ title, desc, icon: Icon, to, tone = "indigo" }) => {
  const toneMap = {
    indigo: "from-indigo-600 to-purple-600 shadow-indigo-500/20",
    emerald: "from-emerald-600 to-teal-600 shadow-emerald-500/20",
    orange: "from-orange-600 to-rose-600 shadow-orange-500/20",
    slate: "from-slate-700 to-slate-900 shadow-slate-500/20",
  };

  return (
    <Link
      to={to}
      className={cn(
        "group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition",
        "hover:shadow-lg hover:-translate-y-0.5",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-tr text-white shadow-lg",
            toneMap[tone]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-gray-900">{title}</p>
          <p className="mt-1 text-sm text-gray-600">{desc}</p>
          <div className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-indigo-600">
            Open{" "}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
};

const Card = ({ title, icon: Icon, children, right }) => (
  <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="text-base font-extrabold text-gray-900">{title}</h2>
      </div>
      {right ? (
        <div className="text-xs font-bold text-gray-500">{right}</div>
      ) : null}
    </div>
    <div className="mt-4 text-sm leading-relaxed text-gray-700">{children}</div>
  </section>
);

const Step = ({ title, desc }) => (
  <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
    <div>
      <p className="text-sm font-extrabold text-gray-900">{title}</p>
      <p className="mt-1 text-sm text-gray-600">{desc}</p>
    </div>
  </div>
);

const PublicDashboard = () => {
  const { isAuthenticated, user } = useAuth();

  const tiles = useMemo(
    () => [
      {
        title: "How to submit a complaint",
        desc: "Create a complaint with category, location, and attachments.",
        icon: PencilLine,
        to: "/complaints/new",
        tone: "indigo",
      },
      {
        title: "Track complaint status",
        desc: "View updates, replies, and resolution history in one place.",
        icon: FileText,
        to: "/complaints/my",
        tone: "emerald",
      },
      {
        title: "FAQ",
        desc: "Common questions about routing, timelines, and privacy.",
        icon: HelpCircle,
        to: "/faq",
        tone: "slate",
      },
      {
        title: "Privacy & policies",
        desc: "Read privacy policy, terms, cookies, and accessibility.",
        icon: Lock,
        to: "/privacy-policy",
        tone: "orange",
      },
    ],
    []
  );

  return (
    <div className="bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-extrabold uppercase tracking-widest text-gray-400">
            Public dashboard
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
            Getting started with ComplaintMS
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">
            Use this page to learn how to register, log in, submit complaints,
            and track resolutions.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                >
                  <LogIn className="h-4 w-4" /> Log in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-extrabold text-gray-900 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                >
                  <UserPlus className="h-4 w-4 text-indigo-600" /> Create
                  account
                </Link>
              </>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm">
                Signed in as{" "}
                <span className="font-extrabold text-gray-900">
                  {user?.name}
                </span>
                <span className="mx-2 text-gray-300">•</span>
                Role:{" "}
                <span className="font-extrabold text-gray-900">
                  {user?.role}
                </span>
              </div>
            )}

            <Link
              to="/about"
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
            >
              <Info className="h-4 w-4" /> About
            </Link>
            <Link
              to="/accessibility"
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
            >
              <Shield className="h-4 w-4" /> Accessibility
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-2">
          {tiles.map((t) => (
            <Tile key={t.title} {...t} />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card
            title="Quick start checklist"
            icon={BookOpen}
            right="~2 minutes"
          >
            <div className="grid gap-3">
              <Step
                title="1) Create your account"
                desc="Use your institute email (or the email configured by your campus)."
              />
              <Step
                title="2) Log in and open Workspace"
                desc="Go to Complaints to see your list and updates."
              />
              <Step
                title="3) Submit a complaint"
                desc="Choose the right category to reach the correct department faster."
              />
              <Step
                title="4) Track & respond"
                desc="Reply to follow-up questions and check status changes."
              />
            </div>
          </Card>

          <Card
            title="How to submit a strong complaint"
            icon={PencilLine}
            right="Best practices"
          >
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Add exact location + date/time (hostel block, room no., lab
                name).
              </li>
              <li>
                Write a short, factual description (what happened + impact).
              </li>
              <li>Attach evidence (photo/PDF) when possible.</li>
              <li>
                Select the correct category (Hostel, Academics, IT, Facilities).
              </li>
              <li>
                Avoid personal data of other students unless required by policy.
              </li>
            </ul>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card title="Account help" icon={LogIn} right="Login / register">
            <div className="flex flex-col gap-2">
              <Link
                className="font-bold text-indigo-600 hover:text-indigo-700"
                to="/login"
              >
                Log in
              </Link>
              <Link
                className="font-bold text-indigo-600 hover:text-indigo-700"
                to="/register"
              >
                Register
              </Link>
              <Link
                className="font-bold text-indigo-600 hover:text-indigo-700"
                to="/forgot-password"
              >
                Forgot password
              </Link>
            </div>
          </Card>

          <Card title="Privacy & trust" icon={Lock} right="Policies">
            <div className="flex flex-col gap-2">
              <Link
                className="font-bold text-indigo-600 hover:text-indigo-700"
                to="/privacy-policy"
              >
                Privacy policy
              </Link>
              <Link
                className="font-bold text-indigo-600 hover:text-indigo-700"
                to="/terms-of-service"
              >
                Terms of service
              </Link>
              <Link
                className="font-bold text-indigo-600 hover:text-indigo-700"
                to="/cookie-policy"
              >
                Cookie policy
              </Link>
            </div>
          </Card>

          <Card title="Need support?" icon={Mail} right="Contact">
            <p className="text-sm text-gray-600">
              Email support:{" "}
              <span className="font-extrabold text-gray-900">
                help@complaintms.in
              </span>
            </p>
            <p className="mt-2 text-sm text-gray-600">
              For urgent campus issues, contact your department office as per
              institute guidelines.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PublicDashboard;
