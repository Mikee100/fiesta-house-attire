import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
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
  ArrowUpRight,
  ChevronRight,
  Eye,
  Globe,
  MessageCircle,
  Monitor,
  Package,
  RefreshCw,
  Search,
  Smartphone,
  Sparkles,
  Tablet,
  TrendingUp,
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
  if (value === null || value === undefined || !Number.isFinite(value)) return "baseline";
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
};

const formatPercent = (value: number): string => `${Math.round(value * 10) / 10}%`;

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
  const [rangePreset, setRangePreset] = useState<"today" | "yesterday" | "7" | "30" | "90" | "this_month" | "last_month">("30");
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(isoDate(new Date()));

  // Chart Metric Toggle
  const [activeChartMetric, setActiveChartMetric] = useState<"visitors" | "whatsapp" | "organic" | "views">("visitors");

  // SEO Queries Filter & Sort
  const [seoQueryFilter, setSeoQueryFilter] = useState("");
  const [seoSort, setSeoSort] = useState<"impressions" | "clicks" | "ctr" | "position">("impressions");

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
  const [seoOpportunities, setSeoOpportunities] = useState<api.SeoOpportunityRow[]>([]);

  // Preset Date Logic
  useEffect(() => {
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
          seoOpps,
        ] = await Promise.all([
          api.fetchAnalyticsBusinessKpisCompare(from, to),
          api.fetchAnalyticsFunnel(from, to),
          api.fetchAnalyticsSources(from, to),
          api.fetchAnalyticsContent(from, to, 8),
          api.fetchAnalyticsPackages(from, to),
          api.fetchAnalyticsVisitsTimeseries(from, to, "day"),
          api.fetchAnalyticsPageViews(from, to),
          api.fetchAnalyticsClickTrend(from, to),
          api.fetchAnalyticsDeviceBreakdown(from, to),
          api.fetchSeoStatus(),
          api.fetchSeoOverview(from, to),
          api.fetchSeoTimeseries(from, to),
          api.fetchSeoQueries(from, to, { limit: 50, sort: seoSort, filter: seoQueryFilter }),
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
  // Calculations
  // ---------------------------------------------------------------------------

  const curr = businessCompare.current;
  const prev = businessCompare.previous;

  const visitorDelta = percentageDelta(safeNumber(curr.unique_visitors), safeNumber(prev.unique_visitors));
  const whatsappDelta = percentageDelta(safeNumber(curr.whatsapp_leads), safeNumber(prev.whatsapp_leads));
  const conversionDelta = percentageDelta(safeNumber(curr.conversion_rate), safeNumber(prev.conversion_rate));

  const seoClicksCurr = safeNumber(seoOverview.current?.clicks);
  const seoImprCurr = safeNumber(seoOverview.current?.impressions);
  const seoAvgPos = safeNumber(seoOverview.current?.avg_position);

  // Grouped Acquisition Sources
  const normalizedSources = useMemo(() => {
    const grouped = new Map<string, { label: string; visitors: number; whatsapp: number }>();

    sourceRows.forEach((r) => {
      const s = (r.source || "").toLowerCase();
      const m = (r.medium || "").toLowerCase();

      let label = "Direct";
      if (s === "google" || m === "organic") label = "Google Search";
      else if (["instagram", "facebook", "tiktok", "whatsapp"].includes(s) || m === "social") label = "Instagram & Social";
      else if (m === "referral") label = "Referrals";

      const existing = grouped.get(label) || { label, visitors: 0, whatsapp: 0 };
      existing.visitors += safeNumber(r.visitors);
      existing.whatsapp += safeNumber(r.whatsapp_clicks);
      grouped.set(label, existing);
    });

    return Array.from(grouped.values()).sort((a, b) => b.visitors - a.visitors);
  }, [sourceRows]);

  // Combined Daily Timeseries for Main Chart
  const mainChartData = useMemo(() => {
    const dateMap = new Map<string, { date: string; visitors: number; organic: number; whatsapp: number; views: number }>();

    visitsDaySeries.forEach((r) => {
      dateMap.set(r.bucket, {
        date: r.bucket.slice(5),
        visitors: safeNumber(r.visits),
        organic: 0,
        whatsapp: 0,
        views: 0,
      });
    });

    pageViews.forEach((r) => {
      const entry = dateMap.get(r.day) || { date: r.day.slice(5), visitors: 0, organic: 0, whatsapp: 0, views: 0 };
      entry.views = safeNumber(r.views);
      dateMap.set(r.day, entry);
    });

    clickTrend.forEach((r) => {
      const entry = dateMap.get(r.day) || { date: r.day.slice(5), visitors: 0, organic: 0, whatsapp: 0, views: 0 };
      entry.whatsapp = safeNumber(r.clicks);
      dateMap.set(r.day, entry);
    });

    seoTimeseries.forEach((r) => {
      const entry = dateMap.get(r.date) || { date: r.date.slice(5), visitors: 0, organic: 0, whatsapp: 0, views: 0 };
      entry.organic = safeNumber(r.clicks);
      dateMap.set(r.date, entry);
    });

    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [visitsDaySeries, pageViews, clickTrend, seoTimeseries]);

  const totalDeviceSessions = deviceBreakdown.reduce((sum, d) => sum + safeNumber(d.count), 0);

  return (
    <>
      <SEO title="Analytics & SEO — Fiesta Admin" description="Business analytics, conversion tracking, and Google Search performance." />

      <AdminPage title="Analytics & SEO Intelligence" description="Live client discovery, WhatsApp enquiries, and search rankings.">
        <div className="space-y-4">
          {/* ========================================================================= */}
          {/* 1. TOP TOOLBAR: Date Preset Selector + GSC Sync + Deep Dive Link */}
          {/* ========================================================================= */}
          <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-2.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            {/* Presets */}
            <div className="flex flex-wrap items-center gap-1">
              <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Timeframe:</span>
              {(
                [
                  { id: "today", label: "Today" },
                  { id: "yesterday", label: "Yesterday" },
                  { id: "7", label: "7 Days" },
                  { id: "30", label: "30 Days" },
                  { id: "90", label: "90 Days" },
                  { id: "this_month", label: "This Month" },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setRangePreset(preset.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    rangePreset === preset.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {seoStatus.configured ? (
                <button
                  type="button"
                  onClick={handleTriggerGscSync}
                  disabled={syncingGsc}
                  title={seoStatus.last_sync ? `Last synced: ${new Date(seoStatus.last_sync).toLocaleString()}` : "Sync Search Console"}
                  className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
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
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                title="Refresh numbers"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              </button>

              <button
                type="button"
                onClick={() => navigate(`/admin/analytics/deep-dive?from=${from}&to=${to}`)}
                className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-slate-800"
              >
                <span>Deep Dive</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. UNIFIED 4-CARD HERO METRICS (Clean, High-Density, No Duplicate Cards) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {/* 1. Visitors */}
            <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Visitors</span>
                <Eye className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <p className="text-2xl font-extrabold text-slate-900">{safeNumber(curr.unique_visitors).toLocaleString()}</p>
                {visitorDelta !== null && (
                  <span
                    className={`inline-flex items-center text-xs font-bold ${
                      visitorDelta >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {visitorDelta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {formatSignedPercent(visitorDelta)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Total website traffic</p>
            </div>

            {/* 2. WhatsApp Leads */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-emerald-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">WhatsApp Leads</span>
                <MessageCircle className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <p className="text-2xl font-extrabold text-emerald-950">{safeNumber(curr.whatsapp_leads).toLocaleString()}</p>
                {whatsappDelta !== null && (
                  <span
                    className={`inline-flex items-center text-xs font-bold ${
                      whatsappDelta >= 0 ? "text-emerald-700" : "text-rose-600"
                    }`}
                  >
                    {whatsappDelta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {formatSignedPercent(whatsappDelta)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-emerald-700">Direct booking enquiries</p>
            </div>

            {/* 3. Conversion Rate */}
            <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Lead Conversion</span>
                <Activity className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <p className="text-2xl font-extrabold text-slate-900">{formatPercent(safeNumber(curr.conversion_rate))}</p>
                {conversionDelta !== null && (
                  <span
                    className={`inline-flex items-center text-xs font-bold ${
                      conversionDelta >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {conversionDelta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {formatSignedPercent(conversionDelta)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Visitors reaching out</p>
            </div>

            {/* 4. Google Search Visibility */}
            <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Google Search</span>
                <Globe className="h-4 w-4 text-sky-500" />
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <p className="text-2xl font-extrabold text-slate-900">
                  {seoImprCurr.toLocaleString()}{" "}
                  <span className="text-xs font-normal text-slate-500">impr</span>
                </p>
                <span className="text-xs font-bold text-sky-700">{seoClicksCurr.toLocaleString()} clicks</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {seoAvgPos > 0 ? `Avg search position: ${seoAvgPos.toFixed(1)}` : "SERP visibility"}
              </p>
            </div>
          </div>

          {/* Compact 1-Line Key Takeaway */}
          <div className="flex items-center gap-2 rounded-md border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            <p className="truncate">
              <strong>Business takeaway:</strong> {formatPercent(safeNumber(curr.conversion_rate))} of your visitors initiated a WhatsApp chat this period.{" "}
              {seoOpportunities.length > 0 && (
                <span>
                  Top search target: <strong className="text-slate-900">"{seoOpportunities[0].query}"</strong> (ranking position {seoOpportunities[0].position.toFixed(1)}).
                </span>
              )}
            </p>
          </div>

          {/* ========================================================================= */}
          {/* 3. TREND CHART */}
          {/* ========================================================================= */}
          <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs">
            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Traffic & Discovery Trends</h3>
              </div>

              {/* Metric Selectors */}
              <div className="flex items-center gap-1 rounded border border-slate-200 bg-slate-50 p-0.5">
                {(
                  [
                    { id: "visitors", label: "Visitors", color: "#0f172a" },
                    { id: "whatsapp", label: "WhatsApp", color: "#10b981" },
                    { id: "organic", label: "Google Clicks", color: "#0ea5e9" },
                    { id: "views", label: "Page Views", color: "#6366f1" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveChartMetric(tab.id)}
                    className={`rounded px-2.5 py-0.5 text-xs font-semibold transition-all ${
                      activeChartMetric === tab.id
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[210px] w-full">
              {mainChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  No trend data available for this timeframe
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mainChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
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
                        backgroundColor: "#0f172a",
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
                      fill="url(#trendGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. TWO-COLUMN BUSINESS ENGINE: ACQUISITION + CONVERSION FUNNEL */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Acquisition Sources (7 cols) */}
            <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs lg:col-span-7">
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Acquisition Channels & Leads</h3>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/analytics/deep-dive?section=sources&from=${from}&to=${to}`)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    View details →
                  </button>
                </div>

                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="pb-2 font-semibold">Channel</th>
                      <th className="pb-2 text-right font-semibold">Visitors</th>
                      <th className="pb-2 text-right font-semibold">WhatsApp Leads</th>
                      <th className="pb-2 text-right font-semibold">Conv. %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {normalizedSources.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400">
                          No source traffic recorded yet
                        </td>
                      </tr>
                    ) : (
                      normalizedSources.map((source) => {
                        const conv = source.visitors > 0 ? (source.whatsapp / source.visitors) * 100 : 0;
                        return (
                          <tr key={source.label} className="hover:bg-slate-50/80">
                            <td className="py-2 font-medium text-slate-900">{source.label}</td>
                            <td className="py-2 text-right font-semibold">{source.visitors.toLocaleString()}</td>
                            <td className="py-2 text-right font-bold text-emerald-700">{source.whatsapp.toLocaleString()}</td>
                            <td className="py-2 text-right">
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-800">
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

            {/* Conversion Funnel (5 cols) */}
            <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs lg:col-span-5">
              <div className="mb-2.5 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Conversion Funnel</h3>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  {formatPercent(safeNumber(curr.conversion_rate))} total
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 p-2">
                  <span className="font-semibold text-slate-800">1. Visitors</span>
                  <span className="font-bold text-slate-900">{safeNumber(funnel.visitors).toLocaleString()}</span>
                </div>

                <div className="text-center text-[10px] text-slate-400">
                  ↓ {funnel.visitors > 0 ? `${Math.round(((safeNumber(funnel.portfolio_interest) + safeNumber(funnel.pricing_interest)) / safeNumber(funnel.visitors)) * 100)}% viewed packages` : "0%"}
                </div>

                <div className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 p-2">
                  <span className="font-semibold text-slate-800">2. Viewed Packages / Portfolio</span>
                  <span className="font-bold text-slate-900">
                    {(safeNumber(funnel.portfolio_interest) + safeNumber(funnel.pricing_interest)).toLocaleString()}
                  </span>
                </div>

                <div className="text-center text-[10px] text-slate-400">
                  ↓ {safeNumber(funnel.portfolio_interest) + safeNumber(funnel.pricing_interest) > 0 ? `${Math.round((safeNumber(funnel.whatsapp) / (safeNumber(funnel.portfolio_interest) + safeNumber(funnel.pricing_interest))) * 100)}% initiated chat` : "0%"}
                </div>

                <div className="flex items-center justify-between rounded border border-emerald-200 bg-emerald-50/50 p-2">
                  <span className="font-bold text-emerald-900">3. WhatsApp Enquiries</span>
                  <span className="font-extrabold text-emerald-800">{safeNumber(funnel.whatsapp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5. PACKAGES VIEWED & GOOGLE SEARCH QUERIES */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Top Packages */}
            <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs">
              <div className="mb-2.5 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Most Viewed Packages</h3>
                <button
                  type="button"
                  onClick={() => navigate(`/admin/analytics/deep-dive?section=packages&from=${from}&to=${to}`)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  View all →
                </button>
              </div>

              <div className="space-y-1.5">
                {packageAnalytics.package_clicks.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">No package view data recorded yet</p>
                ) : (
                  packageAnalytics.package_clicks.slice(0, 4).map((pkg) => (
                    <div key={pkg.package_name} className="flex items-center justify-between rounded border border-slate-100 bg-slate-50/60 p-2 text-xs">
                      <span className="font-medium text-slate-900">{pkg.package_name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">{safeNumber(pkg.clicks).toLocaleString()} views</span>
                        <span className="font-bold text-emerald-700">{safeNumber(pkg.unique_sessions).toLocaleString()} unique</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Google Search Queries */}
            <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs">
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-sky-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Google Search Queries</h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/admin/analytics/deep-dive?section=seo_queries&from=${from}&to=${to}`)}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-800"
                >
                  All queries ({seoQueries.length}) →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="pb-1.5 font-semibold">Query</th>
                      <th className="pb-1.5 text-right font-semibold">Clicks</th>
                      <th className="pb-1.5 text-right font-semibold">Impr.</th>
                      <th className="pb-1.5 text-right font-semibold">Pos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {seoQueries.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400">
                          {seoStatus.configured ? "No query data in this period" : "Click 'Sync Google' to fetch Search Console queries"}
                        </td>
                      </tr>
                    ) : (
                      seoQueries.slice(0, 4).map((q) => (
                        <tr key={q.query} className="hover:bg-slate-50/80">
                          <td className="py-1.5 font-medium text-slate-900">{q.query}</td>
                          <td className="py-1.5 text-right font-bold text-slate-900">{safeNumber(q.clicks).toLocaleString()}</td>
                          <td className="py-1.5 text-right text-slate-500">{safeNumber(q.impressions).toLocaleString()}</td>
                          <td className="py-1.5 text-right font-semibold text-slate-700">{safeNumber(q.avg_position).toFixed(1)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 6. PRIORITIZED SEO OPPORTUNITIES & DEVICE FOOTER */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Opportunities (8 cols) */}
            <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs lg:col-span-8">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Prioritized SEO Actions</h3>
                <button
                  type="button"
                  onClick={() => navigate(`/admin/analytics/deep-dive?section=seo_opportunities&from=${from}&to=${to}`)}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-800"
                >
                  View all ({seoOpportunities.length}) →
                </button>
              </div>

              <div className="space-y-1.5">
                {seoOpportunities.length === 0 ? (
                  <p className="py-3 text-center text-xs text-slate-400">No ranking anomalies detected</p>
                ) : (
                  seoOpportunities.slice(0, 2).map((opp) => (
                    <div key={opp.query} className="rounded border border-slate-200 bg-slate-50/50 p-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                            opp.priority === "high"
                              ? "bg-rose-100 text-rose-800"
                              : opp.priority === "medium"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {opp.priority} Priority
                        </span>
                        <span className="font-semibold text-slate-500">Ranking: #{opp.position.toFixed(1)}</span>
                      </div>
                      <p className="mt-1 font-bold text-slate-900">{opp.query}</p>
                      <p className="mt-0.5 text-[11px] text-slate-600">{opp.action}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Devices & Deep Dive (4 cols) */}
            <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3.5 text-xs shadow-xs lg:col-span-4">
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-800">Device Traffic</h3>
                <div className="space-y-1.5">
                  {deviceBreakdown.map((d) => {
                    const count = safeNumber(d.count);
                    const pct = totalDeviceSessions > 0 ? (count / totalDeviceSessions) * 100 : 0;
                    return (
                      <div key={d.device_type} className="flex items-center justify-between rounded border border-slate-100 p-1.5">
                        <div className="flex items-center gap-1.5 capitalize text-slate-700">
                          {d.device_type === "mobile" ? (
                            <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                          ) : d.device_type === "tablet" ? (
                            <Tablet className="h-3.5 w-3.5 text-slate-400" />
                          ) : (
                            <Monitor className="h-3.5 w-3.5 text-slate-400" />
                          )}
                          <span>{d.device_type}</span>
                        </div>
                        <strong className="text-slate-900">{pct.toFixed(0)}%</strong>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/admin/analytics/deep-dive?from=${from}&to=${to}`)}
                className="mt-3 block w-full rounded border border-slate-200 bg-slate-50 py-1.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-100"
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