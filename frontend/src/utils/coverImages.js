// coverImages.js

const buildUnsplashUrl = (url, params = {}) => {
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set("auto", "format,compress");

    Object.entries(params).forEach(([key, value]) => {
      if (value) urlObj.searchParams.set(key, String(value));
    });

    return urlObj.toString();
  } catch {
    return url;
  }
};

export const getCoverById = (id) =>
  COVER_IMAGES.find((cover) => cover.id === Number(id)) || COVER_IMAGES[0];

export const getFullCoverUrl = (url) =>
  buildUnsplashUrl(url, { w: 1920, h: 600, fit: "crop", q: 90 });

export const getThumbCoverUrl = (url) =>
  buildUnsplashUrl(url, { w: 480, h: 300, fit: "crop", q: 75 });

export const preloadImage = (src) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
  });
};

export const COVER_CATEGORIES = [
  { id: "all", label: "All", icon: "🎨" },
  { id: "nature", label: "Nature", icon: "🌿" },
  { id: "urban", label: "Urban", icon: "🏙️" },
  { id: "ocean", label: "Ocean", icon: "🌊" },
  { id: "space", label: "Space", icon: "🌌" },
  { id: "abstract", label: "Abstract", icon: "✨" },
];

export const COVER_IMAGES = [
  // Nature
  {
    id: 1,
    category: "nature",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    name: "Mountain Vista",
  },
  {
    id: 2,
    category: "nature",
    url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e",
    name: "Forest Path",
  },
  {
    id: 3,
    category: "nature",
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
    name: "Green Nature",
  },
  {
    id: 4,
    category: "nature",
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05",
    name: "Misty Mountains",
  },
  {
    id: 5,
    category: "nature",
    url: "https://images.unsplash.com/photo-1426604966848-d7adac402bff",
    name: "Sunset Lake",
  },
  {
    id: 6,
    category: "nature",
    url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e",
    name: "Mountain Reflection",
  },
  {
    id: 7,
    category: "nature",
    url: "https://images.unsplash.com/photo-1511884642898-4c92249e20b6",
    name: "Aurora Night",
  },
  {
    id: 8,
    category: "nature",
    url: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29",
    name: "Tropical Beach",
  },
  {
    id: 9,
    category: "nature",
    url: "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5",
    name: "Starry Night",
  },
  {
    id: 10,
    category: "nature",
    url: "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1",
    name: "Autumn Valley",
  },

  // Abstract
  {
    id: 11,
    category: "abstract",
    url: "https://images.unsplash.com/photo-1557672172-298e090bd0f1",
    name: "Blue Abstract",
  },
  {
    id: 12,
    category: "abstract",
    url: "https://images.unsplash.com/photo-1557682250-33bd709cbe85",
    name: "Purple Waves",
  },
  {
    id: 13,
    category: "abstract",
    url: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d",
    name: "Colorful Gradient",
  },
  {
    id: 14,
    category: "abstract",
    url: "https://images.unsplash.com/photo-1550859492-d5da9d8e45f3",
    name: "Neon Lights",
  },
  {
    id: 15,
    category: "abstract",
    url: "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986",
    name: "Pink Gradient",
  },
  {
    id: 16,
    category: "abstract",
    url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809",
    name: "Gradient Flow",
  },
  {
    id: 17,
    category: "abstract",
    url: "https://images.unsplash.com/photo-1553356084-58ef4a67b2a7",
    name: "Teal Abstract",
  },
  {
    id: 18,
    category: "abstract",
    url: "https://images.unsplash.com/photo-1557682224-5b8590cd9ec5",
    name: "Orange Wave",
  },
  {
    id: 19,
    category: "abstract",
    url: "https://images.unsplash.com/photo-1557682268-e3955ed5d83f",
    name: "Purple Dream",
  },
  {
    id: 20,
    category: "abstract",
    url: "https://images.unsplash.com/photo-1554034483-04fda0d3507b",
    name: "Blue Burst",
  },

  // Ocean
  {
    id: 21,
    category: "ocean",
    url: "https://images.unsplash.com/photo-1505142468610-359e7d316be0",
    name: "Ocean Waves",
  },
  {
    id: 22,
    category: "ocean",
    url: "https://images.unsplash.com/photo-1484291470158-b8f8d608850d",
    name: "Deep Blue Sea",
  },
  {
    id: 23,
    category: "ocean",
    url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b",
    name: "Underwater",
  },
  {
    id: 24,
    category: "ocean",
    url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19",
    name: "Coral Reef",
  },
  {
    id: 25,
    category: "ocean",
    url: "https://images.unsplash.com/photo-1439405326854-014607f694d7",
    name: "Turquoise Water",
  },
  {
    id: 26,
    category: "ocean",
    url: "https://images.unsplash.com/photo-1476673160081-cf065607f449",
    name: "Sea Horizon",
  },
  {
    id: 27,
    category: "ocean",
    url: "https://images.unsplash.com/photo-1513553404607-988bf2703777",
    name: "Ocean Sunset",
  },
  {
    id: 28,
    category: "ocean",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    name: "Sandy Beach",
  },
  {
    id: 29,
    category: "ocean",
    url: "https://images.unsplash.com/photo-1471958680802-1345a694ba6d",
    name: "Coastal Rocks",
  },
  {
    id: 30,
    category: "ocean",
    url: "https://images.unsplash.com/photo-1465447142348-e9952c393450",
    name: "Blue Lagoon",
  },

  // Space
  {
    id: 31,
    category: "space",
    url: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a",
    name: "Milky Way",
  },
  {
    id: 32,
    category: "space",
    url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564",
    name: "Galaxy",
  },
  {
    id: 33,
    category: "space",
    url: "https://images.unsplash.com/photo-1444080748397-f442aa95c3e5",
    name: "Night Stars",
  },
  {
    id: 34,
    category: "space",
    url: "https://images.unsplash.com/photo-1447433589675-4aaa569f3e05",
    name: "Starfield",
  },
  {
    id: 35,
    category: "space",
    url: "https://images.unsplash.com/photo-1464802686167-b939a6910659",
    name: "Northern Lights",
  },
  {
    id: 36,
    category: "space",
    url: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0",
    name: "Nebula",
  },
  {
    id: 37,
    category: "space",
    url: "https://images.unsplash.com/photo-1532693322450-2cb5c511067d",
    name: "Cosmic Sky",
  },
  {
    id: 38,
    category: "space",
    url: "https://images.unsplash.com/photo-1514897575457-c4db467cf78e",
    name: "Space Horizon",
  },
  {
    id: 39,
    category: "space",
    url: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78",
    name: "Star Cluster",
  },
  {
    id: 40,
    category: "space",
    url: "https://images.unsplash.com/photo-1465101162946-4377e57745c3",
    name: "Universe",
  },

  // Urban
  {
    id: 41,
    category: "urban",
    url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000",
    name: "City Skyline",
  },
  {
    id: 42,
    category: "urban",
    url: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b",
    name: "Night City",
  },
  {
    id: 43,
    category: "urban",
    url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df",
    name: "Modern Building",
  },
  {
    id: 44,
    category: "urban",
    url: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99",
    name: "Urban Architecture",
  },
  {
    id: 45,
    category: "urban",
    url: "https://images.unsplash.com/photo-1470058869958-2a77ade41c02",
    name: "City Bridge",
  },
  {
    id: 46,
    category: "urban",
    url: "https://images.unsplash.com/photo-1514565131-fce0801e5785",
    name: "Neon Streets",
  },
  {
    id: 47,
    category: "urban",
    url: "https://images.unsplash.com/photo-1496568816309-51d7c20e3b21",
    name: "Downtown",
  },
  {
    id: 48,
    category: "urban",
    url: "https://images.unsplash.com/photo-1444723121867-7a241cacace9",
    name: "Sunset City",
  },
  {
    id: 49,
    category: "urban",
    url: "https://images.unsplash.com/photo-1487958449943-2429e8be8625",
    name: "Metro Lights",
  },
  {
    id: 50,
    category: "urban",
    url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390",
    name: "Urban Panorama",
  },
];
