// src/utils/coverImages.js

/**
 * ================================================================
 * 🎨 PREDEFINED COVER IMAGES - 50 Beautiful Covers
 * ================================================================
 */

export const COVER_IMAGES = [
  // Nature & Landscapes (10)
  {
    id: 1,
    category: "nature",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&h=400&fit=crop",
    name: "Mountain Vista",
  },
  {
    id: 2,
    category: "nature",
    url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&h=400&fit=crop",
    name: "Forest Path",
  },
  {
    id: 3,
    category: "nature",
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&h=400&fit=crop",
    name: "Green Nature",
  },
  {
    id: 4,
    category: "nature",
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600&h=400&fit=crop",
    name: "Misty Mountains",
  },
  {
    id: 5,
    category: "nature",
    url: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=1600&h=400&fit=crop",
    name: "Sunset Lake",
  },
  {
    id: 6,
    category: "nature",
    url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1600&h=400&fit=crop",
    name: "Mountain Reflection",
  },
  {
    id: 7,
    category: "nature",
    url: "https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=1600&h=400&fit=crop",
    name: "Aurora Night",
  },
  {
    id: 8,
    category: "nature",
    url: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1600&h=400&fit=crop",
    name: "Tropical Beach",
  },
  {
    id: 9,
    category: "nature",
    url: "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1600&h=400&fit=crop",
    name: "Starry Night",
  },
  {
    id: 10,
    category: "nature",
    url: "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=1600&h=400&fit=crop",
    name: "Autumn Valley",
  },

  // Abstract & Gradients (10)
  {
    id: 11,
    category: "abstract",
    url: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1600&h=400&fit=crop",
    name: "Blue Abstract",
  },
  {
    id: 12,
    category: "abstract",
    url: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1600&h=400&fit=crop",
    name: "Purple Waves",
  },
  {
    id: 13,
    category: "abstract",
    url: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1600&h=400&fit=crop",
    name: "Colorful Gradient",
  },
  {
    id: 14,
    category: "abstract",
    url: "https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=1600&h=400&fit=crop",
    name: "Neon Lights",
  },
  {
    id: 15,
    category: "abstract",
    url: "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1600&h=400&fit=crop",
    name: "Pink Gradient",
  },
  {
    id: 16,
    category: "abstract",
    url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1600&h=400&fit=crop",
    name: "Gradient Flow",
  },
  {
    id: 17,
    category: "abstract",
    url: "https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?w=1600&h=400&fit=crop",
    name: "Teal Abstract",
  },
  {
    id: 18,
    category: "abstract",
    url: "https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=1600&h=400&fit=crop",
    name: "Orange Wave",
  },
  {
    id: 19,
    category: "abstract",
    url: "https://images.unsplash.com/photo-1557682268-e3955ed5d83f?w=1600&h=400&fit=crop",
    name: "Purple Dream",
  },
  {
    id: 20,
    category: "abstract",
    url: "https://images.unsplash.com/photo-1554034483-04fda0d3507b?w=1600&h=400&fit=crop",
    name: "Blue Burst",
  },

  // Ocean & Water (10)
  {
    id: 21,
    category: "ocean",
    url: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1600&h=400&fit=crop",
    name: "Ocean Waves",
  },
  {
    id: 22,
    category: "ocean",
    url: "https://images.unsplash.com/photo-1484291470158-b8f8d608850d?w=1600&h=400&fit=crop",
    name: "Deep Blue Sea",
  },
  {
    id: 23,
    category: "ocean",
    url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1600&h=400&fit=crop",
    name: "Underwater",
  },
  {
    id: 24,
    category: "ocean",
    url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&h=400&fit=crop",
    name: "Coral Reef",
  },
  {
    id: 25,
    category: "ocean",
    url: "https://images.unsplash.com/photo-1439405326854-014607f694d7?w=1600&h=400&fit=crop",
    name: "Turquoise Water",
  },
  {
    id: 26,
    category: "ocean",
    url: "https://images.unsplash.com/photo-1476673160081-cf065607f449?w=1600&h=400&fit=crop",
    name: "Sea Horizon",
  },
  {
    id: 27,
    category: "ocean",
    url: "https://images.unsplash.com/photo-1513553404607-988bf2703777?w=1600&h=400&fit=crop",
    name: "Ocean Sunset",
  },
  {
    id: 28,
    category: "ocean",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&h=400&fit=crop",
    name: "Sandy Beach",
  },
  {
    id: 29,
    category: "ocean",
    url: "https://images.unsplash.com/photo-1471958680802-1345a694ba6d?w=1600&h=400&fit=crop",
    name: "Coastal Rocks",
  },
  {
    id: 30,
    category: "ocean",
    url: "https://images.unsplash.com/photo-1465447142348-e9952c393450?w=1600&h=400&fit=crop",
    name: "Blue Lagoon",
  },

  // Space & Sky (10)
  {
    id: 31,
    category: "space",
    url: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1600&h=400&fit=crop",
    name: "Milky Way",
  },
  {
    id: 32,
    category: "space",
    url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1600&h=400&fit=crop",
    name: "Galaxy",
  },
  {
    id: 33,
    category: "space",
    url: "https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=1600&h=400&fit=crop",
    name: "Night Stars",
  },
  {
    id: 34,
    category: "space",
    url: "https://images.unsplash.com/photo-1447433589675-4aaa569f3e05?w=1600&h=400&fit=crop",
    name: "Starfield",
  },
  {
    id: 35,
    category: "space",
    url: "https://images.unsplash.com/photo-1464802686167-b939a6910659?w=1600&h=400&fit=crop",
    name: "Northern Lights",
  },
  {
    id: 36,
    category: "space",
    url: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=1600&h=400&fit=crop",
    name: "Nebula",
  },
  {
    id: 37,
    category: "space",
    url: "https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=1600&h=400&fit=crop",
    name: "Cosmic Sky",
  },
  {
    id: 38,
    category: "space",
    url: "https://images.unsplash.com/photo-1514897575457-c4db467cf78e?w=1600&h=400&fit=crop",
    name: "Space Horizon",
  },
  {
    id: 39,
    category: "space",
    url: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=1600&h=400&fit=crop",
    name: "Star Cluster",
  },
  {
    id: 40,
    category: "space",
    url: "https://images.unsplash.com/photo-1465101162946-4377e57745c3?w=1600&h=400&fit=crop",
    name: "Universe",
  },

  // Urban & Architecture (10)
  {
    id: 41,
    category: "urban",
    url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1600&h=400&fit=crop",
    name: "City Skyline",
  },
  {
    id: 42,
    category: "urban",
    url: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1600&h=400&fit=crop",
    name: "Night City",
  },
  {
    id: 43,
    category: "urban",
    url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1600&h=400&fit=crop",
    name: "Modern Building",
  },
  {
    id: 44,
    category: "urban",
    url: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=1600&h=400&fit=crop",
    name: "Urban Architecture",
  },
  {
    id: 45,
    category: "urban",
    url: "https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=1600&h=400&fit=crop",
    name: "City Bridge",
  },
  {
    id: 46,
    category: "urban",
    url: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1600&h=400&fit=crop",
    name: "Neon Streets",
  },
  {
    id: 47,
    category: "urban",
    url: "https://images.unsplash.com/photo-1496568816309-51d7c20e3b21?w=1600&h=400&fit=crop",
    name: "Downtown",
  },
  {
    id: 48,
    category: "urban",
    url: "https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=1600&h=400&fit=crop",
    name: "Sunset City",
  },
  {
    id: 49,
    category: "urban",
    url: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1600&h=400&fit=crop",
    name: "Metro Lights",
  },
  {
    id: 50,
    category: "urban",
    url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1600&h=400&fit=crop",
    name: "Urban Panorama",
  },
];

/**
 * Get a random cover image
 */
export const getRandomCover = () => {
  const randomIndex = Math.floor(Math.random() * COVER_IMAGES.length);
  return COVER_IMAGES[randomIndex];
};

/**
 * Get cover by ID
 */
export const getCoverById = (id) => {
  return COVER_IMAGES.find((cover) => cover.id === id);
};

/**
 * Get covers by category
 */
export const getCoversByCategory = (category) => {
  if (!category || category === "all") return COVER_IMAGES;
  return COVER_IMAGES.filter((cover) => cover.category === category);
};

/**
 * Get all categories
 */
export const COVER_CATEGORIES = [
  { id: "all", name: "All", count: 50 },
  { id: "nature", name: "Nature", count: 10 },
  { id: "abstract", name: "Abstract", count: 10 },
  { id: "ocean", name: "Ocean", count: 10 },
  { id: "space", name: "Space", count: 10 },
  { id: "urban", name: "Urban", count: 10 },
];

export default COVER_IMAGES;
