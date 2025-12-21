import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";
import { ComplaintAPI } from "../../api/complaints";
import { hasPermission } from "../../utils/constants";
import { useAuth } from "../../context/AuthContext";
import ComplaintCard from "./ComplaintCard";
import ComplaintFilters from "./ComplaintFilters";
import StatusUpdateModal from "./StatusUpdateModal";

const cx = (...c) => c.filter(Boolean).join(" ");
const getId = (c) => c?._id || c?.id || c?.complaintId;

const CONFIG = { ITEMS_PER_PAGE: 21, DEFAULT_SORT: "-createdAt" };
const clamp = (n, min, max) => Math.max(min, Math.min(Number(n), max));

const parseListResponse = (res, limit) => {
  const payload = res?.data ?? res;
  const data = payload?.data ?? payload;

  const list =
    data?.complaints ||
    payload?.complaints ||
    data?.items ||
    payload?.items ||
    (Array.isArray(data) ? data : Array.isArray(payload) ? payload : []);

  const meta =
    payload?.pagination || data?.pagination || payload?.meta || data?.meta;
  const total = Number(meta?.total ?? payload?.total ?? list?.length ?? 0);
  const totalPages = Number(
    meta?.totalPages ??
      meta?.pages ??
      payload?.totalPages ??
      data?.totalPages ??
      (total ? Math.ceil(total / limit) : 1)
  );
  return {
    list: Array.isArray(list) ? list : [],
    total,
    totalPages: Math.max(1, totalPages),
  };
};

const readFiltersFromParams = (sp) => ({
  page: Number(sp.get("page") || 1),
  status: sp.get("status") || "",
  category: sp.get("category") || "",
  priority: sp.get("priority") || "",
  search: sp.get("search") || "",
  sort: sp.get("sort") || CONFIG.DEFAULT_SORT,
});

const writeFiltersToParams = (filters) => {
  const p = new URLSearchParams();
  if (filters.page && filters.page !== 1) p.set("page", String(filters.page));
  if (filters.search?.trim()) p.set("search", filters.search.trim());
  if (filters.status) p.set("status", filters.status);
  if (filters.category) p.set("category", filters.category);
  if (filters.priority) p.set("priority", filters.priority);
  if (filters.sort && filters.sort !== CONFIG.DEFAULT_SORT)
    p.set("sort", filters.sort);
  return p;
};

function SkeletonCard() {
  return (
    <div className="h-64 animate-pulse rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 h-6 w-3/4 rounded-lg bg-slate-100" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded-lg bg-slate-100" />
        <div className="h-4 w-2/3 rounded-lg bg-slate-100" />
      </div>
      <div className="mt-8 flex gap-2">
        <div className="h-8 w-20 rounded-full bg-slate-100" />
        <div className="h-8 w-20 rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <div className="mb-6 rounded-2xl bg-slate-50 p-5 text-slate-300 ring-1 ring-slate-200/60">
        <FiAlertCircle size={44} />
      </div>
      <h3 className="text-xl font-extrabold text-slate-900">
        No complaints found
      </h3>
      <p className="mt-2 max-w-md text-sm font-semibold text-slate-500">
        {hasFilters
          ? "Try clearing filters or adjusting your search."
          : "No complaints available right now."}
      </p>
      {hasFilters ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-8 rounded-2xl bg-slate-900 px-7 py-3 text-sm font-extrabold text-white hover:bg-slate-800"
        >
          Clear all filters
        </button>
      ) : null}
    </div>
  );
}

