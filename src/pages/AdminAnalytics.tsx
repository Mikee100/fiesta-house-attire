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
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  HelpCircle,
  Monitor,
  RefreshCw,
  Smartphone,
  Tablet,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminPage from "@/components/admin/AdminPage";
import AdminSection from "@/components/admin/AdminSection";
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
  if (value === null || value === undefined || !Number.isFinite(value)) return "No previous-period data";
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
};

const formatPercent = (value: number): string => `${Math.round(value * 10) / 10}%`;

const csvEscape = (value: string | number): string => {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const daysBetween = (from: string, to: string): number => {
  const diff = new Date(to).getTime() - new Date(from).getTime();
  return Math.max(1, Math.round(diff / 86_400_000) + 1);
};

// Palette lives in one place so every chart, badge, and legend stays in sync.
const CHART_COLORS = ["#6366f1", "#14b8a6", "#f59e0b", "#ec4899", "#0ea5e9", "#10b981"];

const EVENT_BADGE_STYLES = [
  "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20",
  "bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/20",
  "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
  "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20",
  "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
];

const getEventBadgeClass = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash + name.charCodeAt(i)) % EVENT_BADGE_STYLES.length;
  return EVENT_BADGE_STYLES[hash];
};

const DeviceIcon = ({ device, className }: { device: string; className?: string }) => {
  const normalized = device.toLowerCase();
  if (normalized.includes("mobile")) return <Smartphone className={className} />;
  if (normalized.includes("tablet")) return <Tablet className={className} />;
  if (normalized.includes("desktop")) return <Monitor className={className} />;
  return <HelpCircle className={className} />;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const [rangePreset, setRangePreset] = useState<"7" | "30" | "90" | "custom">("30");
  const [viewMode, setViewMode] = useState<"business" | "debug">("business");
  const [deepDiveSection, setDeepDiveSection] = useState<"event_types" | "top_clicks" | "top_pages" | "whatsapp_pages" | "cta_performance">("top_clicks");
  const [eventType, setEventType] = useState<"all" | "page_view" | "clicks">("all");
  const [topN, setTopN] = useState<"8" | "15" | "30" | "50">("15");
  const [topPagesQuery, setTopPagesQuery] = useState("");
  const [whatsappPagesQuery, setWhatsappPagesQuery] = useState("");
  const [eventTypesQuery, setEventTypesQuery] = useState("");
  const [topClicksQuery, setTopClicksQuery] = useState("");
  const [ctaQuery, setCtaQuery] = useState("");
  const [ctaEventFilter, setCtaEventFilter] = useState("all");
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(isoDate(new Date()));

  const [loading, setLoading] = useState(true);
  const [topClicks, setTopClicks] = useState<api.AnalyticsTopClickItem[]>([]);
  const [pageViews, setPageViews] = useState<api.AnalyticsPageViewItem[]>([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState<api.AnalyticsDeviceBreakdownItem[]>([]);
  const [topEventTypes, setTopEventTypes] = useState<api.AnalyticsTopEventTypeItem[]>([]);
  const [kpiCompare, setKpiCompare] = useState<api.AnalyticsKpiCompare>({
    current: { total_events: 0, page_views: 0, click_events: 0 },
    previous: { total_events: 0, page_views: 0, click_events: 0 },
  });
  const [ctaPerformance, setCtaPerformance] = useState<api.AnalyticsCtaPerformanceItem[]>([]);
  const [businessKpis, setBusinessKpis] = useState<api.AnalyticsBusinessKpis>({
    unique_visitors: 0,
    whatsapp_leads: 0,
    portfolio_engagement: 0,
    booking_intent: 0,
    returning_visitors: 0,
    conversion_rate: 0,
  });
  const [funnel, setFunnel] = useState<api.AnalyticsFunnel>({
    visitors: 0,
    portfolio_interest: 0,
    pricing_interest: 0,
    whatsapp: 0,
    booking: 0,
    checkout: 0,
  });
  const [topPages, setTopPages] = useState<api.AnalyticsTopPageItem[]>([]);
  const [whatsappByPage, setWhatsappByPage] = useState<api.AnalyticsWhatsappByPageItem[]>([]);
  const [topClicksFull, setTopClicksFull] = useState<api.AnalyticsTopClickItem[]>([]);
  const [topEventTypesFull, setTopEventTypesFull] = useState<api.AnalyticsTopEventTypeItem[]>([]);
  const [topPagesFull, setTopPagesFull] = useState<api.AnalyticsTopPageItem[]>([]);
  const [whatsappByPageFull, setWhatsappByPageFull] = useState<api.AnalyticsWhatsappByPageItem[]>([]);
  const [ctaPerformanceFull, setCtaPerformanceFull] = useState<api.AnalyticsCtaPerformanceItem[]>([]);
  const [eventMix, setEventMix] = useState<api.AnalyticsEventMix>({
    total: 0,
    page_views: 0,
    click_events: 0,
  });
  const [clickTrend, setClickTrend] = useState<api.AnalyticsClickTrendItem[]>([]);

  const [eventsPage, setEventsPage] = useState(1);
  const [refreshTick, setRefreshTick] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [recentEvents, setRecentEvents] = useState<api.AnalyticsRecentResponse>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
    rows: [],
  });

  const openDeepDivePage = (section: typeof deepDiveSection) => {
    const params = new URLSearchParams({
      section,
      from,
      to,
      topN,
      topPagesQuery,
      whatsappPagesQuery,
      eventTypesQuery,
      topClicksQuery,
      ctaQuery,
      ctaEventFilter,
    });
    navigate(`/admin/analytics/deep-dive?${params.toString()}`);
  };

  const activeRange = useMemo(() => ({ from, to }), [from, to]);

  useEffect(() => {
    if (rangePreset === "custom") return;

    const days = Number(rangePreset);
    setFrom(daysAgo(days));
    setTo(isoDate(new Date()));
    setEventsPage(1);
  }, [rangePreset]);

  useEffect(() => {
    setEventsPage(1);
  }, [eventType]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const [
          top,
          views,
          devices,
          eventTypes,
          topFull,
          eventTypesFull,
          compare,
          ctaRows,
          ctaRowsFull,
          business,
          funnelData,
          pages,
          pagesFull,
          waPages,
          waPagesFull,
          mix,
          clickSeries,
          recent,
        ] = await Promise.all([
          api.fetchAnalyticsTopClicks(activeRange.from, activeRange.to, 12),
          api.fetchAnalyticsPageViews(activeRange.from, activeRange.to),
          api.fetchAnalyticsDeviceBreakdown(activeRange.from, activeRange.to),
          api.fetchAnalyticsTopEventTypes(activeRange.from, activeRange.to, 8),
          api.fetchAnalyticsTopClicks(activeRange.from, activeRange.to, 50),
          api.fetchAnalyticsTopEventTypes(activeRange.from, activeRange.to, 50),
          api.fetchAnalyticsKpiCompare(activeRange.from, activeRange.to),
          api.fetchAnalyticsCtaPerformance(activeRange.from, activeRange.to, 20),
          api.fetchAnalyticsCtaPerformance(activeRange.from, activeRange.to, 100),
          api.fetchAnalyticsBusinessKpis(activeRange.from, activeRange.to),
          api.fetchAnalyticsFunnel(activeRange.from, activeRange.to),
          api.fetchAnalyticsTopPages(activeRange.from, activeRange.to, 8),
          api.fetchAnalyticsTopPages(activeRange.from, activeRange.to, 50),
          api.fetchAnalyticsWhatsappByPage(activeRange.from, activeRange.to, 8),
          api.fetchAnalyticsWhatsappByPage(activeRange.from, activeRange.to, 50),
          api.fetchAnalyticsEventMix(activeRange.from, activeRange.to),
          api.fetchAnalyticsClickTrend(activeRange.from, activeRange.to),
          api.fetchAnalyticsRecentEvents(activeRange.from, activeRange.to, eventsPage, 25, eventType),
        ]);

        setTopClicks(Array.isArray(top) ? top : []);
        setPageViews(Array.isArray(views) ? views : []);
        setDeviceBreakdown(Array.isArray(devices) ? devices : []);
        setTopEventTypes(Array.isArray(eventTypes) ? eventTypes : []);
        setTopClicksFull(Array.isArray(topFull) ? topFull : []);
        setTopEventTypesFull(Array.isArray(eventTypesFull) ? eventTypesFull : []);
        setKpiCompare(compare);
        setCtaPerformance(Array.isArray(ctaRows) ? ctaRows : []);
        setCtaPerformanceFull(Array.isArray(ctaRowsFull) ? ctaRowsFull : []);
        setBusinessKpis(business);
        setFunnel(funnelData);
        setTopPages(Array.isArray(pages) ? pages : []);
        setTopPagesFull(Array.isArray(pagesFull) ? pagesFull : []);
        setWhatsappByPage(Array.isArray(waPages) ? waPages : []);
        setWhatsappByPageFull(Array.isArray(waPagesFull) ? waPagesFull : []);
        setEventMix(mix);
        setClickTrend(Array.isArray(clickSeries) ? clickSeries : []);
        setRecentEvents(recent);
        setLastUpdatedAt(new Date());
      } catch {
        toast.error("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [activeRange, eventsPage, eventType, refreshTick]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRefreshTick((prev) => prev + 1);
    }, 15000);

    return () => window.clearInterval(timer);
  }, []);

  // ---- derived chart data ----

  const topClicksChartData = useMemo(
    () =>
      topClicks
        .map((item) => ({
          name: `${item.event_name}${item.label ? `: ${item.label}` : ""}`,
          count: safeNumber(item.count),
        }))
        .sort((a, b) => b.count - a.count),
    [topClicks],
  );

  const topEventTypesChartData = useMemo(
    () =>
      topEventTypes
        .map((item) => ({ name: item.event_name, count: safeNumber(item.count) }))
        .sort((a, b) => b.count - a.count),
    [topEventTypes],
  );

  const pageViewsChartData = useMemo(
    () => pageViews.map((item) => ({ day: item.day, views: safeNumber(item.views) })),
    [pageViews],
  );

  const deviceChartData = useMemo(
    () =>
      deviceBreakdown
        .map((item) => ({ device: item.device_type || "unknown", count: safeNumber(item.count) }))
        .sort((a, b) => b.count - a.count),
    [deviceBreakdown],
  );

  const eventMixChartData = useMemo(
    () => [
      { name: "Page views", count: safeNumber(eventMix.page_views) },
      { name: "Clicks", count: safeNumber(eventMix.click_events) },
    ],
    [eventMix],
  );

  const clickTrendChartData = useMemo(
    () => clickTrend.map((item) => ({ day: item.day, clicks: safeNumber(item.clicks) })),
    [clickTrend],
  );

  const funnelChartData = useMemo(
    () => [
      { step: "Visitors", value: safeNumber(funnel.visitors) },
      { step: "Portfolio", value: safeNumber(funnel.portfolio_interest) },
      { step: "Pricing", value: safeNumber(funnel.pricing_interest) },
      { step: "WhatsApp", value: safeNumber(funnel.whatsapp) },
      { step: "Booking", value: safeNumber(funnel.booking) },
      { step: "Checkout", value: safeNumber(funnel.checkout) },
    ],
    [funnel],
  );

  const topClicksFullChartData = useMemo(
    () =>
      topClicksFull
        .map((item) => ({
          name: `${item.event_name}${item.label ? `: ${item.label}` : ""}`,
          count: safeNumber(item.count),
        }))
        .sort((a, b) => b.count - a.count),
    [topClicksFull],
  );

  const topEventTypesFullChartData = useMemo(
    () =>
      topEventTypesFull
        .map((item) => ({ name: item.event_name, count: safeNumber(item.count) }))
        .sort((a, b) => b.count - a.count),
    [topEventTypesFull],
  );

  const topNValue = Number(topN);
  const normalizedTopPagesQuery = topPagesQuery.trim().toLowerCase();
  const normalizedWhatsappPagesQuery = whatsappPagesQuery.trim().toLowerCase();
  const normalizedEventTypesQuery = eventTypesQuery.trim().toLowerCase();
  const normalizedTopClicksQuery = topClicksQuery.trim().toLowerCase();
  const normalizedCtaQuery = ctaQuery.trim().toLowerCase();

  const filteredTopPages = useMemo(
    () =>
      topPages
        .filter((row) => (row.page || "/").toLowerCase().includes(normalizedTopPagesQuery))
        .slice(0, topNValue),
    [topPages, normalizedTopPagesQuery, topNValue],
  );

  const filteredWhatsappByPage = useMemo(
    () =>
      whatsappByPage
        .filter((row) => (row.page || "(unknown)").toLowerCase().includes(normalizedWhatsappPagesQuery))
        .slice(0, topNValue),
    [whatsappByPage, normalizedWhatsappPagesQuery, topNValue],
  );

  const filteredTopEventTypesChartData = useMemo(
    () => topEventTypesChartData.filter((row) => row.name.toLowerCase().includes(normalizedEventTypesQuery)).slice(0, topNValue),
    [topEventTypesChartData, normalizedEventTypesQuery, topNValue],
  );

  const filteredTopClicksChartData = useMemo(
    () => topClicksChartData.filter((row) => row.name.toLowerCase().includes(normalizedTopClicksQuery)).slice(0, topNValue),
    [topClicksChartData, normalizedTopClicksQuery, topNValue],
  );

  const filteredTopPagesFull = useMemo(
    () => topPagesFull.filter((row) => (row.page || "/").toLowerCase().includes(normalizedTopPagesQuery)).slice(0, topNValue),
    [topPagesFull, normalizedTopPagesQuery, topNValue],
  );

  const filteredWhatsappByPageFull = useMemo(
    () =>
      whatsappByPageFull
        .filter((row) => (row.page || "(unknown)").toLowerCase().includes(normalizedWhatsappPagesQuery))
        .slice(0, topNValue),
    [whatsappByPageFull, normalizedWhatsappPagesQuery, topNValue],
  );

  const filteredTopPagesFullChartData = useMemo(
    () => filteredTopPagesFull.map((item) => ({ name: item.page || "/", count: safeNumber(item.views) })),
    [filteredTopPagesFull],
  );

  const filteredWhatsappByPageFullChartData = useMemo(
    () => filteredWhatsappByPageFull.map((item) => ({ name: item.page || "(unknown)", count: safeNumber(item.whatsapp_clicks) })),
    [filteredWhatsappByPageFull],
  );

  const filteredTopEventTypesFullChartData = useMemo(
    () => topEventTypesFullChartData.filter((row) => row.name.toLowerCase().includes(normalizedEventTypesQuery)).slice(0, topNValue),
    [topEventTypesFullChartData, normalizedEventTypesQuery, topNValue],
  );

  const filteredTopClicksFullChartData = useMemo(
    () => topClicksFullChartData.filter((row) => row.name.toLowerCase().includes(normalizedTopClicksQuery)).slice(0, topNValue),
    [topClicksFullChartData, normalizedTopClicksQuery, topNValue],
  );

  const ctaEventOptions = useMemo(
    () => Array.from(new Set(ctaPerformanceFull.map((row) => row.event_name))).sort((a, b) => a.localeCompare(b)),
    [ctaPerformanceFull],
  );

  const filterCtaRows = (rows: api.AnalyticsCtaPerformanceItem[]) =>
    rows.filter((row) => {
      const matchesEvent = ctaEventFilter === "all" || row.event_name === ctaEventFilter;
      const searchable = `${row.event_name} ${row.label || ""}`.toLowerCase();
      const matchesQuery = searchable.includes(normalizedCtaQuery);
      return matchesEvent && matchesQuery;
    });

  const filteredCtaPerformance = useMemo(
    () => filterCtaRows(ctaPerformance).slice(0, topNValue),
    [ctaPerformance, ctaEventFilter, normalizedCtaQuery, topNValue],
  );

  const filteredCtaPerformanceFull = useMemo(
    () => filterCtaRows(ctaPerformanceFull).slice(0, topNValue),
    [ctaPerformanceFull, ctaEventFilter, normalizedCtaQuery, topNValue],
  );

  const deepDiveTitleMap: Record<typeof deepDiveSection, string> = {
    event_types: "Top Event Types (Full)",
    top_clicks: "Top Click Drilldown (Full)",
    top_pages: "Top Pages (Full)",
    whatsapp_pages: "WhatsApp By Page (Full)",
    cta_performance: "CTA Performance (Full)",
  };

  // ---- KPI summary ----

  const totalEvents = safeNumber(kpiCompare.current.total_events);
  const previousTotalEvents = safeNumber(kpiCompare.previous.total_events);
  const totalPageViews = safeNumber(kpiCompare.current.page_views);
  const previousPageViews = safeNumber(kpiCompare.previous.page_views);
  const totalClicks = safeNumber(kpiCompare.current.click_events);
  const previousTotalClicks = safeNumber(kpiCompare.previous.click_events);
  const deviceTotal = deviceChartData.reduce((sum, item) => sum + item.count, 0);
  const topDevice = deviceChartData[0];
  const rangeDays = daysBetween(from, to);
  const avgEventsPerDay = totalEvents > 0 ? Math.round(totalEvents / rangeDays) : 0;
  const previousAvgEventsPerDay = previousTotalEvents > 0 ? Math.round(previousTotalEvents / rangeDays) : 0;

  const ctaTotalClicks = ctaPerformance[0]?.total_clicks || 0;

  const businessCards = [
    { label: "Unique visitors", value: formatCompact(safeNumber(businessKpis.unique_visitors)) },
    { label: "WhatsApp leads", value: formatCompact(safeNumber(businessKpis.whatsapp_leads)) },
    { label: "Portfolio engagement", value: formatCompact(safeNumber(businessKpis.portfolio_engagement)) },
    { label: "Booking intent", value: formatCompact(safeNumber(businessKpis.booking_intent)) },
    { label: "Returning visitors", value: formatCompact(safeNumber(businessKpis.returning_visitors)) },
    { label: "Conversion rate", value: formatPercent(safeNumber(businessKpis.conversion_rate)) },
  ];

  const businessPrimaryCards = [
    {
      label: "Unique visitors",
      value: formatCompact(safeNumber(businessKpis.unique_visitors)),
      icon: Eye,
      accent: "bg-sky-50 text-sky-600",
    },
    {
      label: "WhatsApp leads",
      value: formatCompact(safeNumber(businessKpis.whatsapp_leads)),
      icon: Activity,
      accent: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Booking intent",
      value: formatCompact(safeNumber(businessKpis.booking_intent)),
      icon: TrendingUp,
      accent: "bg-amber-50 text-amber-600",
    },
    {
      label: "Conversion rate",
      value: formatPercent(safeNumber(businessKpis.conversion_rate)),
      icon: ArrowUpRight,
      accent: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Returning visitors",
      value: formatCompact(safeNumber(businessKpis.returning_visitors)),
      icon: Smartphone,
      accent: "bg-teal-50 text-teal-600",
    },
  ];

  const downloadCtaPerformanceCsv = () => {
    if (ctaPerformance.length === 0) {
      toast.error("No CTA data to export for this range");
      return;
    }

    const headers = [
      "event_name",
      "label",
      "clicks",
      "unique_sessions",
      "share_percent",
      "trend_percent",
      "previous_clicks",
      "from",
      "to",
    ];

    const rows = ctaPerformance.map((row) => {
      const clicks = safeNumber(row.clicks);
      const share = ctaTotalClicks > 0 ? (clicks / ctaTotalClicks) * 100 : 0;
      const trend = percentageDelta(clicks, safeNumber(row.previous_clicks));

      return [
        row.event_name,
        row.label || "(no label)",
        clicks,
        safeNumber(row.unique_sessions),
        share.toFixed(1),
        trend === null ? "new" : (Math.round(trend * 10) / 10).toString(),
        safeNumber(row.previous_clicks),
        from,
        to,
      ];
    });

    const csvLines = [
      headers.map(csvEscape).join(","),
      ...rows.map((values) => values.map(csvEscape).join(",")),
    ];

    const csvContent = csvLines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `cta-performance-${from}-to-${to}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const kpiCards = [
    {
      label: "Total events",
      value: formatCompact(totalEvents),
      delta: percentageDelta(totalEvents, previousTotalEvents),
      icon: Activity,
      accent: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Page views",
      value: formatCompact(totalPageViews),
      delta: percentageDelta(totalPageViews, previousPageViews),
      icon: Eye,
      accent: "bg-sky-50 text-sky-600",
    },
    {
      label: "Button clicks",
      value: formatCompact(totalClicks),
      delta: percentageDelta(totalClicks, previousTotalClicks),
      icon: Activity,
      accent: "bg-rose-50 text-rose-600",
    },
    {
      label: "Top device",
      value: topDevice ? topDevice.device : "—",
      showDelta: false,
      icon: Smartphone,
      accent: "bg-teal-50 text-teal-600",
    },
    {
      label: "Avg. events / day",
      value: formatCompact(avgEventsPerDay),
      delta: percentageDelta(avgEventsPerDay, previousAvgEventsPerDay),
      icon: TrendingUp,
      accent: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <>
      <SEO title="Admin Analytics" noindex nofollow />
      <AdminPage
        title="Visitor Analytics"
        description="Track package interest, page views, WhatsApp actions, and engagement trends."
        maxWidthClassName="max-w-7xl"
      >
        {/* Date range + controls */}
        <AdminSection
          title="Date Range"
          description="Filter analytics by period. Admin routes are excluded from tracking."
          contentClassName="p-3"
        >
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-2">
            <div className="inline-flex items-center gap-1 rounded-md bg-slate-100 p-1">
              {[
                { value: "7", label: "7d" },
                { value: "30", label: "30d" },
                { value: "90", label: "90d" },
                { value: "custom", label: "Custom" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setRangePreset(option.value as "7" | "30" | "90" | "custom");
                    setEventsPage(1);
                  }}
                  className={`h-7 rounded px-2.5 text-xs font-medium transition ${
                    rangePreset === option.value
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center gap-1 rounded-md bg-slate-100 p-1">
              {[
                { value: "business", label: "Business" },
                { value: "debug", label: "Debug" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setViewMode(option.value as "business" | "debug")}
                  className={`h-7 rounded px-2.5 text-xs font-medium transition ${
                    viewMode === option.value
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <input
              type="date"
              value={from}
              max={to}
              onChange={(event) => {
                setRangePreset("custom");
                setFrom(event.target.value);
                setEventsPage(1);
              }}
              className="h-7 rounded border border-slate-200 bg-white px-2 text-xs text-slate-800"
              aria-label="From date"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={to}
              min={from}
              onChange={(event) => {
                setRangePreset("custom");
                setTo(event.target.value);
                setEventsPage(1);
              }}
              className="h-7 rounded border border-slate-200 bg-white px-2 text-xs text-slate-800"
              aria-label="To date"
            />

            <button
              type="button"
              onClick={() => setRefreshTick((prev) => prev + 1)}
              disabled={loading}
              className="inline-flex h-7 items-center gap-1.5 rounded border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live · auto-refreshes every 15s
            </span>

            <span className="inline-flex h-7 items-center rounded bg-slate-100 px-2 text-xs text-slate-600">
              {lastUpdatedAt ? `Updated ${lastUpdatedAt.toLocaleTimeString()}` : "Waiting for data…"}
            </span>
          </div>
        </AdminSection>

        {/* KPI summary cards */}
        {viewMode === "business" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {businessPrimaryCards.map((card) => (
              <div
                key={card.label}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.accent}`}>
                  <card.icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-500">{card.label}</p>
                  <p className="truncate text-xl font-semibold text-slate-900">
                    {loading ? "—" : card.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {kpiCards.map((card) => (
              <div
                key={card.label}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.accent}`}>
                  <card.icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-500">{card.label}</p>
                  <p className="truncate text-xl font-semibold text-slate-900">
                    {loading ? "—" : card.value}
                  </p>
                  {!loading && card.showDelta !== false && (
                    <p className={`mt-0.5 text-xs font-medium ${card.delta !== null && card.delta < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {formatSignedPercent(card.delta)} vs previous period
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === "debug" && (
          <AdminSection title="Business Snapshot" description="Owner-focused metrics for lead generation and intent.">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              {businessCards.map((card) => (
                <div key={card.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{card.label}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{loading ? "—" : card.value}</p>
                </div>
              ))}
            </div>
          </AdminSection>
        )}

        {viewMode === "business" && (
        <>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <AdminSection title="Business Funnel" description="Visitor journey from exploration to intent actions.">
            <div className="h-72 w-full">
              {!loading && funnelChartData.every((item) => item.value === 0) ? (
                <EmptyState message="No funnel events in this range yet." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelChartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="step" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#14b8a6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </AdminSection>

          <AdminSection title="Funnel Step Drop-offs" description="Step-to-step change. This can increase if users enter mid-funnel.">
            <div className="space-y-2">
              {funnelChartData.map((entry, idx) => {
                if (idx === 0) return null;
                const prev = funnelChartData[idx - 1]?.value || 0;
                const stepChange = prev > 0 ? ((entry.value - prev) / prev) * 100 : null;
                const isDropOff = stepChange !== null && stepChange < 0;
                const isGrowth = stepChange !== null && stepChange > 0;
                const changeLabel =
                  stepChange === null
                    ? "No baseline (0 in previous step)"
                    : isDropOff
                      ? `${Math.abs(stepChange).toFixed(1)}% drop-off`
                      : isGrowth
                        ? `+${stepChange.toFixed(1)}% increase`
                        : "0.0% change";
                return (
                  <div key={entry.step} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                    <span className="text-sm text-slate-700">{funnelChartData[idx - 1].step} to {entry.step}</span>
                    <span className={`inline-flex items-center gap-1 text-sm font-medium ${isDropOff ? "text-rose-600" : isGrowth ? "text-emerald-600" : "text-slate-500"}`}>
                      {isDropOff ? <ArrowDownRight size={14} /> : isGrowth ? <ArrowUpRight size={14} /> : null}
                      {changeLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </AdminSection>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <AdminSection
            title="Top Pages"
            description="Most visited pages and unique visitors."
            actions={(
              <button
                type="button"
                onClick={() => {
                  setDeepDiveSection("top_pages");
                  openDeepDivePage("top_pages");
                }}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Expand
              </button>
            )}
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={topPagesQuery}
                onChange={(event) => setTopPagesQuery(event.target.value)}
                placeholder="Filter page path"
                className="h-8 min-w-[180px] rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
              />
              <select
                value={topN}
                onChange={(event) => setTopN(event.target.value as "8" | "15" | "30" | "50")}
                className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700"
              >
                <option value="8">Top 8</option>
                <option value="15">Top 15</option>
                <option value="30">Top 30</option>
                <option value="50">Top 50</option>
              </select>
            </div>
            <div className="overflow-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5">Page</th>
                    <th className="px-3 py-2.5 text-right">Views</th>
                    <th className="px-3 py-2.5 text-right">Unique</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {filteredTopPages.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-slate-500" colSpan={3}>
                        {loading ? "Loading pages…" : "No matching pages for this filter."}
                      </td>
                    </tr>
                  ) : (
                    filteredTopPages.map((row) => (
                      <tr key={row.page}>
                        <td className="max-w-[320px] truncate px-3 py-2.5 text-slate-700">{row.page || "/"}</td>
                        <td className="px-3 py-2.5 text-right font-medium text-slate-900">{safeNumber(row.views).toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right text-slate-600">{safeNumber(row.unique_visitors).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </AdminSection>

          <AdminSection
            title="WhatsApp By Page"
            description="Pages generating the strongest WhatsApp lead activity."
            actions={(
              <button
                type="button"
                onClick={() => {
                  setDeepDiveSection("whatsapp_pages");
                  openDeepDivePage("whatsapp_pages");
                }}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Expand
              </button>
            )}
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={whatsappPagesQuery}
                onChange={(event) => setWhatsappPagesQuery(event.target.value)}
                placeholder="Filter page path"
                className="h-8 min-w-[180px] rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
              />
              <select
                value={topN}
                onChange={(event) => setTopN(event.target.value as "8" | "15" | "30" | "50")}
                className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700"
              >
                <option value="8">Top 8</option>
                <option value="15">Top 15</option>
                <option value="30">Top 30</option>
                <option value="50">Top 50</option>
              </select>
            </div>
            <div className="overflow-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5">Page</th>
                    <th className="px-3 py-2.5 text-right">Clicks</th>
                    <th className="px-3 py-2.5 text-right">Unique</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {filteredWhatsappByPage.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-slate-500" colSpan={3}>
                        {loading ? "Loading WhatsApp data…" : "No matching pages for this filter."}
                      </td>
                    </tr>
                  ) : (
                    filteredWhatsappByPage.map((row) => (
                      <tr key={row.page}>
                        <td className="max-w-[320px] truncate px-3 py-2.5 text-slate-700">{row.page}</td>
                        <td className="px-3 py-2.5 text-right font-medium text-slate-900">{safeNumber(row.whatsapp_clicks).toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right text-slate-600">{safeNumber(row.unique_sessions).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </AdminSection>
        </div>
        </>
        )}

        {viewMode === "debug" && (
        <>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <AdminSection title="Event Mix" description="Quick split of page views vs tracked button clicks.">
            <div className="h-64 w-full">
              {!loading && eventMixChartData.every((item) => item.count === 0) ? (
                <EmptyState message="No events captured in this range yet." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={eventMixChartData} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {eventMixChartData.map((entry, index) => (
                        <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </AdminSection>

          <AdminSection title="Clicks Over Time" description="Daily trend for non-page_view actions.">
            <div className="h-64 w-full">
              {!loading && clickTrendChartData.length === 0 ? (
                <EmptyState message="No click events in this range yet." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={clickTrendChartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                    <defs>
                      <linearGradient id="clickTrendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ec4899" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      stroke="#ec4899"
                      strokeWidth={2}
                      fill="url(#clickTrendGradient)"
                      activeDot={{ r: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </AdminSection>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <AdminSection
            title="Top Event Types"
            description="High-level click volume by event name (labels grouped)."
            actions={(
              <button
                type="button"
                onClick={() => {
                  setDeepDiveSection("event_types");
                  openDeepDivePage("event_types");
                }}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Expand
              </button>
            )}
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={eventTypesQuery}
                onChange={(event) => setEventTypesQuery(event.target.value)}
                placeholder="Filter event name"
                className="h-8 min-w-[180px] rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
              />
              <select
                value={topN}
                onChange={(event) => setTopN(event.target.value as "8" | "15" | "30" | "50")}
                className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700"
              >
                <option value="8">Top 8</option>
                <option value="15">Top 15</option>
                <option value="30">Top 30</option>
                <option value="50">Top 50</option>
              </select>
            </div>
            <div className="h-72 w-full">
              {!loading && filteredTopEventTypesChartData.length === 0 ? (
                <EmptyState message="No matching event types for this filter." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredTopEventTypesChartData} margin={{ top: 6, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#0ea5e9" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </AdminSection>

          {/* Top clicked items — horizontal bars read long labels far more easily */}
          <AdminSection
            title="Top Click Drilldown"
            description="Event + label pairs for detailed placement-level analysis."
            actions={(
              <button
                type="button"
                onClick={() => {
                  setDeepDiveSection("top_clicks");
                  openDeepDivePage("top_clicks");
                }}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Expand
              </button>
            )}
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={topClicksQuery}
                onChange={(event) => setTopClicksQuery(event.target.value)}
                placeholder="Filter event or label"
                className="h-8 min-w-[180px] rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
              />
              <select
                value={topN}
                onChange={(event) => setTopN(event.target.value as "8" | "15" | "30" | "50")}
                className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700"
              >
                <option value="8">Top 8</option>
                <option value="15">Top 15</option>
                <option value="30">Top 30</option>
                <option value="50">Top 50</option>
              </select>
            </div>
            <div className="h-80 w-full">
              {!loading && filteredTopClicksChartData.length === 0 ? (
                <EmptyState message="No matching click entries for this filter." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredTopClicksChartData}
                    layout="vertical"
                    margin={{ top: 4, right: 20, left: 8, bottom: 4 }}
                  >
                    <defs>
                      <linearGradient id="topClicksGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={150}
                      tick={{ fontSize: 11, fill: "#334155" }}
                      tickFormatter={(value: string) => (value.length > 22 ? `${value.slice(0, 22)}…` : value)}
                    />
                    <Tooltip
                      cursor={{ fill: "#f1f5f9" }}
                      contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                    />
                    <Bar dataKey="count" fill="url(#topClicksGradient)" radius={[0, 6, 6, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </AdminSection>

          {/* Device breakdown — donut communicates share-of-total better than bars */}
          <AdminSection title="Device Breakdown" description="Traffic split by device category.">
            {!loading && deviceChartData.length === 0 ? (
              <div className="h-80 w-full">
                <EmptyState message="No device data in this range yet." />
              </div>
            ) : (
              <div className="flex h-80 w-full flex-col items-center gap-4 sm:flex-row">
                <div className="relative h-56 w-56 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceChartData}
                        dataKey="count"
                        nameKey="device"
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={92}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {deviceChartData.map((entry, index) => (
                          <Cell key={entry.device} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                        formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-semibold text-slate-900">{formatCompact(deviceTotal)}</span>
                    <span className="text-xs text-slate-500">sessions</span>
                  </div>
                </div>

                <div className="w-full flex-1 space-y-2">
                  {deviceChartData.map((entry, index) => {
                    const pct = deviceTotal > 0 ? (entry.count / deviceTotal) * 100 : 0;
                    return (
                      <div key={entry.device} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <DeviceIcon device={entry.device} className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="flex-1 truncate text-sm capitalize text-slate-700">{entry.device}</span>
                        <span className="text-sm font-medium text-slate-900">{entry.count.toLocaleString()}</span>
                        <span className="w-12 text-right text-xs text-slate-400">{pct.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </AdminSection>
        </div>

        {/* Page views trend — filled area reads growth/decline at a glance */}
        <AdminSection title="Page Views Over Time" description="Daily page view counts for the selected range.">
          <div className="h-80 w-full">
            {!loading && pageViewsChartData.length === 0 ? (
              <EmptyState message="No page views in this range yet." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pageViewsChartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                  <defs>
                    <linearGradient id="pageViewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#f97316"
                    strokeWidth={2}
                    fill="url(#pageViewsGradient)"
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </AdminSection>

        </>
        )}

        {viewMode === "business" && (
        <AdminSection
          title="CTA Performance"
          description="Top event + label combinations with click share and period-over-period trend."
          actions={(
            <>
              <button
                type="button"
                onClick={() => {
                  setDeepDiveSection("cta_performance");
                  openDeepDivePage("cta_performance");
                }}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Expand
              </button>
              <button
                type="button"
                onClick={downloadCtaPerformanceCsv}
                disabled={loading || ctaPerformance.length === 0}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Download CSV
              </button>
            </>
          )}
          contentClassName="p-0"
        >
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/70 px-3 py-2">
            <input
              type="text"
              value={ctaQuery}
              onChange={(event) => setCtaQuery(event.target.value)}
              placeholder="Filter event or label"
              className="h-8 min-w-[190px] rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
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
            <select
              value={topN}
              onChange={(event) => setTopN(event.target.value as "8" | "15" | "30" | "50")}
              className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700"
            >
              <option value="8">Top 8</option>
              <option value="15">Top 15</option>
              <option value="30">Top 30</option>
              <option value="50">Top 50</option>
            </select>
          </div>
          <div className="overflow-auto">
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
                {filteredCtaPerformance.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                      {loading ? "Loading CTA performance…" : "No matching CTA rows for this filter."}
                    </td>
                  </tr>
                ) : (
                  filteredCtaPerformance.map((row) => {
                    const share = ctaTotalClicks > 0 ? (safeNumber(row.clicks) / ctaTotalClicks) * 100 : 0;
                    const trend = percentageDelta(safeNumber(row.clicks), safeNumber(row.previous_clicks));

                    return (
                      <tr key={`${row.event_name}:${row.label}`} className="transition hover:bg-slate-50">
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getEventBadgeClass(row.event_name)}`}>
                            {row.event_name}
                          </span>
                        </td>
                        <td className="max-w-[220px] truncate px-4 py-3">{row.label || "(no label)"}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">{safeNumber(row.clicks).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{safeNumber(row.unique_sessions).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{share.toFixed(1)}%</td>
                        <td className={`px-4 py-3 text-right font-medium ${trend !== null && trend < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {formatSignedPercent(trend)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </AdminSection>
        )}

        <AdminSection title="Deep Dive" description="Expand any analytics area to inspect the full dataset with larger visuals.">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {[
                { value: "top_clicks", label: "Click Drilldown" },
                { value: "event_types", label: "Event Types" },
                { value: "top_pages", label: "Top Pages" },
                { value: "whatsapp_pages", label: "WhatsApp Pages" },
                { value: "cta_performance", label: "CTA Table" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDeepDiveSection(option.value as typeof deepDiveSection)}
                  className={`h-8 rounded-md px-3 text-xs font-medium transition ${
                    deepDiveSection === option.value
                      ? "bg-slate-900 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-2 py-2">
              {(deepDiveSection === "top_pages" || deepDiveSection === "whatsapp_pages") && (
                <input
                  type="text"
                  value={deepDiveSection === "top_pages" ? topPagesQuery : whatsappPagesQuery}
                  onChange={(event) =>
                    deepDiveSection === "top_pages"
                      ? setTopPagesQuery(event.target.value)
                      : setWhatsappPagesQuery(event.target.value)
                  }
                  placeholder="Filter page path"
                  className="h-8 min-w-[190px] rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
                />
              )}

              {(deepDiveSection === "top_clicks" || deepDiveSection === "event_types") && (
                <input
                  type="text"
                  value={deepDiveSection === "top_clicks" ? topClicksQuery : eventTypesQuery}
                  onChange={(event) =>
                    deepDiveSection === "top_clicks"
                      ? setTopClicksQuery(event.target.value)
                      : setEventTypesQuery(event.target.value)
                  }
                  placeholder={deepDiveSection === "top_clicks" ? "Filter event or label" : "Filter event name"}
                  className="h-8 min-w-[190px] rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
                />
              )}

              {deepDiveSection === "cta_performance" && (
                <>
                  <input
                    type="text"
                    value={ctaQuery}
                    onChange={(event) => setCtaQuery(event.target.value)}
                    placeholder="Filter event or label"
                    className="h-8 min-w-[190px] rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
                  />
                  <select
                    value={ctaEventFilter}
                    onChange={(event) => setCtaEventFilter(event.target.value)}
                    className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700"
                  >
                    <option value="all">All events</option>
                    {ctaEventOptions.map((eventName) => (
                      <option key={`deep-cta-filter-${eventName}`} value={eventName}>
                        {eventName}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <select
                value={topN}
                onChange={(event) => setTopN(event.target.value as "8" | "15" | "30" | "50")}
                className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700"
              >
                <option value="8">Top 8</option>
                <option value="15">Top 15</option>
                <option value="30">Top 30</option>
                <option value="50">Top 50</option>
              </select>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{deepDiveTitleMap[deepDiveSection]}</p>
                <button
                  type="button"
                  onClick={() => openDeepDivePage(deepDiveSection)}
                  className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Expand
                </button>
              </div>

              {deepDiveSection === "top_clicks" && (
                <div className="h-[440px]">
                  {!loading && filteredTopClicksFullChartData.length === 0 ? (
                    <EmptyState message="No matching click entries for this filter." />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={filteredTopClicksFullChartData} layout="vertical" margin={{ top: 8, right: 20, left: 8, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                        <YAxis type="category" dataKey="name" width={190} tick={{ fontSize: 11, fill: "#334155" }} tickFormatter={(value: string) => (value.length > 28 ? `${value.slice(0, 28)}…` : value)} />
                        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                        <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={14} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}

              {deepDiveSection === "event_types" && (
                <div className="h-[440px]">
                  {!loading && filteredTopEventTypesFullChartData.length === 0 ? (
                    <EmptyState message="No matching event types for this filter." />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={filteredTopEventTypesFullChartData} margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                        <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}

              {deepDiveSection === "top_pages" && (
                <>
                  <div className="h-[280px] mb-3">
                    {!loading && filteredTopPagesFullChartData.length === 0 ? (
                      <EmptyState message="No matching pages for this filter." />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={filteredTopPagesFullChartData} margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(value: string) => (value.length > 18 ? `${value.slice(0, 18)}…` : value)} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                          <Bar dataKey="count" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="max-h-[260px] overflow-auto rounded-lg border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-3 py-2.5">Page</th>
                          <th className="px-3 py-2.5 text-right">Views</th>
                          <th className="px-3 py-2.5 text-right">Unique</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                        {filteredTopPagesFull.map((row) => (
                          <tr key={`deep-page-${row.page}`}>
                            <td className="max-w-[340px] truncate px-3 py-2.5">{row.page || "/"}</td>
                            <td className="px-3 py-2.5 text-right font-medium text-slate-900">{safeNumber(row.views).toLocaleString()}</td>
                            <td className="px-3 py-2.5 text-right text-slate-600">{safeNumber(row.unique_visitors).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {deepDiveSection === "whatsapp_pages" && (
                <>
                  <div className="h-[280px] mb-3">
                    {!loading && filteredWhatsappByPageFullChartData.length === 0 ? (
                      <EmptyState message="No matching pages for this filter." />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={filteredWhatsappByPageFullChartData} margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(value: string) => (value.length > 18 ? `${value.slice(0, 18)}…` : value)} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                          <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="max-h-[260px] overflow-auto rounded-lg border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-3 py-2.5">Page</th>
                          <th className="px-3 py-2.5 text-right">Clicks</th>
                          <th className="px-3 py-2.5 text-right">Unique</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                        {filteredWhatsappByPageFull.map((row) => (
                          <tr key={`deep-wa-${row.page}`}>
                            <td className="max-w-[340px] truncate px-3 py-2.5">{row.page || "(unknown)"}</td>
                            <td className="px-3 py-2.5 text-right font-medium text-slate-900">{safeNumber(row.whatsapp_clicks).toLocaleString()}</td>
                            <td className="px-3 py-2.5 text-right text-slate-600">{safeNumber(row.unique_sessions).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {deepDiveSection === "cta_performance" && (
                <div className="max-h-[520px] overflow-auto rounded-lg border border-slate-200">
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
                      {filteredCtaPerformanceFull.map((row) => {
                        const share = ctaTotalClicks > 0 ? (safeNumber(row.clicks) / ctaTotalClicks) * 100 : 0;
                        const trend = percentageDelta(safeNumber(row.clicks), safeNumber(row.previous_clicks));
                        return (
                          <tr key={`deep-cta-${row.event_name}-${row.label}`}>
                            <td className="whitespace-nowrap px-4 py-3">{row.event_name}</td>
                            <td className="max-w-[260px] truncate px-4 py-3">{row.label || "(no label)"}</td>
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
            </div>
          </AdminSection>

        {viewMode === "debug" && (
        <AdminSection title="Recent Raw Events" description="Latest captured events with pagination and metadata." contentClassName="p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/70 px-4 py-2.5">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Event Type</span>
            <div className="inline-flex items-center gap-1 rounded-md bg-white p-1 ring-1 ring-slate-200">
              {[
                { value: "all", label: "All" },
                { value: "clicks", label: "Clicks only" },
                { value: "page_view", label: "Page views" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setEventType(option.value as "all" | "page_view" | "clicks")}
                  className={`h-7 rounded px-2.5 text-xs font-medium transition ${
                    eventType === option.value
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Label</th>
                  <th className="px-4 py-3">Page</th>
                  <th className="px-4 py-3">Device</th>
                  <th className="px-4 py-3">Session</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {recentEvents.rows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-500" colSpan={6}>
                      {loading ? "Loading events…" : "No events found for this date range."}
                    </td>
                  </tr>
                ) : (
                  recentEvents.rows.map((row) => (
                    <tr key={row.id} className="transition hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                        {new Date(row.created_at).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getEventBadgeClass(
                            row.event_name,
                          )}`}
                        >
                          {row.event_name}
                        </span>
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3">{row.label || "—"}</td>
                      <td className="max-w-[280px] truncate px-4 py-3 text-slate-500">{row.page_url || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <DeviceIcon device={row.device_type || "unknown"} className="h-3.5 w-3.5 text-slate-400" />
                          {row.device_type || "unknown"}
                        </span>
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-3 font-mono text-xs text-slate-400">
                        {row.session_id || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
            <span>
              Page {recentEvents.page} of {recentEvents.totalPages}
              <span className="ml-2 text-slate-400">({recentEvents.total.toLocaleString()} total)</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEventsPage((prev) => Math.max(1, prev - 1))}
                disabled={eventsPage <= 1 || loading}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setEventsPage((prev) => Math.min(recentEvents.totalPages, prev + 1))}
                disabled={eventsPage >= recentEvents.totalPages || loading}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </AdminSection>
        )}

      </AdminPage>
    </>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 text-slate-400">
    <Activity size={20} />
    <p className="text-sm">{message}</p>
  </div>
);

export default AdminAnalytics;