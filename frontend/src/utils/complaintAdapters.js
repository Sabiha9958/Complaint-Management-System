export const complaintId = (c) => c?._id || c?.id || c?.complaintId;

export const normalizeComplaint = (c) => {
  if (!c) return null;
  const id = complaintId(c);

  return {
    ...c,
    _id: c._id || id,
    id,
    title: c.title || "",
    description: c.description || "",
    category: c.category || "other",
    priority: c.priority || "medium",
    createdAt: c.createdAt || null,
    updatedAt: c.updatedAt || null,
    contactInfo: c.contactInfo || {
      name: c.user?.name || "",
      email: c.user?.email || "",
      phone: c.user?.phone || "",
    },
    attachments: Array.isArray(c.attachments) ? c.attachments : [],
  };
};

export const pickComplaintList = (res) => {
  const payload = res?.data ?? res;
  const data = payload?.data ?? payload;

  const list =
    data?.complaints ||
    payload?.complaints ||
    data?.items ||
    payload?.items ||
    (Array.isArray(data) ? data : Array.isArray(payload) ? payload : []);

  const pagination = payload?.pagination || data?.pagination || null;
  return {
    list: Array.isArray(list) ? list.map(normalizeComplaint) : [],
    pagination,
  };
};

export const pickComplaintDetail = (res) => {
  const payload = res?.data ?? res;
  const data = payload?.data ?? payload;
  const c = data?.complaint || payload?.complaint || data;
  return normalizeComplaint(c);
};
