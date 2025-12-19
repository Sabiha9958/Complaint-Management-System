import React from "react";
import PageShell from "../../components/Basic/PageShell";
import InfoCard from "../../components/Basic/InfoCard";
import Accordion from "../../components/Basic/Accordion";
import { Link } from "react-router-dom";

const FAQ = () => {
  const items = [
    {
      q: "Who can submit a complaint?",
      a: "Any authenticated student (or staff member if your campus enables staff accounts) can submit a complaint. Admins can restrict categories by department to avoid misrouting.",
    },
    {
      q: "What details should be included for faster resolution?",
      a: "Add the location, date/time, a short description, and any supporting files (photo/PDF). Clear evidence and the right category typically reduce back-and-forth.",
    },
    {
      q: "How are complaints assigned?",
      a: "Complaints are routed by category and department rules (e.g., Hostel → Warden Office, Academics → HOD). Escalations can trigger after SLA breach windows if configured.",
    },
    {
      q: "Can a complaint be anonymous?",
      a: "By default, no. Many institutions require traceability for follow-ups. If your policy allows it, an “anonymous to department” mode can be added where only admins can view identity.",
    },
    {
      q: "What is the expected resolution time?",
      a: "Most issues are acknowledged within 24–48 hours and resolved based on category severity. Some cases require on-site verification and can take longer during holidays.",
    },
    {
      q: "How do attachments work?",
      a: "Attachments are stored securely and only visible to authorized roles for that complaint. Large files may be rejected based on campus policy.",
    },
  ];

  return (
    <PageShell
      meta="HELP CENTER"
      title="Frequently asked questions"
      subtitle="Quick answers about submissions, routing, privacy, and resolution timelines."
    >
      <InfoCard title="Popular topics" right="Updated for 2025">
        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-xl bg-white/5 px-3 py-2 text-xs font-black text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
            to="/submit-complaint"
          >
            Submit a complaint
          </Link>
          <Link
            className="rounded-xl bg-white/5 px-3 py-2 text-xs font-black text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
            to="/privacy-policy"
          >
            Privacy policy
          </Link>
          <Link
            className="rounded-xl bg-white/5 px-3 py-2 text-xs font-black text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
            to="/accessibility"
          >
            Accessibility
          </Link>
        </div>
      </InfoCard>

      <InfoCard title="General">
        <Accordion items={items} />
      </InfoCard>
    </PageShell>
  );
};

export default FAQ;
