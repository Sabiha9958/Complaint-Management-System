export function exportComplaintsCsv(
  complaints,
  filenamePrefix = "analytics-report"
) {
  if (!complaints?.length) return false;

  const headers = [
    "Title",
    "Category",
    "Status",
    "Priority",
    "Created By",
    "Date",
  ];
  const rows = complaints.map((c) => [
    `"${String(c.title || "").replace(/"/g, '""')}"`,
    c.category || "N/A",
    c.status || "N/A",
    c.priority || "N/A",
    c.user?.name || "Anonymous",
    c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN") : "N/A",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
  return true;
}
