// src/components/profile/CoverGallery.jsx

/**
 * ================================================================
 * 🖼️ COVER GALLERY MODAL - Select from 50 covers
 * ================================================================
 */

import React, { useState, useMemo } from "react";
import { X, Check, Search, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import {
  COVER_IMAGES,
  COVER_CATEGORIES,
  getCoversByCategory,
} from "../../utils/coverImages";

const CoverGallery = ({ isOpen, onClose, currentCoverId }) => {
  const { updateProfile, loading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCover, setSelectedCover] = useState(currentCoverId);
  const [hoveredCover, setHoveredCover] = useState(null);

  // Filter images based on category and search
  const filteredImages = useMemo(() => {
    let images = getCoversByCategory(selectedCategory);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      images = images.filter(
        (img) =>
          img.name.toLowerCase().includes(query) ||
          img.category.toLowerCase().includes(query)
      );
    }

    return images;
  }, [selectedCategory, searchQuery]);

  const handleSelectCover = async (cover) => {
    setSelectedCover(cover.id);

    try {
      const result = await updateProfile({ coverId: cover.id });

      if (result.success) {
        toast.success(`Cover changed to "${cover.name}"!`, {
          toastId: "cover-changed",
        });
        onClose();
      }
    } catch (error) {
      console.error("Cover selection error:", error);
      toast.error("Failed to update cover. Please try again.", {
        toastId: "cover-error",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Choose Your Cover Photo
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Select from 50 beautiful cover images
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-white/80 transition-colors disabled:opacity-50"
            aria-label="Close gallery"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search covers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {COVER_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  selectedCategory === category.id
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category.name}
                <span className="ml-2 text-xs opacity-75">
                  ({category.count})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Search className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg font-semibold">
                No covers found
              </p>
              <p className="text-gray-400 text-sm">
                Try a different search or category
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredImages.map((cover) => (
                <div
                  key={cover.id}
                  className="relative group cursor-pointer"
                  onMouseEnter={() => setHoveredCover(cover.id)}
                  onMouseLeave={() => setHoveredCover(null)}
                  onClick={() => handleSelectCover(cover)}
                >
                  <div
                    className={`relative aspect-[4/1] rounded-xl overflow-hidden transition-all duration-300 ${
                      selectedCover === cover.id
                        ? "ring-4 ring-blue-600 ring-offset-2"
                        : "ring-2 ring-gray-200 hover:ring-gray-300"
                    }`}
                  >
                    <img
                      src={cover.url}
                      alt={cover.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Overlay */}
                    <div
                      className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                        hoveredCover === cover.id || selectedCover === cover.id
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    >
                      {selectedCover === cover.id ? (
                        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg">
                          <Check className="w-5 h-5" />
                          Selected
                        </div>
                      ) : loading ? (
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      ) : (
                        <div className="bg-white text-gray-900 px-4 py-2 rounded-lg font-semibold shadow-lg">
                          Select
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Image Name */}
                  <p className="mt-2 text-sm font-semibold text-gray-700 text-center truncate">
                    {cover.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {filteredImages.length}{" "}
            {filteredImages.length === 1 ? "cover" : "covers"} available
          </p>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoverGallery;
