import React from "react";
import PageShell from "../../components/Basic/PageShell";
import InfoCard from "../../components/Basic/InfoCard";

const About = () => {
  const stats = [
    { label: "Designed for", value: "Colleges & universities" },
    {
      label: "Primary workflows",
      value: "Submit → Assign → Resolve → Feedback",
    },
    {
      label: "Core principles",
      value: "Transparency, accountability, privacy",
    },
    { label: "Support", value: "Email 24/7 + office hours" },
  ];

  const values = [
    {
      title: "Student-first",
      desc: "Simple submissions, clear statuses, and predictable timelines.",
    },
    {
      title: "Operational clarity",
      desc: "Ownership, audit trails, and escalation rules that match campus reality.",
    },
    {
      title: "Privacy by design",
      desc: "Role-based visibility so sensitive issues stay restricted.",
    },
    {
      title: "Accessibility",
      desc: "Keyboard-friendly interactions and readable contrast across screens.",
    },
  ];

  return (
    <PageShell
      meta="COMPANY"
      title="About ComplaintMS"
      subtitle="ComplaintMS helps institutions handle grievances with clear routing, faster resolution, and measurable service quality."
    >
      <InfoCard title="Why we built it" right="Est. 2024">
        Many campuses still rely on scattered emails, paper registers, or
        informal messaging groups for complaints. ComplaintMS centralizes
        everything into one trackable workflow, so students get updates and
        departments stay accountable.
      </InfoCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <InfoCard title="What we focus on">
          <div className="grid gap-3">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-xl bg-slate-950/30 p-4 ring-1 ring-white/10"
              >
                <p className="text-sm font-black text-white">{v.title}</p>
                <p className="mt-1 text-sm text-slate-200/90">{v.desc}</p>
              </div>
            ))}
          </div>
        </InfoCard>

        <InfoCard title="At a glance">
          <div className="grid gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex items-start justify-between gap-4 rounded-xl bg-slate-950/30 p-4 ring-1 ring-white/10"
              >
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {s.label}
                </p>
                <p className="text-sm font-black text-white">{s.value}</p>
              </div>
            ))}
          </div>
        </InfoCard>
      </div>

      <InfoCard title="Contact">
        For partnerships, campus onboarding, or security questions, email{" "}
        <span className="font-black text-white">help@complaintms.in</span>.
      </InfoCard>
    </PageShell>
  );
};

export default About;
