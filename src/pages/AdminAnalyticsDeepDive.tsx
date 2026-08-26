import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Download,
  ExternalLink,
  Filter,
  Globe,
  Layers,
  MessageCircle,
  Package,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
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
import SEO from "@/components/site/SEO";
import * as api from "@/lib/api";

type DeepDiveSection =
  | "sources"
  | "top_pages"
  | "event_types"
  | "whatsapp_pages"
  | "cta_performance"
  | "top_clicks"
  | "packages"
  | "content_blog"
  | "seo_queries"
  | "seo_landing_pages"
  | "seo_opportunities";

type DeepDiveCategory = "acquisition" | "conversions" | "content" | "seo";
type TopN = "15" | "30" | "50" | "100";

const CATEGORIES: Array<{
  id: DeepDiveCategory;
  label: string;
  icon: typeof Globe;
  sections: Array<{ id: DeepDiveSection; label: string; description: string }>;
}> = [
  {
    id: "acquisition",
    label: "Acquisition & Traffic",
    icon: Globe,
    sections: [
      { id: "sources", label: "Traffic Sources", description: "Where visitors originate (Google, Instagram, Direct, Referrals)" },
      { id: "top_pages", label: "Top Page Views", description: "Most visited URLs across the website" },
      { id: "event_types", label: "Event Breakdown", description: "Raw event volume by action type" },
    ],
  },
  {
    id: "conversions",
    label: "Conversions & WhatsApp",
    icon: MessageCircle,
    sections: [
      { id: "whatsapp_pages", label: "WhatsApp by Page", description: "Pages generating direct WhatsApp enquiries" },
      { id: "cta_performance", label: "CTA Performance", description: "Click rates and trends on buttons and links" },
      { id: "top_clicks", label: "Click Drilldown", description: "Granular click event names and labels" },
    ],
  },
  {
    id: "content",
    label: "Packages & Content",
    icon: Package,
    sections: [
      { id: "packages", label: "Package Interest", description: "Shop and photography packages viewed by visitors" },
      { id: "content_blog", label: "Blog Performance", description: "Articles driving discovery and organic search visits" },
    ],
  },
  {
    id: "seo",
    label: "Google & SEO Intelligence",
    icon: TrendingUp,
    sections: [
      { id: "seo_queries", label: "Search Queries", description: "Live Google search queries, impressions, CTR, and positions" },
      { id: "seo_landing_pages", label: "Organic Landing Pages", description: "Google landing pages connected to WhatsApp conversions" },
      { id: "seo_opportunities", label: "SEO Opportunities", description: "Prioritized ranking improvements and title/meta fixes" },
    ],
  },
];

const getCategoryForSection = (section: DeepDiveSection): DeepDiveCategory => {
  for (const cat of CATEGORIES) {
    if (cat.sections.some((s) => s.id === section)) return cat.id;
  }
  return "acquisition";
};

const safeNumber = (value: unknown): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const percentageDelta = (current: number, previous: number): number | null => {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
};

const formatSignedPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "New";
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
  const allSections: DeepDiveSection[] = [
    "sources",
    "top_pages",
    "event_types",
    "whatsapp_pages",
    "cta_performance",
    "top_clicks",
    "packages",
    "content_blog",
    "seo_queries",
    "seo_landing_pages",
    "seo_opportunities",
  ];
  if (raw && allSections.includes(raw as DeepDiveSection)) {
    return raw as DeepDiveSection;
  }
  return "sources";
};

const getTopNFromSearch = (raw: string | null): TopN => {
  if (raw === "15" || raw === "30" || raw === "50" || raw === "100") return raw;
  return "30";
};

