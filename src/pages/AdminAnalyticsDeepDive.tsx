import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import AdminPage from "@/components/admin/AdminPage";
import AdminSection from "@/components/admin/AdminSection";
import SEO from "@/components/site/SEO";
import * as api from "@/lib/api";

type DeepDiveSection = "event_types" | "top_clicks" | "top_pages" | "whatsapp_pages" | "cta_performance";
type TopN = "8" | "15" | "30" | "50";

const safeNumber = (value: unknown): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const toHumanToken = (value: string): string =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const formatTopClickDisplayName = (eventName: string, label?: string | null): string => {
  const eventPart = toHumanToken(eventName);
  const labelPart = toHumanToken(label || "");
  if (!labelPart) return eventPart;
  return `${eventPart} • ${labelPart}`;
};

const getSectionFromSearch = (raw: string | null): DeepDiveSection => {
  if (raw === "event_types" || raw === "top_clicks" || raw === "top_pages" || raw === "whatsapp_pages" || raw === "cta_performance") {
    return raw;
  }
  return "top_clicks";
};

const getTopNFromSearch = (raw: string | null): TopN => {
  if (raw === "8" || raw === "15" || raw === "30" || raw === "50") return raw;
  return "15";
};

const AdminAnalyticsDeepDive = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [from, setFrom] = useState(searchParams.get("from") || new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10));
  const [to, setTo] = useState(searchParams.get("to") || new Date().toISOString().slice(0, 10));
  const [section, setSection] = useState<DeepDiveSection>(getSectionFromSearch(searchParams.get("section")));
  const [topN, setTopN] = useState<TopN>(getTopNFromSearch(searchParams.get("topN")));
  const [topPagesQuery, setTopPagesQuery] = useState(searchParams.get("topPagesQuery") || "");
  const [whatsappPagesQuery, setWhatsappPagesQuery] = useState(searchParams.get("whatsappPagesQuery") || "");
  const [eventTypesQuery, setEventTypesQuery] = useState(searchParams.get("eventTypesQuery") || "");
  const [topClicksQuery, setTopClicksQuery] = useState(searchParams.get("topClicksQuery") || "");
  const [ctaQuery, setCtaQuery] = useState(searchParams.get("ctaQuery") || "");
  const [ctaEventFilter, setCtaEventFilter] = useState(searchParams.get("ctaEventFilter") || "all");

  const [loading, setLoading] = useState(true);
  const [topClicksFull, setTopClicksFull] = useState<api.AnalyticsTopClickItem[]>([]);
  const [topEventTypesFull, setTopEventTypesFull] = useState<api.AnalyticsTopEventTypeItem[]>([]);
  const [topPagesFull, setTopPagesFull] = useState<api.AnalyticsTopPageItem[]>([]);
  const [whatsappByPageFull, setWhatsappByPageFull] = useState<api.AnalyticsWhatsappByPageItem[]>([]);
  const [ctaPerformanceFull, setCtaPerformanceFull] = useState<api.AnalyticsCtaPerformanceItem[]>([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const [
          clicks,
          eventTypes,
          pages,
          whatsappPages,
          ctaRows,
        ] = await Promise.all([
          api.fetchAnalyticsTopClicks(from, to, 100),
          api.fetchAnalyticsTopEventTypes(from, to, 100),
          api.fetchAnalyticsTopPages(from, to, 100),
          api.fetchAnalyticsWhatsappByPage(from, to, 100),
          api.fetchAnalyticsCtaPerformance(from, to, 200),
        ]);

        setTopClicksFull(Array.isArray(clicks) ? clicks : []);
        setTopEventTypesFull(Array.isArray(eventTypes) ? eventTypes : []);
        setTopPagesFull(Array.isArray(pages) ? pages : []);
        setWhatsappByPageFull(Array.isArray(whatsappPages) ? whatsappPages : []);
        setCtaPerformanceFull(Array.isArray(ctaRows) ? ctaRows : []);
      } catch {
        toast.error("Failed to load deep-dive analytics");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [from, to]);

  const topNValue = Number(topN);
  const normalizedTopPagesQuery = topPagesQuery.trim().toLowerCase();
  const normalizedWhatsappPagesQuery = whatsappPagesQuery.trim().toLowerCase();
  const normalizedEventTypesQuery = eventTypesQuery.trim().toLowerCase();
  const normalizedTopClicksQuery = topClicksQuery.trim().toLowerCase();
  const normalizedCtaQuery = ctaQuery.trim().toLowerCase();

  const topClicksChartData = useMemo(
    () =>
      topClicksFull
        .map((item) => ({
          name: formatTopClickDisplayName(item.event_name, item.label),
          rawName: `${item.event_name}${item.label ? `: ${item.label}` : ""}`.toLowerCase(),
          count: safeNumber(item.count),
        }))
        .sort((a, b) => b.count - a.count),
    [topClicksFull],
  );

  const topEventTypesChartData = useMemo(
    () =>
      topEventTypesFull
        .map((item) => ({ name: item.event_name, count: safeNumber(item.count) }))
        .sort((a, b) => b.count - a.count),
    [topEventTypesFull],
  );

  const filteredTopClicksChartData = useMemo(
    () =>
      topClicksChartData
        .filter((row) => row.rawName.includes(normalizedTopClicksQuery) || row.name.toLowerCase().includes(normalizedTopClicksQuery))
        .slice(0, topNValue),
    [topClicksChartData, normalizedTopClicksQuery, topNValue],
  );

  const filteredTopEventTypesChartData = useMemo(
    () => topEventTypesChartData.filter((row) => row.name.toLowerCase().includes(normalizedEventTypesQuery)).slice(0, topNValue),
    [topEventTypesChartData, normalizedEventTypesQuery, topNValue],
  );

  const filteredTopPages = useMemo(
    () => topPagesFull.filter((row) => (row.page || "/").toLowerCase().includes(normalizedTopPagesQuery)).slice(0, topNValue),
    [topPagesFull, normalizedTopPagesQuery, topNValue],
  );

  const filteredTopPagesChartData = useMemo(
    () => filteredTopPages.map((row) => ({ name: row.page || "/", count: safeNumber(row.views) })),
    [filteredTopPages],
  );

  const filteredWhatsappPages = useMemo(
    () =>
      whatsappByPageFull
        .filter((row) => (row.page || "(unknown)").toLowerCase().includes(normalizedWhatsappPagesQuery))
        .slice(0, topNValue),
    [whatsappByPageFull, normalizedWhatsappPagesQuery, topNValue],
  );

  const filteredWhatsappPagesChartData = useMemo(
    () => filteredWhatsappPages.map((row) => ({ name: row.page || "(unknown)", count: safeNumber(row.whatsapp_clicks) })),
    [filteredWhatsappPages],
  );

  const ctaEventOptions = useMemo(
    () => Array.from(new Set(ctaPerformanceFull.map((row) => row.event_name))).sort((a, b) => a.localeCompare(b)),
    [ctaPerformanceFull],
  );

  const filteredCtaRows = useMemo(
    () =>
      ctaPerformanceFull
        .filter((row) => {
          const matchesEvent = ctaEventFilter === "all" || row.event_name === ctaEventFilter;
          const searchable = `${row.event_name} ${row.label || ""}`.toLowerCase();
          const matchesQuery = searchable.includes(normalizedCtaQuery);
          return matchesEvent && matchesQuery;
        })
        .slice(0, topNValue),
    [ctaPerformanceFull, ctaEventFilter, normalizedCtaQuery, topNValue],
  );

  const ctaTotalClicks = ctaPerformanceFull[0]?.total_clicks || 0;

  const titleMap: Record<DeepDiveSection, string> = {
    top_clicks: "Top Click Drilldown",
    event_types: "Top Event Types",
    top_pages: "Top Pages",
    whatsapp_pages: "WhatsApp By Page",
    cta_performance: "CTA Performance",
  };

  return (
    <>
      <SEO title="Analytics Deep Dive" noindex nofollow />
      <AdminPage
        title="Analytics Deep Dive"
        description="Full-page expanded analytics view with section filters."
        maxWidthClassName="max-w-7xl"
      >
        <AdminSection
          title="View Controls"
          description="Choose section, date range, and filters for detailed analysis."
          contentClassName="p-3"
          actions={(
            <button
              type="button"
              onClick={() => navigate("/admin/analytics")}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft size={14} />
              Back to Analytics
            </button>
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            {([
              { value: "top_clicks", label: "Click Drilldown" },
              { value: "event_types", label: "Event Types" },
              { value: "top_pages", label: "Top Pages" },
              { value: "whatsapp_pages", label: "WhatsApp Pages" },
              { value: "cta_performance", label: "CTA Table" },
            ] as Array<{ value: DeepDiveSection; label: string }>).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSection(option.value)}
                className={`h-8 rounded-md px-3 text-xs font-medium transition ${
                  section === option.value
                    ? "bg-slate-900 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {option.label}
              </button>
            ))}

            <input
              type="date"
              value={from}
              max={to}
              onChange={(event) => setFrom(event.target.value)}
              className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
              aria-label="From date"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={to}
              min={from}
              onChange={(event) => setTo(event.target.value)}
              className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
              aria-label="To date"
            />

            <select
              value={topN}
              onChange={(event) => setTopN(event.target.value as TopN)}
              className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700"
            >
              <option value="8">Top 8</option>
              <option value="15">Top 15</option>
              <option value="30">Top 30</option>
              <option value="50">Top 50</option>
            </select>

            {(section === "top_pages" || section === "whatsapp_pages") && (
              <input
                type="text"
                value={section === "top_pages" ? topPagesQuery : whatsappPagesQuery}
                onChange={(event) =>
                  section === "top_pages"
                    ? setTopPagesQuery(event.target.value)
                    : setWhatsappPagesQuery(event.target.value)
                }
                placeholder="Filter page path"
                className="h-8 min-w-[220px] rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
              />
            )}

            {(section === "top_clicks" || section === "event_types") && (
              <input
                type="text"
                value={section === "top_clicks" ? topClicksQuery : eventTypesQuery}
                onChange={(event) =>
                  section === "top_clicks"
                    ? setTopClicksQuery(event.target.value)
                    : setEventTypesQuery(event.target.value)
                }
                placeholder={section === "top_clicks" ? "Filter event or label" : "Filter event name"}
                className="h-8 min-w-[220px] rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
              />
            )}

            {section === "cta_performance" && (
              <>
                <input
                  type="text"
                  value={ctaQuery}
                  onChange={(event) => setCtaQuery(event.target.value)}
                  placeholder="Filter event or label"
                  className="h-8 min-w-[220px] rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
                />
                <select
                  value={ctaEventFilter}
                  onChange={(event) => setCtaEventFilter(event.target.value)}
                  className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700"
                >
                  <option value="all">All events</option>
                  {ctaEventOptions.map((eventName) => (
                    <option key={eventName} value={eventName}>
                      {eventName}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </AdminSection>

        <AdminSection title={titleMap[section]} description="Expanded section view on a full page.">
          {section === "top_clicks" && (
            <div className="h-[72vh] min-h-[520px]">
              {!loading && filteredTopClicksChartData.length === 0 ? (
                <p className="pt-8 text-center text-sm text-slate-500">No matching click entries for this filter.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredTopClicksChartData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis type="category" dataKey="name" width={280} tick={{ fontSize: 12, fill: "#334155" }} tickFormatter={(value: string) => (value.length > 42 ? `${value.slice(0, 42)}...` : value)} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {section === "event_types" && (
            <div className="h-[72vh] min-h-[520px]">
              {!loading && filteredTopEventTypesChartData.length === 0 ? (
                <p className="pt-8 text-center text-sm text-slate-500">No matching event types for this filter.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredTopEventTypesChartData} margin={{ top: 8, right: 24, left: 8, bottom: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                    <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {section === "top_pages" && (
            <div className="space-y-3">
              <div className="h-[46vh] min-h-[340px]">
                {!loading && filteredTopPagesChartData.length === 0 ? (
                  <p className="pt-8 text-center text-sm text-slate-500">No matching pages for this filter.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredTopPagesChartData} margin={{ top: 8, right: 24, left: 8, bottom: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(value: string) => (value.length > 26 ? `${value.slice(0, 26)}...` : value)} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                      <Bar dataKey="count" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="max-h-[30vh] overflow-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5">Page</th>
                      <th className="px-3 py-2.5 text-right">Views</th>
                      <th className="px-3 py-2.5 text-right">Unique</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                    {filteredTopPages.map((row) => (
                      <tr key={`deep-page-${row.page}`}>
                        <td className="max-w-[460px] truncate px-3 py-2.5">{row.page || "/"}</td>
                        <td className="px-3 py-2.5 text-right font-medium text-slate-900">{safeNumber(row.views).toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right text-slate-600">{safeNumber(row.unique_visitors).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === "whatsapp_pages" && (
            <div className="space-y-3">
              <div className="h-[46vh] min-h-[340px]">
                {!loading && filteredWhatsappPagesChartData.length === 0 ? (
                  <p className="pt-8 text-center text-sm text-slate-500">No matching pages for this filter.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredWhatsappPagesChartData} margin={{ top: 8, right: 24, left: 8, bottom: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(value: string) => (value.length > 26 ? `${value.slice(0, 26)}...` : value)} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                      <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="max-h-[30vh] overflow-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5">Page</th>
                      <th className="px-3 py-2.5 text-right">Clicks</th>
                      <th className="px-3 py-2.5 text-right">Unique</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                    {filteredWhatsappPages.map((row) => (
                      <tr key={`deep-wa-${row.page}`}>
                        <td className="max-w-[460px] truncate px-3 py-2.5">{row.page || "(unknown)"}</td>
                        <td className="px-3 py-2.5 text-right font-medium text-slate-900">{safeNumber(row.whatsapp_clicks).toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right text-slate-600">{safeNumber(row.unique_sessions).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === "cta_performance" && (
            <div className="max-h-[72vh] overflow-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Event</th>
                    <th className="px-4 py-3">Label</th>
                    <th className="px-4 py-3 text-right">Clicks</th>
                    <th className="px-4 py-3 text-right">Unique Sessions</th>
                    <th className="px-4 py-3 text-right">Share</th>
                    <th className="px-4 py-3 text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {filteredCtaRows.map((row) => {
                    const share = ctaTotalClicks > 0 ? (safeNumber(row.clicks) / ctaTotalClicks) * 100 : 0;
                    const trend = percentageDelta(safeNumber(row.clicks), safeNumber(row.previous_clicks));
                    return (
                      <tr key={`deep-cta-${row.event_name}-${row.label}`}>
                        <td className="whitespace-nowrap px-4 py-3">{row.event_name}</td>
                        <td className="max-w-[420px] truncate px-4 py-3">{row.label || "(no label)"}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">{safeNumber(row.clicks).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{safeNumber(row.unique_sessions).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{share.toFixed(1)}%</td>
                        <td className={`px-4 py-3 text-right font-medium ${trend !== null && trend < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {formatSignedPercent(trend)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </AdminSection>
      </AdminPage>
    </>
  );
};

export default AdminAnalyticsDeepDive;
