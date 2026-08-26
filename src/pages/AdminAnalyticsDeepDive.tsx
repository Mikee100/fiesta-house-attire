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

type DeepDiveSection =
  | "event_types"
  | "top_clicks"
  | "top_pages"
  | "whatsapp_pages"
  | "cta_performance"
  | "sources"
  | "content_blog"
  | "packages"
  | "seo_queries"
  | "seo_landing_pages"
  | "seo_opportunities";
type TopN = "8" | "15" | "30" | "50";

const safeNumber = (value: unknown): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const percentageDelta = (current: number, previous: number): number | null => {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
};

const formatSignedPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "No previous-period data";
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
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
  if (
    raw === "event_types"
    || raw === "top_clicks"
    || raw === "top_pages"
    || raw === "whatsapp_pages"
    || raw === "cta_performance"
    || raw === "sources"
    || raw === "content_blog"
    || raw === "packages"
    || raw === "seo_queries"
    || raw === "seo_landing_pages"
    || raw === "seo_opportunities"
  ) {
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
  const [sourceRows, setSourceRows] = useState<api.AnalyticsSourceRow[]>([]);
  const [contentAnalytics, setContentAnalytics] = useState<api.AnalyticsContentResponse>({ blog: [], portfolio: [] });
  const [packageAnalytics, setPackageAnalytics] = useState<api.AnalyticsPackagesResponse>({
    pricing_visitors: 0,
    whatsapp_from_pricing: 0,
    package_clicks: [],
  });
  const [seoQueries, setSeoQueries] = useState<api.SeoQueryRow[]>([]);
  const [seoLandingPages, setSeoLandingPages] = useState<api.SeoLandingPageRow[]>([]);
  const [seoOpportunities, setSeoOpportunities] = useState<api.SeoOpportunityRow[]>([]);

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
          sources,
          content,
          packages,
          queryRows,
          landingPages,
          opportunities,
        ] = await Promise.all([
          api.fetchAnalyticsTopClicks(from, to, 100),
          api.fetchAnalyticsTopEventTypes(from, to, 100),
          api.fetchAnalyticsTopPages(from, to, 100),
          api.fetchAnalyticsWhatsappByPage(from, to, 100),
          api.fetchAnalyticsCtaPerformance(from, to, 200),
          api.fetchAnalyticsSources(from, to),
          api.fetchAnalyticsContent(from, to, 100),
          api.fetchAnalyticsPackages(from, to),
          api.fetchSeoQueries(from, to, { limit: 100, sort: "impressions" }),
          api.fetchSeoLandingPages(from, to, 100),
          api.fetchSeoOpportunities(from, to),
        ]);

        setTopClicksFull(Array.isArray(clicks) ? clicks : []);
        setTopEventTypesFull(Array.isArray(eventTypes) ? eventTypes : []);
        setTopPagesFull(Array.isArray(pages) ? pages : []);
        setWhatsappByPageFull(Array.isArray(whatsappPages) ? whatsappPages : []);
        setCtaPerformanceFull(Array.isArray(ctaRows) ? ctaRows : []);
        setSourceRows(Array.isArray(sources) ? sources : []);
        setContentAnalytics(content);
        setPackageAnalytics(packages);
        setSeoQueries(Array.isArray(queryRows.rows) ? queryRows.rows : []);
        setSeoLandingPages(Array.isArray(landingPages.rows) ? landingPages.rows : []);
        setSeoOpportunities(Array.isArray(opportunities.opportunities) ? opportunities.opportunities : []);
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
    sources: "Acquisition Sources",
    content_blog: "Top Blog Content",
    packages: "Package Interest",
    seo_queries: "Top Search Queries",
    seo_landing_pages: "Top Organic Landing Pages",
    seo_opportunities: "SEO Opportunities",
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
              { value: "sources", label: "Sources" },
              { value: "content_blog", label: "Blog Content" },
              { value: "packages", label: "Packages" },
              { value: "seo_queries", label: "SEO Queries" },
              { value: "seo_landing_pages", label: "SEO Landing" },
              { value: "seo_opportunities", label: "SEO Opps" },
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

          {section === "sources" && (
            <div className="max-h-[72vh] overflow-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Medium</th>
                    <th className="px-4 py-3 text-right">Visitors</th>
                    <th className="px-4 py-3 text-right">Page Views</th>
                    <th className="px-4 py-3 text-right">WhatsApp Clicks</th>
                    <th className="px-4 py-3 text-right">Conversion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {sourceRows.slice(0, topNValue).map((row) => {
                    const visitors = safeNumber(row.visitors);
                    const leads = safeNumber(row.whatsapp_sessions);
                    const conversion = visitors > 0 ? (leads / visitors) * 100 : 0;
                    return (
                      <tr key={`deep-source-${row.source}-${row.medium}`}>
                        <td className="px-4 py-3">{row.source}</td>
                        <td className="px-4 py-3">{row.medium}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">{visitors.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{safeNumber(row.page_views).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{safeNumber(row.whatsapp_clicks).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{conversion.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {section === "content_blog" && (
            <div className="max-h-[72vh] overflow-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Article</th>
                    <th className="px-4 py-3 text-right">Views</th>
                    <th className="px-4 py-3 text-right">Organic</th>
                    <th className="px-4 py-3 text-right">Unique</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {contentAnalytics.blog.slice(0, topNValue).map((row) => (
                    <tr key={`deep-blog-${row.page}`}>
                      <td className="max-w-[520px] truncate px-4 py-3">{row.page}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">{safeNumber(row.views).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{safeNumber(row.organic_visits).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{safeNumber(row.unique_visitors).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {section === "packages" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Pricing visitors</p>
                  <p className="text-lg font-semibold text-slate-900">{safeNumber(packageAnalytics.pricing_visitors).toLocaleString()}</p>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">WhatsApp from pricing</p>
                  <p className="text-lg font-semibold text-slate-900">{safeNumber(packageAnalytics.whatsapp_from_pricing).toLocaleString()}</p>
                </div>
              </div>
              <div className="max-h-[58vh] overflow-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Package</th>
                      <th className="px-4 py-3 text-right">Views</th>
                      <th className="px-4 py-3 text-right">Unique Sessions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                    {packageAnalytics.package_clicks.slice(0, topNValue).map((row) => (
                      <tr key={`deep-package-${row.package_name}`}>
                        <td className="max-w-[420px] truncate px-4 py-3">{row.package_name}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">{safeNumber(row.clicks).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{safeNumber(row.unique_sessions).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === "seo_queries" && (
            <div className="max-h-[72vh] overflow-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Query</th>
                    <th className="px-4 py-3 text-right">Clicks</th>
                    <th className="px-4 py-3 text-right">Impressions</th>
                    <th className="px-4 py-3 text-right">CTR</th>
                    <th className="px-4 py-3 text-right">Position</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {seoQueries.slice(0, topNValue).map((row) => (
                    <tr key={`deep-seo-query-${row.query}`}>
                      <td className="max-w-[520px] truncate px-4 py-3">{row.query}</td>
                      <td className="px-4 py-3 text-right">{safeNumber(row.clicks).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{safeNumber(row.impressions).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{safeNumber(row.ctr).toFixed(2)}%</td>
                      <td className="px-4 py-3 text-right">{safeNumber(row.avg_position).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {section === "seo_landing_pages" && (
            <div className="max-h-[72vh] overflow-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Page</th>
                    <th className="px-4 py-3 text-right">Organic Clicks</th>
                    <th className="px-4 py-3 text-right">Impressions</th>
                    <th className="px-4 py-3 text-right">CTR</th>
                    <th className="px-4 py-3 text-right">Position</th>
                    <th className="px-4 py-3 text-right">Visitors</th>
                    <th className="px-4 py-3 text-right">WhatsApp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {seoLandingPages.slice(0, topNValue).map((row) => (
                    <tr key={`deep-seo-page-${row.path}-${row.page}`}>
                      <td className="max-w-[420px] truncate px-4 py-3">{row.path || row.page}</td>
                      <td className="px-4 py-3 text-right">{safeNumber(row.organic_clicks).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{safeNumber(row.impressions).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{safeNumber(row.ctr).toFixed(2)}%</td>
                      <td className="px-4 py-3 text-right">{safeNumber(row.avg_position).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">{safeNumber(row.website_visitors).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{safeNumber(row.whatsapp_clicks).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {section === "seo_opportunities" && (
            <div className="max-h-[72vh] overflow-auto space-y-2 rounded-lg border border-slate-200 bg-white p-3">
              {seoOpportunities.slice(0, topNValue).map((item) => (
                <div key={`deep-seo-opp-${item.type}-${item.query}`} className="rounded-md border border-slate-200 bg-white p-2.5">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                        item.priority === "high"
                          ? "bg-rose-50 text-rose-700"
                          : item.priority === "medium"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.priority}
                    </span>
                    <p className="truncate text-sm font-medium text-slate-900">{item.query}</p>
                  </div>
                  <p className="text-xs text-slate-600">
                    Impressions: {safeNumber(item.impressions).toLocaleString()} · Clicks: {safeNumber(item.clicks).toLocaleString()} · CTR: {safeNumber(item.ctr).toFixed(2)}% · Position: {safeNumber(item.position).toFixed(1)}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">Why: {item.reason}</p>
                  <p className="mt-1 text-xs font-medium text-slate-700">Recommended action: {item.action}</p>
                </div>
              ))}
            </div>
          )}
        </AdminSection>
      </AdminPage>
    </>
  );
};

export default AdminAnalyticsDeepDive;