const AdminAnalyticsDeepDive = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [from, setFrom] = useState(searchParams.get("from") || new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10));
  const [to, setTo] = useState(searchParams.get("to") || new Date().toISOString().slice(0, 10));
  const [section, setSection] = useState<DeepDiveSection>(getSectionFromSearch(searchParams.get("section")));
  const [topN, setTopN] = useState<TopN>(getTopNFromSearch(searchParams.get("topN")));
  const [searchFilter, setSearchFilter] = useState(searchParams.get("search") || "");
  const [ctaEventFilter, setCtaEventFilter] = useState(searchParams.get("ctaEventFilter") || "all");

  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  // Data Stores
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

  const activeCategory = useMemo(() => getCategoryForSection(section), [section]);

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
  }, [from, to, refreshTick]);

  const topNValue = Number(topN);
  const normalizedQuery = searchFilter.trim().toLowerCase();

  // Filtered views
  const filteredSources = useMemo(
    () =>
      sourceRows
        .filter((r) => `${r.source} ${r.medium}`.toLowerCase().includes(normalizedQuery))
        .slice(0, topNValue),
    [sourceRows, normalizedQuery, topNValue]
  );

  const filteredTopPages = useMemo(
    () =>
      topPagesFull
        .filter((r) => (r.page || "/").toLowerCase().includes(normalizedQuery))
        .slice(0, topNValue),
    [topPagesFull, normalizedQuery, topNValue]
  );

  const filteredWhatsappPages = useMemo(
    () =>
      whatsappByPageFull
        .filter((r) => (r.page || "(unknown)").toLowerCase().includes(normalizedQuery))
        .slice(0, topNValue),
    [whatsappByPageFull, normalizedQuery, topNValue]
  );

  const ctaEventOptions = useMemo(
    () => Array.from(new Set(ctaPerformanceFull.map((row) => row.event_name))).sort((a, b) => a.localeCompare(b)),
    [ctaPerformanceFull]
  );

  const filteredCtaRows = useMemo(
    () =>
      ctaPerformanceFull
        .filter((row) => {
          const matchesEvent = ctaEventFilter === "all" || row.event_name === ctaEventFilter;
          const searchable = `${row.event_name} ${row.label || ""}`.toLowerCase();
          const matchesQuery = searchable.includes(normalizedQuery);
          return matchesEvent && matchesQuery;
        })
        .slice(0, topNValue),
    [ctaPerformanceFull, ctaEventFilter, normalizedQuery, topNValue]
  );

  const filteredPackages = useMemo(
    () =>
      packageAnalytics.package_clicks
        .filter((p) => p.package_name.toLowerCase().includes(normalizedQuery))
        .slice(0, topNValue),
    [packageAnalytics, normalizedQuery, topNValue]
  );

  const filteredBlog = useMemo(
    () =>
      contentAnalytics.blog
        .filter((b) => (b.page || "").toLowerCase().includes(normalizedQuery))
        .slice(0, topNValue),
    [contentAnalytics, normalizedQuery, topNValue]
  );

  const filteredSeoQueries = useMemo(
    () =>
      seoQueries
        .filter((q) => q.query.toLowerCase().includes(normalizedQuery))
        .slice(0, topNValue),
    [seoQueries, normalizedQuery, topNValue]
  );

  const filteredSeoLandingPages = useMemo(
    () =>
      seoLandingPages
        .filter((p) => `${p.path} ${p.page}`.toLowerCase().includes(normalizedQuery))
        .slice(0, topNValue),
    [seoLandingPages, normalizedQuery, topNValue]
  );

  const filteredSeoOpportunities = useMemo(
    () =>
      seoOpportunities
        .filter((o) => `${o.query} ${o.reason} ${o.action}`.toLowerCase().includes(normalizedQuery))
        .slice(0, topNValue),
    [seoOpportunities, normalizedQuery, topNValue]
  );

  const filteredTopClicks = useMemo(
    () =>
      topClicksFull
        .map((item) => ({
          name: formatTopClickDisplayName(item.event_name, item.label),
          raw: `${item.event_name} ${item.label || ""}`.toLowerCase(),
          count: safeNumber(item.count),
          sessions: safeNumber(item.unique_sessions),
        }))
        .filter((item) => item.raw.includes(normalizedQuery) || item.name.toLowerCase().includes(normalizedQuery))
        .sort((a, b) => b.count - a.count)
        .slice(0, topNValue),
    [topClicksFull, normalizedQuery, topNValue]
  );

  const filteredEventTypes = useMemo(
    () =>
      topEventTypesFull
        .map((item) => ({
          name: item.event_name,
          count: safeNumber(item.count),
          sessions: safeNumber(item.unique_sessions),
        }))
        .filter((item) => item.name.toLowerCase().includes(normalizedQuery))
        .sort((a, b) => b.count - a.count)
        .slice(0, topNValue),
    [topEventTypesFull, normalizedQuery, topNValue]
  );

  const ctaTotalClicks = ctaPerformanceFull[0]?.total_clicks || 0;

  return (
    <>
      <SEO title="Analytics Deep Dive — Fiesta Admin" noindex nofollow />

      <AdminPage title="Analytics Deep Dive" description="Granular drilldowns, historical filters, and search query breakdowns.">
        <div className="space-y-4">
          {/* ========================================================================= */}
          {/* TOP TOOLBAR: Back button + Presets + Row Limit + Global Search */}
          {/* ========================================================================= */}
          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between">
            {/* Left: Back + Category Pill */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(`/admin/analytics?from=${from}&to=${to}`)}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Analytics Dashboard</span>
              </button>

              <span className="text-slate-300">/</span>

              <div className="flex items-center gap-1 text-xs text-slate-500">
                <span className="font-semibold text-slate-900">
                  {CATEGORIES.find((c) => c.id === activeCategory)?.label}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium text-slate-700">
                  {CATEGORIES.flatMap((c) => c.sections).find((s) => s.id === section)?.label}
                </span>
              </div>
            </div>

            {/* Right: Date Range + Top Rows + Search Box */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Date Inputs */}
              <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <input
                  type="date"
                  value={from}
                  max={to}
                  onChange={(e) => setFrom(e.target.value)}
                  className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={to}
                  min={from}
                  onChange={(e) => setTo(e.target.value)}
                  className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none"
                />
              </div>

              {/* Top N Rows */}
              <select
                value={topN}
                onChange={(e) => setTopN(e.target.value as TopN)}
                className="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs font-medium text-slate-700 focus:outline-none"
              >
                <option value="15">Top 15</option>
                <option value="30">Top 30</option>
                <option value="50">Top 50</option>
                <option value="100">Top 100</option>
              </select>

              {/* Live Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search current table..."
                  className="h-8 w-44 rounded-md border border-slate-200 bg-slate-50 pl-8 pr-7 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none sm:w-56"
                />
                {searchFilter && (
                  <button
                    type="button"
                    onClick={() => setSearchFilter("")}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Refresh */}
              <button
                type="button"
                onClick={() => setRefreshTick((t) => t + 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                title="Refresh data"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CATEGORY & SECTION TABS (Clean 2-tier Navigation) */}
          {/* ========================================================================= */}
          <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
            {/* Level 1: Categories */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isCatActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSection(cat.sections[0].id)}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      isCatActive
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Level 2: Specific Sub-views */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              {CATEGORIES.find((c) => c.id === activeCategory)?.sections.map((sub) => {
                const isSubActive = section === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSection(sub.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      isSubActive
                        ? "bg-slate-100 font-bold text-slate-900 ring-1 ring-slate-300"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    {sub.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MAIN DATA VIEW CONTAINER */}
          {/* ========================================================================= */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {CATEGORIES.flatMap((c) => c.sections).find((s) => s.id === section)?.label}
                </h3>
                <p className="text-xs text-slate-500">
                  {CATEGORIES.flatMap((c) => c.sections).find((s) => s.id === section)?.description}
                </p>
              </div>

              {section === "cta_performance" && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Filter Event:</span>
                  <select
                    value={ctaEventFilter}
                    onChange={(e) => setCtaEventFilter(e.target.value)}
                    className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none"
                  >
                    <option value="all">All Events</option>
                    {ctaEventOptions.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Content Table */}
            <div className="overflow-x-auto p-2">
              {/* 1. SOURCES */}
              {section === "sources" && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="p-2.5 font-semibold">Source</th>
                      <th className="p-2.5 font-semibold">Medium</th>
                      <th className="p-2.5 text-right font-semibold">Visitors</th>
                      <th className="p-2.5 text-right font-semibold">Page Views</th>
                      <th className="p-2.5 text-right font-semibold">WhatsApp Clicks</th>
                      <th className="p-2.5 text-right font-semibold">Lead Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredSources.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No source entries match your filter
                        </td>
                      </tr>
                    ) : (
                      filteredSources.map((r) => {
                        const visitors = safeNumber(r.visitors);
                        const leads = safeNumber(r.whatsapp_sessions);
                        const conv = visitors > 0 ? (leads / visitors) * 100 : 0;
                        return (
                          <tr key={`${r.source}-${r.medium}`} className="hover:bg-slate-50/80">
                            <td className="p-2.5 font-medium text-slate-900">{r.source}</td>
                            <td className="p-2.5 text-slate-500">{r.medium}</td>
                            <td className="p-2.5 text-right font-semibold text-slate-900">{visitors.toLocaleString()}</td>
                            <td className="p-2.5 text-right text-slate-600">{safeNumber(r.page_views).toLocaleString()}</td>
                            <td className="p-2.5 text-right font-semibold text-emerald-700">
                              {safeNumber(r.whatsapp_clicks).toLocaleString()}
                            </td>
                            <td className="p-2.5 text-right">
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-800">
                                {conv.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}

              {/* 2. TOP PAGES */}
              {section === "top_pages" && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="p-2.5 font-semibold">Page Path</th>
                      <th className="p-2.5 text-right font-semibold">Total Page Views</th>
                      <th className="p-2.5 text-right font-semibold">Unique Visitors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredTopPages.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-400">
                          No page entries match your filter
                        </td>
                      </tr>
                    ) : (
                      filteredTopPages.map((r) => (
                        <tr key={r.page} className="hover:bg-slate-50/80">
                          <td className="p-2.5 font-medium text-slate-900">{r.page || "/"}</td>
                          <td className="p-2.5 text-right font-semibold text-slate-900">{safeNumber(r.views).toLocaleString()}</td>
                          <td className="p-2.5 text-right text-slate-600">{safeNumber(r.unique_visitors).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* 3. EVENT TYPES */}
              {section === "event_types" && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="p-2.5 font-semibold">Event Name</th>
                      <th className="p-2.5 text-right font-semibold">Total Events</th>
                      <th className="p-2.5 text-right font-semibold">Unique Sessions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredEventTypes.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-400">
                          No events match your filter
                        </td>
                      </tr>
                    ) : (
                      filteredEventTypes.map((r) => (
                        <tr key={r.name} className="hover:bg-slate-50/80">
                          <td className="p-2.5 font-medium text-slate-900">{r.name}</td>
                          <td className="p-2.5 text-right font-semibold text-slate-900">{r.count.toLocaleString()}</td>
                          <td className="p-2.5 text-right text-slate-600">{r.sessions.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* 4. WHATSAPP PAGES */}
              {section === "whatsapp_pages" && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="p-2.5 font-semibold">Page Origin</th>
                      <th className="p-2.5 text-right font-semibold">WhatsApp Clicks</th>
                      <th className="p-2.5 text-right font-semibold">Unique Sessions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredWhatsappPages.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-400">
                          No WhatsApp clicks match your filter
                        </td>
                      </tr>
                    ) : (
                      filteredWhatsappPages.map((r) => (
                        <tr key={r.page} className="hover:bg-slate-50/80">
                          <td className="p-2.5 font-medium text-slate-900">{r.page || "(unknown)"}</td>
                          <td className="p-2.5 text-right font-semibold text-emerald-700">
                            {safeNumber(r.whatsapp_clicks).toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right text-slate-600">{safeNumber(r.unique_sessions).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* 5. CTA PERFORMANCE */}
              {section === "cta_performance" && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="p-2.5 font-semibold">Event</th>
                      <th className="p-2.5 font-semibold">Label / Location</th>
                      <th className="p-2.5 text-right font-semibold">Clicks</th>
                      <th className="p-2.5 text-right font-semibold">Sessions</th>
                      <th className="p-2.5 text-right font-semibold">Share</th>
                      <th className="p-2.5 text-right font-semibold">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredCtaRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No CTA entries match your filter
                        </td>
                      </tr>
                    ) : (
                      filteredCtaRows.map((r) => {
                        const clicks = safeNumber(r.clicks);
                        const share = ctaTotalClicks > 0 ? (clicks / ctaTotalClicks) * 100 : 0;
                        const trend = percentageDelta(clicks, safeNumber(r.previous_clicks));
                        return (
                          <tr key={`${r.event_name}-${r.label}`} className="hover:bg-slate-50/80">
                            <td className="p-2.5 font-medium text-slate-900">{r.event_name}</td>
                            <td className="p-2.5 text-slate-600">{r.label || "(no label)"}</td>
                            <td className="p-2.5 text-right font-semibold text-slate-900">{clicks.toLocaleString()}</td>
                            <td className="p-2.5 text-right text-slate-600">{safeNumber(r.unique_sessions).toLocaleString()}</td>
                            <td className="p-2.5 text-right text-slate-600">{share.toFixed(1)}%</td>
                            <td
                              className={`p-2.5 text-right font-semibold ${
                                trend !== null && trend < 0 ? "text-rose-600" : "text-emerald-600"
                              }`}
                            >
                              {formatSignedPercent(trend)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}

              {/* 6. TOP CLICKS */}
              {section === "top_clicks" && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="p-2.5 font-semibold">Action & Label</th>
                      <th className="p-2.5 text-right font-semibold">Click Volume</th>
                      <th className="p-2.5 text-right font-semibold">Unique Sessions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredTopClicks.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-400">
                          No click actions match your filter
                        </td>
                      </tr>
                    ) : (
                      filteredTopClicks.map((r) => (
                        <tr key={r.name} className="hover:bg-slate-50/80">
                          <td className="p-2.5 font-medium text-slate-900">{r.name}</td>
                          <td className="p-2.5 text-right font-semibold text-slate-900">{r.count.toLocaleString()}</td>
                          <td className="p-2.5 text-right text-slate-600">{r.sessions.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* 7. PACKAGES */}
              {section === "packages" && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="p-2.5 font-semibold">Package Name</th>
                      <th className="p-2.5 text-right font-semibold">Views</th>
                      <th className="p-2.5 text-right font-semibold">Unique Sessions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredPackages.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-400">
                          No package view entries recorded
                        </td>
                      </tr>
                    ) : (
                      filteredPackages.map((r) => (
                        <tr key={r.package_name} className="hover:bg-slate-50/80">
                          <td className="p-2.5 font-medium text-slate-900">{r.package_name}</td>
                          <td className="p-2.5 text-right font-semibold text-slate-900">{safeNumber(r.clicks).toLocaleString()}</td>
                          <td className="p-2.5 text-right text-slate-600">{safeNumber(r.unique_sessions).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* 8. BLOG CONTENT */}
              {section === "content_blog" && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="p-2.5 font-semibold">Article Path / Slug</th>
                      <th className="p-2.5 text-right font-semibold">Total Views</th>
                      <th className="p-2.5 text-right font-semibold">Organic Visits</th>
                      <th className="p-2.5 text-right font-semibold">Unique Visitors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredBlog.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          No blog entries match your filter
                        </td>
                      </tr>
                    ) : (
                      filteredBlog.map((r) => (
                        <tr key={r.page} className="hover:bg-slate-50/80">
                          <td className="p-2.5 font-medium text-slate-900">{r.page}</td>
                          <td className="p-2.5 text-right font-semibold text-slate-900">{safeNumber(r.views).toLocaleString()}</td>
                          <td className="p-2.5 text-right font-semibold text-sky-700">
                            {safeNumber(r.organic_visits).toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right text-slate-600">{safeNumber(r.unique_visitors).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* 9. SEO QUERIES */}
              {section === "seo_queries" && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="p-2.5 font-semibold">Search Query</th>
                      <th className="p-2.5 text-right font-semibold">Clicks</th>
                      <th className="p-2.5 text-right font-semibold">Impressions</th>
                      <th className="p-2.5 text-right font-semibold">CTR %</th>
                      <th className="p-2.5 text-right font-semibold">Avg Position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredSeoQueries.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No search queries match your filter
                        </td>
                      </tr>
                    ) : (
                      filteredSeoQueries.map((r) => (
                        <tr key={r.query} className="hover:bg-slate-50/80">
                          <td className="p-2.5 font-medium text-slate-900">{r.query}</td>
                          <td className="p-2.5 text-right font-semibold text-slate-900">{safeNumber(r.clicks).toLocaleString()}</td>
                          <td className="p-2.5 text-right text-slate-600">{safeNumber(r.impressions).toLocaleString()}</td>
                          <td className="p-2.5 text-right font-medium text-slate-700">{safeNumber(r.ctr).toFixed(2)}%</td>
                          <td className="p-2.5 text-right font-semibold text-slate-900">{safeNumber(r.avg_position).toFixed(1)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* 10. SEO LANDING PAGES */}
              {section === "seo_landing_pages" && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="p-2.5 font-semibold">Landing Page URL</th>
                      <th className="p-2.5 text-right font-semibold">Organic Clicks</th>
                      <th className="p-2.5 text-right font-semibold">Impressions</th>
                      <th className="p-2.5 text-right font-semibold">CTR</th>
                      <th className="p-2.5 text-right font-semibold">Pos</th>
                      <th className="p-2.5 text-right font-semibold">Site Visitors</th>
                      <th className="p-2.5 text-right font-semibold">WhatsApp Leads</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredSeoLandingPages.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No landing pages match your filter
                        </td>
                      </tr>
                    ) : (
                      filteredSeoLandingPages.map((r) => (
                        <tr key={`${r.path}-${r.page}`} className="hover:bg-slate-50/80">
                          <td className="p-2.5 font-medium text-slate-900">{r.path || r.page}</td>
                          <td className="p-2.5 text-right font-semibold text-slate-900">
                            {safeNumber(r.organic_clicks).toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right text-slate-600">{safeNumber(r.impressions).toLocaleString()}</td>
                          <td className="p-2.5 text-right text-slate-700">{safeNumber(r.ctr).toFixed(1)}%</td>
                          <td className="p-2.5 text-right font-semibold text-slate-900">{safeNumber(r.avg_position).toFixed(1)}</td>
                          <td className="p-2.5 text-right text-slate-600">{safeNumber(r.website_visitors).toLocaleString()}</td>
                          <td className="p-2.5 text-right font-semibold text-emerald-700">
                            {safeNumber(r.whatsapp_clicks).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* 11. SEO OPPORTUNITIES */}
              {section === "seo_opportunities" && (
                <div className="space-y-2 p-2">
                  {filteredSeoOpportunities.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">No SEO opportunities found for this query.</div>
                  ) : (
                    filteredSeoOpportunities.map((item) => (
                      <div key={item.query} className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                item.priority === "high"
                                  ? "bg-rose-100 text-rose-800"
                                  : item.priority === "medium"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {item.priority} Priority
                            </span>
                            <span className="font-bold text-slate-900">{item.query}</span>
                          </div>
                          <span className="font-semibold text-slate-500">Avg Pos: {item.position.toFixed(1)}</span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-4 text-slate-600">
                          <span>
                            Impressions: <strong>{safeNumber(item.impressions).toLocaleString()}</strong>
                          </span>
                          <span>
                            Clicks: <strong>{safeNumber(item.clicks).toLocaleString()}</strong>
                          </span>
                          <span>
                            CTR: <strong>{safeNumber(item.ctr).toFixed(2)}%</strong>
                          </span>
                        </div>

                        <p className="mt-1.5 text-slate-600">
                          <strong className="text-slate-700">Diagnosis:</strong> {item.reason}
                        </p>
                        <p className="mt-0.5 font-medium text-emerald-800">
                          <strong>Recommended Action:</strong> {item.action}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminPage>
    </>
  );
};

export default AdminAnalyticsDeepDive;
