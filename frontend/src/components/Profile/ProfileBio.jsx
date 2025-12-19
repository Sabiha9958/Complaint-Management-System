import React from "react";
import { User } from "lucide-react";
import FormField from "./FormField";

const ProfileBio = ({ user, isEditing, formData, errors, onInputChange }) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <header className="mb-4 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 ring-1 ring-indigo-100">
          <User className="h-5 w-5 text-indigo-600" />
        </span>
        <div>
          <h3 className="text-lg font-bold text-slate-900">About</h3>
          <p className="text-xs font-medium text-slate-500">
            Share a short bio for your profile.
          </p>
        </div>
      </header>

      {isEditing ? (
        <FormField
          label="Biography"
          value={formData.bio}
          onChange={(v) => onInputChange("bio", v)}
          placeholder="Tell your team about yourself, your interests, and what you do..."
          error={errors.bio}
          maxLength={500}
          rows={6}
        />
      ) : (
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
          {user?.bio ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {user.bio}
            </p>
          ) : (
            <p className="text-sm italic text-slate-400">
              No bio added yet. Click “Edit profile” to add one.
            </p>
          )}
        </div>
      )}
    </section>
  );
};

export default ProfileBio;