export default function ComplaintList() {
  const { user } = useAuth();
  const canUpdateStatus = hasPermission(user?.role, "canEdit");

  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(
    () => readFiltersFromParams(searchParams),
    [searchParams]
  );

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.search?.trim() ||
          filters.status ||
          filters.category ||
          filters.priority
      ),
    [filters]
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => setFiltersOpen(hasActiveFilters), [hasActiveFilters]);

  const [status, setStatus] = useState("loading");
  const loading = status === "loading";
  const refreshing = status === "refreshing";

  const [complaints, setComplaints] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [pageJump, setPageJump] = useState("");

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [activeComplaint, setActiveComplaint] = useState(null);

  const requestSeq = useRef(0);

  const patchUrlFilters = useCallback(
    (patch, { resetPage = true } = {}) => {
      setSearchParams(
        (prev) => {
          const current = readFiltersFromParams(prev);

          const next = {
            ...current,
            ...patch,
            page: resetPage ? 1 : (patch.page ?? current.page), // <-- FIX
          };

          return writeFiltersToParams(next);
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const fetchComplaints = useCallback(
    async (silent = false) => {
      const seq = ++requestSeq.current;
      setStatus(silent ? "refreshing" : "loading");

      try {
        const query = {
          page: filters.page,
          limit: CONFIG.ITEMS_PER_PAGE,
          sort: filters.sort || CONFIG.DEFAULT_SORT,
          ...(filters.search?.trim() ? { search: filters.search.trim() } : {}),
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.category ? { category: filters.category } : {}),
          ...(filters.priority ? { priority: filters.priority } : {}),
        };

        const res = await ComplaintAPI.getAll(query);
        if (seq !== requestSeq.current) return;

        const { list, total, totalPages } = parseListResponse(
          res,
          CONFIG.ITEMS_PER_PAGE
        );
        setComplaints(list);
        setMeta({ total, totalPages });

        const safePage = clamp(filters.page, 1, totalPages);
        if (safePage !== filters.page) {
          patchUrlFilters({ page: safePage }, { resetPage: false });
        }
      } catch (err) {
        if (seq !== requestSeq.current) return;
        toast.error(err?.message || "Failed to load complaints");
        setComplaints([]);
        setMeta({ total: 0, totalPages: 1 });
      } finally {
        if (seq === requestSeq.current) setStatus("idle");
      }
    },
    [filters, setSearchParams]
  );

  useEffect(() => {
    fetchComplaints(false);
  }, [fetchComplaints]);

  const clearAll = useCallback(() => {
    setSearchParams(
      writeFiltersToParams({
        page: 1,
        status: "",
        category: "",
        priority: "",
        search: "",
        sort: CONFIG.DEFAULT_SORT,
      }),
      { replace: true }
    );
    setPageJump("");
    setFiltersOpen(false);
  }, [setSearchParams]);

  const changePage = useCallback(
    (nextPage) => {
      const page = clamp(nextPage, 1, meta.totalPages);
      patchUrlFilters({ page }, { resetPage: false });
      setPageJump("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [meta.totalPages, patchUrlFilters]
  );

  const jumpToPage = useCallback(() => {
    if (pageJump === "" || pageJump == null) return;

    const page = clamp(Number(pageJump), 1, meta.totalPages);
    patchUrlFilters({ page }, { resetPage: false });
    setPageJump("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pageJump, meta.totalPages, patchUrlFilters]);

  const onRefresh = useCallback(() => {
    fetchComplaints(true);
    toast.info("Refreshing", { toastId: "complaints-refresh" });
  }, [fetchComplaints]);

  const openStatusModal = useCallback((c) => {
    setActiveComplaint(c);
    setStatusModalOpen(true);
  }, []);

  const closeStatusModal = useCallback(() => {
    setStatusModalOpen(false);
    setActiveComplaint(null);
  }, []);

  const handleStatusSuccess = useCallback(
    (updated) => {
      const updatedId = getId(updated);
      if (!updatedId) {
        fetchComplaints(true);
        closeStatusModal();
        return;
      }
      setComplaints((prev) =>
        prev.map((c) =>
          String(getId(c)) === String(updatedId) ? { ...c, ...updated } : c
        )
      );
      setActiveComplaint((prev) =>
        prev && String(getId(prev)) === String(updatedId)
          ? { ...prev, ...updated }
          : prev
      );
      closeStatusModal();
    },
    [closeStatusModal, fetchComplaints]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Complaints
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {loading || refreshing
                ? "Syncing data…"
                : `Showing ${meta.total} record${meta.total === 1 ? "" : "s"}`}
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading || refreshing}
            className={cx(
              "inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.99]",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            <FiRefreshCw
              className={cx(
                "h-4 w-4",
                (loading || refreshing) && "animate-spin"
              )}
            />
            Refresh
          </button>
        </header>

        <div className="rounded-3xl border border-slate-100 bg-white p-2 shadow-sm">
          <ComplaintFilters
            value={{
              search: filters.search,
              status: filters.status,
              category: filters.category,
              priority: filters.priority,
            }}
            onChange={(next) => patchUrlFilters(next, { resetPage: true })}
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            defaultOpen={false}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : complaints.length ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {complaints.map((c) => (
                <div key={getId(c) || JSON.stringify(c)} className="space-y-3">
                  <ComplaintCard
                    complaint={c}
                    canUpdateStatus={canUpdateStatus}
                    onUpdateStatus={openStatusModal}
                  />
                </div>
              ))}
            </div>

            {meta.totalPages > 1 ? (
              <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => changePage(filters.page - 1)}
                    disabled={filters.page <= 1}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <FiChevronLeft size={18} />
                    <span className="hidden sm:inline">Prev</span>
                  </button>

                  <div className="flex items-center gap-2 px-2 text-sm font-extrabold text-slate-700">
                    <span className="text-slate-400">Page</span>
                    <span className="rounded-xl bg-slate-100 px-3 py-1 text-emerald-700">
                      {filters.page}
                    </span>
                    <span className="text-slate-400">of</span>
                    <span>{meta.totalPages}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => changePage(filters.page + 1)}
                    disabled={filters.page >= meta.totalPages}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <FiChevronRight size={18} />
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={meta.totalPages}
                    value={pageJump}
                    onChange={(e) => setPageJump(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        jumpToPage();
                      }
                    }}
                    placeholder="Go to"
                    className="w-32 rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-sm font-extrabold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={jumpToPage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-emerald-600 p-2 text-white hover:bg-emerald-700"
                    aria-label="Jump to page"
                  >
                    <FiSearch size={14} />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyState hasFilters={hasActiveFilters} onClear={clearAll} />
        )}

        {statusModalOpen && activeComplaint ? (
          <StatusUpdateModal
            complaint={activeComplaint}
            onClose={closeStatusModal}
            onSuccess={handleStatusSuccess}
          />
        ) : null}
      </div>
    </div>
  );
}
