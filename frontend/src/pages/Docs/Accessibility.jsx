import React from "react";
import PageShell from "../../components/Basic/PageShell";
import InfoCard from "../../components/Basic/InfoCard";

const Accessibility = () => {
  const lastUpdated = "14 Dec 2025";

  return (
    <PageShell
      meta="ACCESSIBILITY"
      title="Accessibility Statement"
      subtitle="ComplaintMS aims to be usable by everyone, including people using assistive technologies."
    >
      <InfoCard title="Commitment" right={`Last updated: ${lastUpdated}`}>
        ComplaintMS is committed to providing an accessible experience and
        continuously improving keyboard support, focus visibility, and readable
        layouts. Accessibility statements commonly include a commitment, the
        accessibility standard used, and contact info for reporting issues.
        [web:21]
      </InfoCard>

      <InfoCard title="Standards & scope">
        We aim to align with the Web Content Accessibility Guidelines (WCAG) and
        prioritize Level AA success criteria across core user journeys (login,
        submit complaint, view status, add notes). It’s a good practice to name
        the WCAG version/level and scope clearly in the statement.
        [web:25][web:21]
      </InfoCard>

      <InfoCard title="Known limitations">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Some uploaded PDF files may not be fully accessible if created
            without tags.
          </li>
          <li>
            Third‑party embedded content (maps, external links) may have
            separate accessibility behavior.
          </li>
          <li>
            Very large tables may require horizontal scrolling on small screens.
          </li>
        </ul>
      </InfoCard>

      <InfoCard title="Feedback & support">
        If something is not working with a screen reader or keyboard-only
        navigation, report it at{" "}
        <span className="font-black text-white">help@complaintms.in</span> with
        your browser/device details and the page URL. Including contact
        information and a way to report issues is a core part of an
        accessibility statement. [web:21]
      </InfoCard>
    </PageShell>
  );
};

export default Accessibility;
