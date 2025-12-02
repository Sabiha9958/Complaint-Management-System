// src/components/profile/CoverUpload.jsx

/**
 * ================================================================
 * 🎨 COVER UPLOAD - Displays current cover & opens gallery
 * ================================================================
 */

import React, { useState, useMemo } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { getCoverById, getRandomCover } from "../../utils/coverImages";
import CoverGallery from "./CoverGallery";

const CoverUpload = ({ isEditing = false, className = "" }) => {
  const { user, loading } = useAuth();
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Get current cover image
  const currentCover = useMemo(() => {
    // If user has a coverId, get that cover
    if (user?.coverId) {
      const cover = getCoverById(user.coverId);
      if (cover) return cover;
    }

    // Fallback to random cover (or first cover)
    return getRandomCover();
  }, [user?.coverId]);

  const handleClick = () => {
    if (!isEditing) {
      toast.warning("Enable edit mode to change your cover photo", {
        toastId: "cover-edit-disabled",
      });
      return;
    }
    if (loading) return;
    setIsGalleryOpen(true);
  };

  const handleImageError = (e) => {
    // Fallback gradient if image fails to load
    e.target.style.display = "none";
  };

  const canInteract = isEditing && !loading;

  return (
    <>
      <div
        onClick={handleClick}
        className={`relative w-full h-full group ${
          canInteract ? "cursor-pointer" : ""
        } ${className}`}
      >
        {/* Cover Image */}
        {currentCover?.url ? (
          <img
            src={`${currentCover.url}&t=${Date.now()}`}
            alt={currentCover.name || "Cover photo"}
            className="w-full h-full object-cover"
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600" />
        )}

        {/* Hover Overlay - Only when editing */}
        {canInteract && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="bg-white/95 px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 transform scale-95 group-hover:scale-100 transition-transform">
              <Camera className="w-6 h-6 text-blue-600" />
              <span className="text-gray-900 font-bold text-lg">
                Change Cover Photo
              </span>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-indigo-600/90 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-14 h-14 text-white animate-spin" />
            <span className="text-white text-xl font-bold drop-shadow-lg">
              Updating cover photo...
            </span>
          </div>
        )}

        {/* Edit Mode Indicator */}
        {!isEditing && !loading && (
          <div className="absolute top-4 right-4">
            <div className="bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg font-semibold text-sm">
              Enable edit mode
            </div>
          </div>
        )}
      </div>

      {/* Cover Gallery Modal */}
      <CoverGallery
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        currentCoverId={user?.coverId || currentCover?.id}
      />
    </>
  );
};

export default CoverUpload;
