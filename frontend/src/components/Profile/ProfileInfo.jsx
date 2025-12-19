import React, { useCallback } from "react";
import { Mail, Building2, MapPin } from "lucide-react";
import { toast } from "react-toastify";
import FormField from "./FormField";
import InfoCard from "./InfoCard";

const ProfileInfo = ({ user, isEditing, formData, errors, onInputChange }) => {
  const copyEmail = useCallback(async () => {
    if (!user?.email) return;
    try {
      await navigator.clipboard.writeText(user.email);
      toast.success("Email copied!", { toastId: "email-copied" });
    } catch {
      toast.error("Copy failed", { toastId: "email-copy-failed" });
    }
  }, [user?.email]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <header className="mb-5">
        <h3 className="text-lg font-bold text-slate-900">Profile details</h3>
        <p className="mt-1 text-xs font-medium text-slate-500">
          Basic contact and workplace info.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {isEditing ? (
          <>
            <FormField
              label="Email"
              value={user?.email}
              onChange={() => {}}
              icon={Mail}
              disabled
            />

            <FormField
              label="Department"
              value={formData.department}
              onChange={(v) => onInputChange("department", v)}
              placeholder="e.g. Engineering"
              error={errors.department}
              maxLength={50}
              icon={Building2}
            />

            <FormField
              label="Location"
              value={formData.location}
              onChange={(v) => onInputChange("location", v)}
              placeholder="e.g. San Francisco, CA"
              error={errors.location}
              maxLength={100}
              icon={MapPin}
            />
          </>
        ) : (
          <>
            <InfoCard
              icon={Mail}
              label="Email"
              value={user?.email || "—"}
              onCopy={copyEmail}
            />
            <InfoCard
              icon={Building2}
              label="Department"
              value={user?.department?.trim() || "Not specified"}
            />
            <InfoCard
              icon={MapPin}
              label="Location"
              value={user?.location?.trim() || "Not specified"}
            />
          </>
        )}
      </div>
    </section>
  );
};

export default ProfileInfo;
