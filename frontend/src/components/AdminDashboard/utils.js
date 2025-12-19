export const cx = (...c) => c.filter(Boolean).join(" ");

export const nf = new Intl.NumberFormat("en-IN");

export const formatValue = (v) => {
  if (v == null) return "—";
  if (typeof v === "number") return nf.format(v);
  return String(v);
};

export const formatRelative = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";

  const now = new Date();
  const diffMs = now - date;
  const mins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

export const getInitials = (name = "User") => {
  const s = String(name || "").trim();
  if (!s) return "U";
  return (
    s
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => x[0]?.toUpperCase())
      .join("") || "U"
  );
};

export const statusVariant = (status) => {
  const v = String(status || "")
    .toLowerCase()
    .replaceAll("_", "-");
  if (v === "resolved") return "emerald";
  if (v === "rejected") return "rose";
  if (v === "pending") return "amber";
  if (v === "inprogress" || v === "in-progress") return "blue";
  if (v === "open") return "rose";
  if (v === "closed") return "slate";
  return "gray";
};

export const priorityVariant = (priority) => {
  const v = String(priority || "").toLowerCase();
  if (v === "urgent") return "rose";
  if (v === "high") return "orange";
  if (v === "medium") return "amber";
  return "emerald";
};
