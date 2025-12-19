import React from "react";
import PageShell from "../../components/Basic/PageShell";
import InfoCard from "../../components/Basic/InfoCard";

const CookiePolicy = () => {
  const lastUpdated = "14 Dec 2025";

  const cookies = [
    {
      name: "Session / auth",
      purpose: "Keep users signed in and maintain secure sessions.",
      examples: "access_token (httpOnly), refresh_token (httpOnly)",
      category: "Essential",
      duration: "Session to 30 days",
    },
    {
      name: "Preferences",
      purpose: "Remember theme, language, and basic UI preferences.",
      examples: "ui_theme, sidebar_state",
      category: "Essential",
      duration: "30–180 days",
    },
    {
      name: "Security",
      purpose: "Protect against abuse and suspicious login patterns.",
      examples: "csrf_token, device_fingerprint_hint",
      category: "Essential",
      duration: "Session to 90 days",
    },
    {
      name: "Analytics",
      purpose: "Understand feature usage to improve performance and UX.",
      examples: "anonymous_usage_id",
      category: "Non-essential",
      duration: "30–365 days",
    },
  ];

  return (
    <PageShell
      meta="LEGAL"
      title="Cookie Policy"
      subtitle="Cookies help run ComplaintMS reliably and securely, and (optionally) help us understand usage trends."
    >
      <InfoCard title="Summary" right={`Last updated: ${lastUpdated}`}>
        Essential cookies support login, security, and core platform
        functionality. Non-essential cookies (like analytics) are used only
        where enabled by the institution and may require consent depending on
        applicable laws and settings. [web:27][web:36]
      </InfoCard>

      <InfoCard title="Cookie categories">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-xs font-black uppercase tracking-widest text-slate-400">
                <th className="border-b border-white/10 px-3 py-3">Category</th>
                <th className="border-b border-white/10 px-3 py-3">Cookie</th>
                <th className="border-b border-white/10 px-3 py-3">Purpose</th>
                <th className="border-b border-white/10 px-3 py-3">Examples</th>
                <th className="border-b border-white/10 px-3 py-3">Duration</th>
              </tr>
            </thead>
            <tbody>
              {cookies.map((c) => (
                <tr
                  key={`${c.category}-${c.name}`}
                  className="text-sm text-slate-200/90"
                >
                  <td className="border-b border-white/10 px-3 py-3 font-black text-white">
                    {c.category}
                  </td>
                  <td className="border-b border-white/10 px-3 py-3">
                    {c.name}
                  </td>
                  <td className="border-b border-white/10 px-3 py-3">
                    {c.purpose}
                  </td>
                  <td className="border-b border-white/10 px-3 py-3">
                    {c.examples}
                  </td>
                  <td className="border-b border-white/10 px-3 py-3">
                    {c.duration}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </InfoCard>

      <InfoCard title="Managing cookies">
        You can control cookies via browser settings. If essential cookies are
        blocked, login and core features may not function correctly.
      </InfoCard>
    </PageShell>
  );
};

export default CookiePolicy;
