import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Eye,
  Filter,
  Globe,
  HelpCircle,
  Layers,
  MessageCircle,
  Monitor,
  Package,
  RefreshCw,
  Search,
  Smartphone,
  Sparkles,
  Tablet,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminPage from "@/components/admin/AdminPage";
import SEO from "@/components/site/SEO";
import * as api from "@/lib/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

const daysAgo = (days: number): string => {
  const next = new Date();
  next.setDate(next.getDate() - days);
  return isoDate(next);
};

const safeNumber = (value: unknown): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const compactFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const formatCompact = (value: number): string => compactFormatter.format(value);

const percentageDelta = (current: number, previous: number): number | null => {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
};

const formatSignedPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "No baseline";
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
};

const formatPercent = (value: number): string => `${Math.round(value * 10) / 10}%`;

const toHumanToken = (value: string): string =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const BRANDED_QUERY_PATTERN = /\bfiesta\b|\bfiesta\s+house\b|\bfiesta\s+house\s+maternity\b/i;
const COMMERCIAL_QUERY_PATTERN = /maternity\s+photography|maternity\s+photographer|pregnancy\s+photoshoot|maternity\s+photoshoot|studio\s+photography|newborn\s+photography|family\s+photoshoot|book\s+a\s+photoshoot|pricing|packages|cost|hire|gown/i;
const INFORMATIONAL_QUERY_PATTERN = /cryptic|signs|symptoms|what\s+is|treatment|causes|weeks|trimester|water\s+breaking|water\s+broke|leaking|mastitis|dysgeusia|hidden\s+pregnancy|undetected\s+pregnancy/i;

const isBrandedQuery = (query: string): boolean => BRANDED_QUERY_PATTERN.test(query);

