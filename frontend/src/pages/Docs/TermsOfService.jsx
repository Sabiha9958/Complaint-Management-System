import React from "react";
import PageShell from "../../components/Basic/PageShell";
import InfoCard from "../../components/Basic/InfoCard";

const TermsOfService = () => {
  const lastUpdated = "14 Dec 2025";

  return (
    <PageShell
      meta="LEGAL"
      title="Terms of Service"
      subtitle="Rules for using ComplaintMS, including account responsibilities and acceptable use."
    >
      <InfoCard title="Acceptance" right={`Last updated: ${lastUpdated}`}>
        By accessing or using ComplaintMS, users agree to follow these terms and
        any institution-specific rules provided by their campus.
      </InfoCard>

      <InfoCard title="Accounts & security">
        Users are responsible for maintaining the confidentiality of their login
        credentials and for activity performed under their account. Do not share
        passwords or attempt to access another user’s data.
      </InfoCard>

      <InfoCard title="Acceptable use">
        <ul className="list-disc space-y-2 pl-5">
          <li>No harassment, threats, hate speech, or abusive language.</li>
          <li>No false reporting or impersonation.</li>
          <li>
            No attempts to bypass authorization, scrape data, or exploit
            vulnerabilities.
          </li>
          <li>
            Upload only content you have the right to share (avoid sensitive
            third‑party data).
          </li>
        </ul>
      </InfoCard>

      <InfoCard title="Content & submissions">
        Users retain ownership of their complaint text and attachments, while
        granting the institution and authorized staff the right to review and
        process submissions for resolution and auditing.
      </InfoCard>

      <InfoCard title="Availability & changes">
        The platform may be updated to improve security and usability. Planned
        maintenance windows should be communicated by the institution when
        possible.
      </InfoCard>

      <InfoCard title="Termination">
        Institutions may suspend accounts for misuse, policy violations, or
        security risks. Users can request deactivation via campus
        administration.
      </InfoCard>

      <InfoCard title="Contact">
        Questions about these terms:{" "}
        <span className="font-black text-white">help@complaintms.in</span>
      </InfoCard>
    </PageShell>
  );
};

export default TermsOfService;
