// src/pages/ProfilePage.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

import ProfileHeader from "../../components/Profile/ProfileHeader";
import ProfileInfo from "../../components/Profile/ProfileInfo";
import ProfileBio from "../../components/Profile/ProfileBio";
import ProfileSidebar from "../../components/Profile/ProfileSidebar";

import CoverSelector from "../../components/Profile/CoverSelector";
import CoverDisplay from "../../components/Profile/CoverDisplay";

import { validateForm } from "../../utils/profileValidators";

const buildForm = (u) => ({
  name: u?.name || "",
  title: u?.title || "",
  department: u?.department || "",
  location: u?.location || "",
  bio: u?.bio || "",
  coverId: u?.coverId || 1,
});

const ProfilePage = () => {
  const { user, updateProfile, loading: authLoading } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [coverSelectorOpen, setCoverSelectorOpen] = useState(false);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);
  const [formData, setFormData] = useState(() => buildForm(user));

  useEffect(() => {
    if (!user || isEditing) return;
    setFormData(buildForm(user));
  }, [user, isEditing]);

  const coverIdToShow = useMemo(
    () => (isEditing ? formData.coverId : user?.coverId || 1),
    [isEditing, formData.coverId, user?.coverId]
  );

  const completeness = useMemo(() => {
    const source = isEditing ? formData : user;
    if (!source) return 0;

    const fields = ["name", "title", "bio", "department", "location"];
    const filled = fields.filter((f) => source?.[f]?.toString().trim()).length;
    return Math.round((filled / fields.length) * 100);
  }, [user, formData, isEditing]);

  const startEdit = useCallback(() => {
    setErrors({});
    setIsEditing(true);
  }, []);

  const cancelEdit = useCallback(() => {
    setErrors({});
    setIsEditing(false);
    setCoverPreviewUrl(null);
    setFormData(buildForm(user));
  }, [user]);

  const onInputChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  }, []);

  const openCoverSelector = useCallback(() => {
    setCoverSelectorOpen(true);
  }, []);

  const closeCoverSelector = useCallback(() => {
    setCoverSelectorOpen(false);
    setCoverPreviewUrl(null);
  }, []);

  const applyCover = useCallback(
    async (coverId) => {
      if (isEditing) {
        setFormData((prev) => ({ ...prev, coverId }));
        toast.success(`Cover #${coverId} selected. Save profile to apply.`, {
          toastId: "cover-selected",
        });
        return { success: true };
      }

      setSaving(true);
      try {
        const result = await updateProfile({ coverId });
        if (!result?.success)
          throw new Error(result?.message || "Update failed");

        setCoverPreviewUrl(null);
        toast.success("Cover applied!", { toastId: "cover-applied" });
        return result;
      } catch (e) {
        toast.error(e?.message || "Failed to update cover", {
          toastId: "cover-error",
        });
        return { success: false, message: e?.message };
      } finally {
        setSaving(false);
      }
    },
    [isEditing, updateProfile]
  );

  const saveProfile = useCallback(async () => {
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      toast.error("Please fix validation errors", {
        toastId: "validation-error",
      });
      return;
    }

    setSaving(true);
    try {
      const result = await updateProfile(formData);
      if (!result?.success) throw new Error(result?.message || "Update failed");

      setIsEditing(false);
      setErrors({});
      setCoverPreviewUrl(null);
      setFormData(buildForm(result.user || { ...user, ...formData }));

      toast.success("Profile updated successfully!", {
        toastId: "profile-updated",
      });
    } catch (e) {
      toast.error(e?.message || "Failed to update profile", {
        toastId: "update-error",
      });
    } finally {
      setSaving(false);
    }
  }, [formData, updateProfile, user]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-indigo-600" />
          <p className="text-lg font-semibold text-gray-700">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 pb-20">
        <section className="relative h-[280px] lg:h-[360px]">
          <CoverDisplay
            coverId={coverIdToShow}
            isEditing={isEditing}
            onOpenSelector={openCoverSelector}
            previewUrl={coverPreviewUrl}
          />

          {(saving || authLoading) && (
            <div className="absolute right-6 top-6 z-20 flex items-center gap-3 rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white shadow-2xl">
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving changes...
            </div>
          )}
        </section>

        <div className="relative z-10 -mt-20 mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="space-y-6 lg:w-2/3">
              <ProfileHeader
                user={user}
                isEditing={isEditing}
                saving={saving}
                formData={formData}
                errors={errors}
                onStartEdit={startEdit}
                onCancelEdit={cancelEdit}
                onSave={saveProfile}
                onInputChange={onInputChange}
              />

              <ProfileInfo
                user={user}
                isEditing={isEditing}
                formData={formData}
                errors={errors}
                onInputChange={onInputChange}
              />

              <ProfileBio
                user={user}
                isEditing={isEditing}
                formData={formData}
                errors={errors}
                onInputChange={onInputChange}
              />
            </div>

            <ProfileSidebar user={user} completeness={completeness} />
          </div>
        </div>
      </main>

      <CoverSelector
        isOpen={coverSelectorOpen}
        onClose={closeCoverSelector}
        currentCoverId={coverIdToShow}
        onPreview={(url) => setCoverPreviewUrl(url)}
        onSelect={async (coverId) => {
          await applyCover(coverId);
          closeCoverSelector();
        }}
      />
    </>
  );
};

export default ProfilePage;
