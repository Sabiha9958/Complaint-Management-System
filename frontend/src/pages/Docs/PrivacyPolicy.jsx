import React from "react";
import PageShell from "../../components/Basic/PageShell";
import InfoCard from "../../components/Basic/InfoCard";

const PrivacyPolicy = () => {
  const lastUpdated = "14 Dec 2025";

  return (
    <PageShell
      meta="LEGAL"
      title="Privacy Policy"
      subtitle="How ComplaintMS collects, uses, shares, and protects personal data in the platform."
    >
      <InfoCard title="Overview" right={`Last updated: ${lastUpdated}`}>
        ComplaintMS is used by educational institutions to receive and manage
        grievances. This policy describes typical data flows for student
        accounts, complaint submissions, and support requests.
      </InfoCard>

      <InfoCard title="Data we collect">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Account data: name, roll number/student ID, email, department, role.
          </li>
          <li>
            Complaint data: category, description, location, timestamps, status
            history, assignee notes.
          </li>
          <li>
            Attachments: images or documents uploaded to support a complaint.
          </li>
          <li>
            Technical data: device/browser metadata, IP address, and security
            logs for abuse prevention.
          </li>
        </ul>
      </InfoCard>

      <InfoCard title="How we use data">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Provide core features: submission, routing, assignment, resolution
            tracking, and notifications.
          </li>
          <li>
            Maintain audit trails for accountability (who changed status, when,
            and why).
          </li>
          <li>Prevent fraud/abuse and keep the platform secure.</li>
          <li>
            Improve usability through aggregated analytics (not for
            advertising).
          </li>
        </ul>
      </InfoCard>

      <InfoCard title="Sharing & access controls">
        ComplaintMS is designed around role-based access. Students can view
        their own complaints; department users can access complaints routed to
        them; admins can access system-wide reports and configuration.
      </InfoCard>

      <InfoCard title="Retention & deletion">
        Complaint records may be retained to meet institutional audit
        requirements and to handle disputes, with retention limited to what is
        necessary for the purpose. In India’s DPDP framework, retention should
        stop when the purpose is no longer served, and individuals can request
        erasure or withdraw consent in applicable cases. [web:26]
      </InfoCard>

      <InfoCard title="Your choices">
        <ul className="list-disc space-y-2 pl-5">
          <li>Update profile fields (where enabled by your institution).</li>
          <li>
            Request correction/erasure via your campus admin or support email.
          </li>
          <li>
            Opt out of non-essential communications (product
            updates/newsletter).
          </li>
        </ul>
      </InfoCard>

      <InfoCard title="Contact">
        Email:{" "}
        <span className="font-black text-white">help@complaintms.in</span>{" "}
        <br />
        Address: Innovation Block, 2nd Floor, Bengaluru, Karnataka 560059, India
      </InfoCard>
    </PageShell>
  );
};

export default PrivacyPolicy;