const seoQueryCategory = (query: string): "Branded" | "Commercial" | "Informational" | "Other" => {
  const normalized = (query || "").toLowerCase();
  if (isBrandedQuery(normalized)) return "Branded";
  if (COMMERCIAL_QUERY_PATTERN.test(normalized)) return "Commercial";
  if (INFORMATIONAL_QUERY_PATTERN.test(normalized)) return "Informational";
  return "Other";
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const AdminAnalytics = () => {
  const navigate = useNavigate();

  // Date Range Controls
  const [rangePreset, setRangePreset] = useState<"today" | "yesterday" | "7" | "30" | "90" | "this_month" | "last_month" | "custom">("30");
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(isoDate(new Date()));

  // Active chart metric toggle
  const [activeChartMetric, setActiveChartMetric] = useState<"visitors" | "organic" | "whatsapp" | "views">("visitors");

  // SEO Queries Filter & Sort
  const [seoQueryFilter, setSeoQueryFilter] = useState("");
  const [seoSort, setSeoSort] = useState<"impressions" | "clicks" | "ctr" | "position">("impressions");
  const [seoQueryLimit, setSeoQueryLimit] = useState<number>(10);

  // States
  const [loading, setLoading] = useState(true);
  const [syncingGsc, setSyncingGsc] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  // Data States
  const [businessCompare, setBusinessCompare] = useState<api.AnalyticsBusinessKpisCompare>({
    current: {
      unique_visitors: 0,
      whatsapp_leads: 0,
      portfolio_engagement: 0,
      booking_intent: 0,
      returning_visitors: 0,
      conversion_rate: 0,
    },
    previous: {
      unique_visitors: 0,
      whatsapp_leads: 0,
      portfolio_engagement: 0,
      booking_intent: 0,
      returning_visitors: 0,
      conversion_rate: 0,
    },
  });

  const [funnel, setFunnel] = useState<api.AnalyticsFunnel>({
    visitors: 0,
    portfolio_interest: 0,
    pricing_interest: 0,
    whatsapp: 0,
    booking: 0,
    checkout: 0,
  });

  const [sourceRows, setSourceRows] = useState<api.AnalyticsSourceRow[]>([]);
  const [contentAnalytics, setContentAnalytics] = useState<api.AnalyticsContentResponse>({ blog: [], portfolio: [] });
  const [packageAnalytics, setPackageAnalytics] = useState<api.AnalyticsPackagesResponse>({
    pricing_visitors: 0,
    whatsapp_from_pricing: 0,
    package_clicks: [],
  });

  const [visitsDaySeries, setVisitsDaySeries] = useState<api.AnalyticsVisitsTimeseriesItem[]>([]);
  const [pageViews, setPageViews] = useState<api.AnalyticsPageViewItem[]>([]);
  const [clickTrend, setClickTrend] = useState<api.AnalyticsClickTrendItem[]>([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState<api.AnalyticsDeviceBreakdownItem[]>([]);

  // SEO Data States
  const [seoStatus, setSeoStatus] = useState<api.SeoStatusResponse>({
    configured: false,
    site_url: null,
    last_sync: null,
    total_rows: 0,
  });

  const [seoOverview, setSeoOverview] = useState<api.SeoOverviewResponse>({
    configured: false,
    current: null,
    previous: null,
  });

  const [seoTimeseries, setSeoTimeseries] = useState<api.SeoTimeseriesRow[]>([]);
  const [seoQueries, setSeoQueries] = useState<api.SeoQueryRow[]>([]);
  const [seoLandingPages, setSeoLandingPages] = useState<api.SeoLandingPageRow[]>([]);
  const [seoOpportunities, setSeoOpportunities] = useState<api.SeoOpportunityRow[]>([]);

  // Preset Date Logic
  useEffect(() => {
    if (rangePreset === "custom") return;

    const now = new Date();
    const today = isoDate(now);
    let nextFrom = today;
    let nextTo = today;

    if (rangePreset === "today") {
      nextFrom = today;
      nextTo = today;
    } else if (rangePreset === "yesterday") {
      const yesterday = daysAgo(1);
      nextFrom = yesterday;
      nextTo = yesterday;
    } else if (rangePreset === "this_month") {
      nextFrom = isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
      nextTo = today;
    } else if (rangePreset === "last_month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      nextFrom = isoDate(start);
      nextTo = isoDate(end);
    } else {
      const days = Number(rangePreset);
      nextFrom = daysAgo(days);
      nextTo = today;
    }

    setFrom(nextFrom);
    setTo(nextTo);
  }, [rangePreset]);

  // Load All Analytics
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [
          businessComp,
          funnelData,
          sources,
          content,
          packages,
          visitsDay,
          views,
          clicks,
          devices,
          seoStat,
          seoOver,
          seoTime,
          seoQ,
          seoPages,
          seoOpps,
        ] = await Promise.all([
          api.fetchAnalyticsBusinessKpisCompare(from, to),
          api.fetchAnalyticsFunnel(from, to),
          api.fetchAnalyticsSources(from, to),
          api.fetchAnalyticsContent(from, to, 10),
          api.fetchAnalyticsPackages(from, to),
          api.fetchAnalyticsVisitsTimeseries(from, to, "day"),
          api.fetchAnalyticsPageViews(from, to),
          api.fetchAnalyticsClickTrend(from, to),
          api.fetchAnalyticsDeviceBreakdown(from, to),
          api.fetchSeoStatus(),
          api.fetchSeoOverview(from, to),
          api.fetchSeoTimeseries(from, to),
          api.fetchSeoQueries(from, to, { limit: 50, sort: seoSort, filter: seoQueryFilter }),
          api.fetchSeoLandingPages(from, to, 10),
          api.fetchSeoOpportunities(from, to),
        ]);

        setBusinessCompare(businessComp);
        setFunnel(funnelData);
        setSourceRows(Array.isArray(sources) ? sources : []);
        setContentAnalytics(content);
        setPackageAnalytics(packages);
        setVisitsDaySeries(Array.isArray(visitsDay) ? visitsDay : []);
        setPageViews(Array.isArray(views) ? views : []);
        setClickTrend(Array.isArray(clicks) ? clicks : []);
        setDeviceBreakdown(Array.isArray(devices) ? devices : []);
        setSeoStatus(seoStat);
        setSeoOverview(seoOver);
        setSeoTimeseries(Array.isArray(seoTime.rows) ? seoTime.rows : []);
        setSeoQueries(Array.isArray(seoQ.rows) ? seoQ.rows : []);
        setSeoLandingPages(Array.isArray(seoPages.rows) ? seoPages.rows : []);
        setSeoOpportunities(Array.isArray(seoOpps.opportunities) ? seoOpps.opportunities : []);
      } catch {
        toast.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    void fetchAll();
  }, [from, to, refreshTick, seoSort, seoQueryFilter]);

  // Google Search Console Sync Trigger
  const handleTriggerGscSync = async () => {
    setSyncingGsc(true);
    try {
      const res = await api.triggerSeoSync(90);
      if (res?.ok) {
        toast.success(res.message || "Google Search Console synced successfully");
        setRefreshTick((t) => t + 1);
      } else {
        toast.error(res?.error || "Search Console sync completed with warnings");
      }
    } catch {
      toast.error("Failed to trigger Search Console sync");
    } finally {
      setSyncingGsc(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Calculations & Formatting
  // ---------------------------------------------------------------------------

  const curr = businessCompare.current;
  const prev = businessCompare.previous;

  const visitorDelta = percentageDelta(safeNumber(curr.unique_visitors), safeNumber(prev.unique_visitors));
  const whatsappDelta = percentageDelta(safeNumber(curr.whatsapp_leads), safeNumber(prev.whatsapp_leads));
  const conversionDelta = percentageDelta(safeNumber(curr.conversion_rate), safeNumber(prev.conversion_rate));
  const bookingDelta = percentageDelta(safeNumber(curr.booking_intent), safeNumber(prev.booking_intent));

  const seoClicksCurr = safeNumber(seoOverview.current?.clicks);
  const seoClicksPrev = safeNumber(seoOverview.previous?.clicks);
  const seoClicksDelta = percentageDelta(seoClicksCurr, seoClicksPrev);

  const seoImprCurr = safeNumber(seoOverview.current?.impressions);
  const seoImprPrev = safeNumber(seoOverview.previous?.impressions);
  const seoImprDelta = percentageDelta(seoImprCurr, seoImprPrev);

  // Grouped Acquisition Sources
  const normalizedSources = useMemo(() => {
    const grouped = new Map<string, { label: string; visitors: number; whatsapp: number }>();

    sourceRows.forEach((r) => {
      const s = (r.source || "").toLowerCase();
      const m = (r.medium || "").toLowerCase();

      let label = "Direct / Referral";
      if (s === "google" || m === "organic") label = "Google Organic";
      else if (["instagram", "facebook", "tiktok", "whatsapp"].includes(s) || m === "social") label = "Instagram & Social";
      else if (s === "direct" || m === "none") label = "Direct";
      else if (m === "referral") label = "Referrals";

      const existing = grouped.get(label) || { label, visitors: 0, whatsapp: 0 };
      existing.visitors += safeNumber(r.visitors);
      existing.whatsapp += safeNumber(r.whatsapp_clicks);
      grouped.set(label, existing);
    });

    const list = Array.from(grouped.values()).sort((a, b) => b.visitors - a.visitors);
    return list;
  }, [sourceRows]);

  // Combined Daily Timeseries for Main Chart
  const mainChartData = useMemo(() => {
    const dateMap = new Map<string, { date: string; visitors: number; organic: number; whatsapp: number; views: number }>();

    // Seed dates from visits
    visitsDaySeries.forEach((r) => {
      dateMap.set(r.bucket, {
        date: r.bucket.slice(5),
        visitors: safeNumber(r.visits),
        organic: 0,
        whatsapp: 0,
        views: 0,
      });
    });

    // Merge page views
    pageViews.forEach((r) => {
      const entry = dateMap.get(r.day) || { date: r.day.slice(5), visitors: 0, organic: 0, whatsapp: 0, views: 0 };
      entry.views = safeNumber(r.views);
      dateMap.set(r.day, entry);
    });

    // Merge click trends for WhatsApp
    clickTrend.forEach((r) => {
      const entry = dateMap.get(r.day) || { date: r.day.slice(5), visitors: 0, organic: 0, whatsapp: 0, views: 0 };
      entry.whatsapp = safeNumber(r.clicks);
      dateMap.set(r.day, entry);
    });

    // Merge SEO organic clicks
    seoTimeseries.forEach((r) => {
      const entry = dateMap.get(r.date) || { date: r.date.slice(5), visitors: 0, organic: 0, whatsapp: 0, views: 0 };
      entry.organic = safeNumber(r.clicks);
      dateMap.set(r.date, entry);
    });

    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [visitsDaySeries, pageViews, clickTrend, seoTimeseries]);

  // Device Breakdown Totals
  const totalDeviceSessions = deviceBreakdown.reduce((sum, d) => sum + safeNumber(d.count), 0);

  return (
    <>
      <SEO title="Analytics & SEO Intelligence — Fiesta Admin" description="Business analytics, conversion tracking, and Google Search Console intelligence." />

      <AdminPage title="Analytics & SEO Intelligence" description="Real-time website performance, business conversions, and search rankings.">
        <div className="space-y-4">
          {/* ========================================================================= */}
          {/* TOP CONTROLS & FILTER BAR */}
          {/* ========================================================================= */}
          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            {/* Range Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Period:</span>
              {(
                [
                  { id: "today", label: "Today" },
                  { id: "yesterday", label: "Yesterday" },
                  { id: "7", label: "7D" },
                  { id: "30", label: "30D" },
                  { id: "90", label: "90D" },
                  { id: "this_month", label: "This Month" },
                  { id: "last_month", label: "Last Month" },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setRangePreset(preset.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    rangePreset === preset.id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Actions: Refresh + GSC Sync + Deep Dive */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {seoStatus.configured ? (
                <button
                  type="button"
                  onClick={handleTriggerGscSync}
                  disabled={syncingGsc}
                  title={seoStatus.last_sync ? `Last synced: ${new Date(seoStatus.last_sync).toLocaleString()}` : "Sync Google Search Console"}
                  className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${syncingGsc ? "animate-spin" : ""}`} />
                  <span>{syncingGsc ? "Syncing..." : "Sync Google"}</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                  <AlertCircle className="h-3 w-3" /> GSC Setup Ready
                </span>
              )}

              <button
                type="button"
                onClick={() => setRefreshTick((t) => t + 1)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/admin/analytics/deep-dive?from=${from}&to=${to}`)}
                className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-slate-800"
              >
                <span>Deep Dive</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* EXECUTIVE BUSINESS BRIEF */}
          {/* ========================================================================= */}
          <div className="rounded-lg border border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-3.5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Executive Performance Brief</h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Range: {from} to {to}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded border border-slate-200/60 bg-white p-2 text-xs">
                <p className="font-semibold text-slate-800">1. Discovery Volume</p>
                <p className="mt-0.5 text-slate-600">
                  <strong className="text-slate-900">{safeNumber(curr.unique_visitors).toLocaleString()}</strong> visitors (
                  {visitorDelta === null ? "first baseline" : `${visitorDelta >= 0 ? "up" : "down"} ${Math.abs(Math.round(visitorDelta))}% vs prior period`}).
                </p>
              </div>
              <div className="rounded border border-slate-200/60 bg-white p-2 text-xs">
                <p className="font-semibold text-emerald-800">2. Business Leads</p>
                <p className="mt-0.5 text-slate-600">
                  <strong className="text-emerald-700">{safeNumber(curr.whatsapp_leads).toLocaleString()}</strong> WhatsApp chats (
                  {whatsappDelta === null ? "first baseline" : `${whatsappDelta >= 0 ? "up" : "down"} ${Math.abs(Math.round(whatsappDelta))}%`}) at{" "}
                  <strong>{formatPercent(safeNumber(curr.conversion_rate))}</strong> conversion.
                </p>
              </div>
              <div className="rounded border border-slate-200/60 bg-white p-2 text-xs">
                <p className="font-semibold text-sky-800">3. Google Search Visibility</p>
                <p className="mt-0.5 text-slate-600">
                  {seoOverview.configured ? (
                    <>
                      <strong className="text-sky-700">{seoImprCurr.toLocaleString()}</strong> impressions,{" "}
                      <strong>{seoClicksCurr.toLocaleString()}</strong> clicks.
                    </>
                  ) : (
                    "Search Console service account ready for direct sync."
                  )}
                </p>
              </div>
              <div className="rounded border border-slate-200/60 bg-white p-2 text-xs">
                <p className="font-semibold text-purple-800">4. Primary Action</p>
                <p className="mt-0.5 truncate text-slate-600">
                  {seoOpportunities.length > 0
                    ? `Optimize "${seoOpportunities[0].query}" (position ${seoOpportunities[0].position.toFixed(1)})`
                    : "Drive traffic from Instagram & Google to packages."}
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* LEVEL 1 — TOP 6 BUSINESS HEALTH KPIS */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {/* KPI 1: Unique Visitors */}
            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Visitors</span>
                <Eye className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <p className="text-xl font-bold tracking-tight text-slate-900">{formatCompact(safeNumber(curr.unique_visitors))}</p>
                {visitorDelta !== null && (
                  <span
                    className={`inline-flex items-center text-xs font-semibold ${
                      visitorDelta >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {visitorDelta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {formatSignedPercent(visitorDelta)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Total discovery</p>
            </div>

            {/* KPI 2: WhatsApp Leads */}
            <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/30 p-3 shadow-sm">
              <div className="flex items-center justify-between text-emerald-800">
                <span className="text-[11px] font-semibold uppercase tracking-wider">WhatsApp Leads</span>
                <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <p className="text-xl font-bold tracking-tight text-emerald-900">{safeNumber(curr.whatsapp_leads).toLocaleString()}</p>
                {whatsappDelta !== null && (
                  <span
                    className={`inline-flex items-center text-xs font-semibold ${
                      whatsappDelta >= 0 ? "text-emerald-700" : "text-rose-600"
                    }`}
                  >
                    {whatsappDelta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {formatSignedPercent(whatsappDelta)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-emerald-700/80">Direct enquiries</p>
            </div>

            {/* KPI 3: Lead Conversion Rate */}
            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Conversion</span>
                <Activity className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <p className="text-xl font-bold tracking-tight text-slate-900">{formatPercent(safeNumber(curr.conversion_rate))}</p>
                {conversionDelta !== null && (
                  <span
                    className={`inline-flex items-center text-xs font-semibold ${
                      conversionDelta >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {conversionDelta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {formatSignedPercent(conversionDelta)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Visitors → Leads</p>
            </div>

            {/* KPI 4: Booking Intent */}
            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Booking Intent</span>
                <Package className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <p className="text-xl font-bold tracking-tight text-slate-900">{safeNumber(curr.booking_intent).toLocaleString()}</p>
                {bookingDelta !== null && (
                  <span
                    className={`inline-flex items-center text-xs font-semibold ${
                      bookingDelta >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {bookingDelta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {formatSignedPercent(bookingDelta)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Package checkouts</p>
            </div>

            {/* KPI 5: Google Clicks */}
            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Google Clicks</span>
                <Globe className="h-3.5 w-3.5 text-sky-500" />
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <p className="text-xl font-bold tracking-tight text-slate-900">{seoClicksCurr.toLocaleString()}</p>
                {seoClicksDelta !== null && (
                  <span
                    className={`inline-flex items-center text-xs font-semibold ${
                      seoClicksDelta >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {seoClicksDelta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {formatSignedPercent(seoClicksDelta)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Organic visits</p>
            </div>

            {/* KPI 6: Google Impressions */}
            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Impressions</span>
                <TrendingUp className="h-3.5 w-3.5 text-purple-500" />
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <p className="text-xl font-bold tracking-tight text-slate-900">{formatCompact(seoImprCurr)}</p>
                {seoImprDelta !== null && (
                  <span
                    className={`inline-flex items-center text-xs font-semibold ${
                      seoImprDelta >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {seoImprDelta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {formatSignedPercent(seoImprDelta)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">SERP appearances</p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* LEVEL 2 — MAIN TRAFFIC & CONVERSION CHART */}
          {/* ========================================================================= */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Traffic & Conversion Trends</h3>
                <p className="text-xs text-slate-500">Daily breakdown over the selected date range.</p>
              </div>

              {/* Metric Selectors */}
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                {(
                  [
                    { id: "visitors", label: "Visitors", color: "#0f172a" },
                    { id: "whatsapp", label: "WhatsApp Leads", color: "#10b981" },
                    { id: "organic", label: "Google Organic", color: "#0ea5e9" },
                    { id: "views", label: "Page Views", color: "#6366f1" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveChartMetric(tab.id)}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
                      activeChartMetric === tab.id
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[240px] w-full">
              {mainChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  No timeseries data available for this range
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mainChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={
                            activeChartMetric === "whatsapp"
                              ? "#10b981"
                              : activeChartMetric === "organic"
                                ? "#0ea5e9"
                                : activeChartMetric === "views"
                                  ? "#6366f1"
                                  : "#0f172a"
                          }
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="95%"
                          stopColor={
                            activeChartMetric === "whatsapp"
                              ? "#10b981"
                              : activeChartMetric === "organic"
                                ? "#0ea5e9"
                                : activeChartMetric === "views"
                                  ? "#6366f1"
                                  : "#0f172a"
                          }
                          stopOpacity={0.0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "none",
                        borderRadius: "6px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                      labelStyle={{ fontWeight: "bold", color: "#94a3b8" }}
                    />
                    <Area
                      type="monotone"
                      dataKey={activeChartMetric}
                      stroke={
                        activeChartMetric === "whatsapp"
                          ? "#10b981"
                          : activeChartMetric === "organic"
                            ? "#0ea5e9"
                            : activeChartMetric === "views"
                              ? "#6366f1"
                              : "#0f172a"
                      }
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#chartGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* LEVEL 3 — TWO-COLUMN BUSINESS ENGINES */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Column A: Acquisition Channels (7 cols) */}
            <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:col-span-7">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Acquisition Channels & Lead ROI</h3>
                    <p className="text-xs text-slate-500">Where clients discover Fiesta House vs conversion.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/analytics/deep-dive?section=sources&from=${from}&to=${to}`)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    View details →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                        <th className="pb-2 font-semibold">Channel</th>
                        <th className="pb-2 text-right font-semibold">Visitors</th>
                        <th className="pb-2 text-right font-semibold">WhatsApp Leads</th>
                        <th className="pb-2 text-right font-semibold">Conv. Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700">
                      {normalizedSources.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-slate-400">
                            No source data recorded yet
                          </td>
                        </tr>
                      ) : (
                        normalizedSources.map((source) => {
                          const conv = source.visitors > 0 ? (source.whatsapp / source.visitors) * 100 : 0;
                          return (
                            <tr key={source.label} className="hover:bg-slate-50/80">
                              <td className="py-2.5 font-medium text-slate-900">{source.label}</td>
                              <td className="py-2.5 text-right font-semibold">{source.visitors.toLocaleString()}</td>
                              <td className="py-2.5 text-right font-semibold text-emerald-700">{source.whatsapp.toLocaleString()}</td>
                              <td className="py-2.5 text-right">
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
                </div>
              </div>
            </div>

            {/* Column B: Conversion Funnel (5 cols) */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:col-span-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Client Conversion Funnel</h3>
                  <p className="text-xs text-slate-500">Drop-off from arrival to completed booking.</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                  {formatPercent(safeNumber(curr.conversion_rate))} total
                </span>
              </div>

              <div className="space-y-2 pt-1 text-xs">
                {/* Step 1: Visitors */}
                <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">1. Total Visitors</span>
                    <span className="font-bold text-slate-900">{safeNumber(funnel.visitors).toLocaleString()}</span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center text-[11px] text-slate-400">
                  ↓ {funnel.visitors > 0 ? `${Math.round(((safeNumber(funnel.portfolio_interest) + safeNumber(funnel.pricing_interest)) / safeNumber(funnel.visitors)) * 100)}% viewed packages` : "0%"}
                </div>

                {/* Step 2: Content/Package Interest */}
                <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">2. Viewed Packages / Portfolio</span>
                    <span className="font-bold text-slate-900">
                      {(safeNumber(funnel.portfolio_interest) + safeNumber(funnel.pricing_interest)).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center text-[11px] text-slate-400">
                  ↓ {safeNumber(funnel.portfolio_interest) + safeNumber(funnel.pricing_interest) > 0 ? `${Math.round((safeNumber(funnel.whatsapp) / (safeNumber(funnel.portfolio_interest) + safeNumber(funnel.pricing_interest))) * 100)}% started chat` : "0%"}
                </div>

                {/* Step 3: WhatsApp Contact */}
                <div className="rounded-md border border-emerald-200 bg-emerald-50/50 p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-900">3. WhatsApp Enquiries</span>
                    <span className="font-bold text-emerald-800">{safeNumber(funnel.whatsapp).toLocaleString()}</span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center text-[11px] text-slate-400">
                  ↓ {funnel.whatsapp > 0 ? `${Math.round((safeNumber(funnel.booking) / safeNumber(funnel.whatsapp)) * 100)}% booked` : "0%"}
                </div>

                {/* Step 4: Bookings / Orders */}
                <div className="rounded-md border border-purple-200 bg-purple-50/50 p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-purple-900">4. Bookings & Orders</span>
                    <span className="font-bold text-purple-800">{safeNumber(funnel.booking).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* LEVEL 4 — PACKAGES & CONTENT PERFORMANCE */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Top Packages */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Most Viewed Packages</h3>
                  <p className="text-xs text-slate-500">Package popularity and WhatsApp interest from pricing.</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/admin/analytics/deep-dive?section=packages&from=${from}&to=${to}`)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  View all →
                </button>
              </div>

              <div className="space-y-2">
                {packageAnalytics.package_clicks.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">No package view data recorded yet</p>
                ) : (
                  packageAnalytics.package_clicks.slice(0, 5).map((pkg) => (
                    <div key={pkg.package_name} className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50/50 p-2 text-xs">
                      <span className="font-medium text-slate-900">{pkg.package_name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">{safeNumber(pkg.clicks).toLocaleString()} views</span>
                        <span className="font-semibold text-emerald-700">{safeNumber(pkg.unique_sessions).toLocaleString()} unique</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Articles & Pages */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Top Content & Blog Articles</h3>
                  <p className="text-xs text-slate-500">Articles attracting organic search traffic.</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/admin/analytics/deep-dive?section=content_blog&from=${from}&to=${to}`)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  View all →
                </button>
              </div>

              <div className="space-y-2">
                {contentAnalytics.blog.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">No blog article view data recorded yet</p>
                ) : (
                  contentAnalytics.blog.slice(0, 5).map((art) => (
                    <div key={art.slug} className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50/50 p-2 text-xs">
                      <span className="max-w-[240px] truncate font-medium text-slate-900" title={art.title || art.slug}>
                        {art.title || art.slug}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">{safeNumber(art.views).toLocaleString()} views</span>
                        <span className="font-semibold text-sky-700">{safeNumber(art.organic_visits).toLocaleString()} organic</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* LEVEL 5 — GOOGLE SEARCH CONSOLE & SEO INTELLIGENCE */}
          {/* ========================================================================= */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-sky-600" />
                  <h3 className="text-sm font-bold text-slate-900">Google Search Performance & Opportunities</h3>
                </div>
                <p className="text-xs text-slate-500">Live search queries, positions, and prioritized ranking opportunities.</p>
              </div>

              <div className="flex items-center gap-2">
                {/* Search Box */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={seoQueryFilter}
                    onChange={(e) => setSeoQueryFilter(e.target.value)}
                    placeholder="Search queries..."
                    className="h-8 w-44 rounded-md border border-slate-200 bg-slate-50 pl-8 pr-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
                  />
                </div>

                {/* Sort dropdown */}
                <select
                  value={seoSort}
                  onChange={(e) => setSeoSort(e.target.value as "impressions" | "clicks" | "ctr" | "position")}
                  className="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs font-medium text-slate-700 focus:outline-none"
                >
                  <option value="impressions">Sort by Impressions</option>
                  <option value="clicks">Sort by Clicks</option>
                  <option value="ctr">Sort by CTR %</option>
                  <option value="position">Sort by Position</option>
                </select>
              </div>
            </div>

            {/* Sub-grid: Top Search Queries + SEO Opportunities */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Queries Table (7 cols) */}
              <div className="lg:col-span-7">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Top Search Queries</h4>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/analytics/deep-dive?section=seo_queries&from=${from}&to=${to}`)}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-800"
                  >
                    All queries ({seoQueries.length}) →
                  </button>
                </div>

                <div className="overflow-x-auto rounded border border-slate-100">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="p-2 font-semibold">Query</th>
                        <th className="p-2 text-right font-semibold">Clicks</th>
                        <th className="p-2 text-right font-semibold">Impr.</th>
                        <th className="p-2 text-right font-semibold">CTR</th>
                        <th className="p-2 text-right font-semibold">Pos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {seoQueries.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">
                            {seoStatus.configured
                              ? "No queries match this date range or filter"
                              : "Search Console not synced yet. Click 'Sync Google' above."}
                          </td>
                        </tr>
                      ) : (
                        seoQueries.slice(0, seoQueryLimit).map((q) => {
                          const category = seoQueryCategory(q.query);
                          return (
                            <tr key={q.query} className="hover:bg-slate-50/80">
                              <td className="p-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-slate-900">{q.query}</span>
                                  <span
                                    className={`rounded px-1 py-0.2 text-[9px] font-semibold uppercase tracking-wider ${
                                      category === "Branded"
                                        ? "bg-purple-50 text-purple-700"
                                        : category === "Commercial"
                                          ? "bg-emerald-50 text-emerald-700"
                                          : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {category}
                                  </span>
                                </div>
                              </td>
                              <td className="p-2 text-right font-semibold text-slate-900">{safeNumber(q.clicks).toLocaleString()}</td>
                              <td className="p-2 text-right text-slate-600">{safeNumber(q.impressions).toLocaleString()}</td>
                              <td className="p-2 text-right font-medium text-slate-700">{safeNumber(q.ctr).toFixed(1)}%</td>
                              <td className="p-2 text-right font-semibold text-slate-900">{safeNumber(q.avg_position).toFixed(1)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SEO Action Opportunities (5 cols) */}
              <div className="lg:col-span-5">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Prioritized SEO Actions</h4>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/analytics/deep-dive?section=seo_opportunities&from=${from}&to=${to}`)}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-800"
                  >
                    View all ({seoOpportunities.length}) →
                  </button>
                </div>

                <div className="space-y-2">
                  {seoOpportunities.length === 0 ? (
                    <div className="rounded border border-slate-100 bg-slate-50/50 p-4 text-center text-xs text-slate-400">
                      No high-priority ranking anomalies in this period.
                    </div>
                  ) : (
                    seoOpportunities.slice(0, 3).map((opp) => (
                      <div key={opp.query} className="rounded-md border border-slate-200 bg-white p-2.5 text-xs shadow-xs">
                        <div className="flex items-center justify-between">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              opp.priority === "high"
                                ? "bg-rose-100 text-rose-800"
                                : opp.priority === "medium"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {opp.priority} Priority
                          </span>
                          <span className="font-semibold text-slate-500">Pos: {opp.position.toFixed(1)}</span>
                        </div>
                        <p className="mt-1 font-semibold text-slate-900">{opp.query}</p>
                        <p className="mt-0.5 text-[11px] text-slate-600">{opp.action}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* LEVEL 6 — DEVICES & BOTTOM QUICK STATS */}
          {/* ========================================================================= */}
          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-slate-600">Device Share:</span>
              {deviceBreakdown.map((d) => {
                const count = safeNumber(d.count);
                const pct = totalDeviceSessions > 0 ? (count / totalDeviceSessions) * 100 : 0;
                return (
                  <div key={d.device_type} className="flex items-center gap-1">
                    {d.device_type === "mobile" ? (
                      <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                    ) : d.device_type === "tablet" ? (
                      <Tablet className="h-3.5 w-3.5 text-slate-400" />
                    ) : (
                      <Monitor className="h-3.5 w-3.5 text-slate-400" />
                    )}
                    <span className="capitalize text-slate-700">{d.device_type}:</span>
                    <strong className="text-slate-900">{pct.toFixed(0)}%</strong>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <span>Fiesta Admin Intelligence Engine</span>
              <span>•</span>
              <button
                type="button"
                onClick={() => navigate(`/admin/analytics/deep-dive?from=${from}&to=${to}`)}
                className="font-semibold text-slate-700 hover:text-slate-900"
              >
                Open Full Deep Dive Screen →
              </button>
            </div>
          </div>
        </div>
      </AdminPage>
    </>
  );
};

export default AdminAnalytics;