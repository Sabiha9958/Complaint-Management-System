import React from "react";
import { Save, Edit3, X, Loader2, User, Briefcase } from "lucide-react";
import AvatarUpload from "./AvatarUpload";
import RoleBadge from "./RoleBadge";
import FormField from "./FormField";

const ProfileHeader = ({
  user,
  isEditing,
  saving,
  formData,
  errors,
  onStartEdit,
  onCancelEdit,
  onSave,
  onInputChange,
}) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-6 md:flex-row md:items-end">
          {/* Avatar */}
          <div className="-mt-28 md:-mt-24">
            <div className="inline-block rounded-full bg-white p-2 shadow-xl ring-1 ring-black/5">
              <AvatarUpload isEditing={isEditing} />
            </div>
          </div>

          {/* Name / Title */}
          <div className="w-full space-y-3">
            {isEditing ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  label="Full name"
                  value={formData.name}
                  onChange={(v) => onInputChange("name", v)}
                  placeholder="Enter your full name"
                  error={errors.name}
                  maxLength={50}
                  icon={User}
                  required
                />
                <FormField
                  label="Job title"
                  value={formData.title}
                  onChange={(v) => onInputChange("title", v)}
                  placeholder="e.g. Senior Software Engineer"
                  error={errors.title}
                  maxLength={100}
                  icon={Briefcase}
                />
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">
                  {user?.name}
                </h1>

                <div className="flex flex-wrap items-center gap-2.5">
                  {user?.title ? (
                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <Briefcase className="h-4 w-4 text-indigo-600" />
                      {user.title}
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-slate-400">
                      No title set
                    </p>
                  )}
                  <RoleBadge role={user?.role} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={onCancelEdit}
                disabled={saving}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </button>

              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onStartEdit}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Edit3 className="mr-2 h-4 w-4" />
              Edit profile
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProfileHeader;
