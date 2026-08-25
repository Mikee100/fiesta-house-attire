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

const formatWeeklyDeltaMessage = (current: number, previous: number): { text: string; tone: "up" | "down" | "neutral" } => {
  if (previous <= 0) {
    if (current <= 0) return { text: "No change from 0 vs previous week", tone: "neutral" };
    return { text: `New this week (${current.toLocaleString()})`, tone: "up" };
  }

  const delta = percentageDelta(current, previous);
  if (delta === null || !Number.isFinite(delta)) {
    return { text: "No comparable previous week", tone: "neutral" };
  }

  return {
    text: `${formatSignedPercent(delta)} vs previous week`,
    tone: delta < 0 ? "down" : "up",
  };
};

const formatPeriodDeltaMessage = (
  current: number,
  previous: number,
  unit: "day" | "week" | "month" | "year"
): { text: string; tone: "up" | "down" | "neutral" } => {
  if (previous <= 0) {
    if (current <= 0) return { text: `No change from 0 vs previous ${unit}`, tone: "neutral" };
    return { text: `New this ${unit} (${current.toLocaleString()})`, tone: "up" };
  }

  const delta = percentageDelta(current, previous);
  if (delta === null || !Number.isFinite(delta)) {
    return { text: `No comparable previous ${unit}`, tone: "neutral" };
  }

  return {
    text: `${formatSignedPercent(delta)} vs previous ${unit}`,
    tone: delta < 0 ? "down" : "up",
  };
};

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

const shiftIsoDate = (iso: string, days: number): string => {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  return isoDate(date);
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
  const [visitsGranularity, setVisitsGranularity] = useState<"day" | "week" | "month" | "year">("week");
  const [rangePreset, setRangePreset] = useState<"7" | "30" | "90" | "custom">("30");
  const [viewMode, setViewMode] = useState<"business" | "debug">("business");
  const [topNTopPages, setTopNTopPages] = useState<"8" | "15" | "30" | "50">("15");
  const [topNWhatsappPages, setTopNWhatsappPages] = useState<"8" | "15" | "30" | "50">("15");
  const [topNEventTypes, setTopNEventTypes] = useState<"8" | "15" | "30" | "50">("15");
  const [topNTopClicks, setTopNTopClicks] = useState<"8" | "15" | "30" | "50">("15");
  const [topNCta, setTopNCta] = useState<"8" | "15" | "30" | "50">("15");
  const [eventType, setEventType] = useState<"all" | "page_view" | "clicks">("all");
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
  const [eventMix, setEventMix] = useState<api.AnalyticsEventMix>({
    total: 0,
    page_views: 0,
    click_events: 0,
  });
  const [clickTrend, setClickTrend] = useState<api.AnalyticsClickTrendItem[]>([]);
  const [visitsDaySeries, setVisitsDaySeries] = useState<api.AnalyticsVisitsTimeseriesItem[]>([]);
  const [visitsWeekSeries, setVisitsWeekSeries] = useState<api.AnalyticsVisitsTimeseriesItem[]>([]);
  const [visitsMonthSeries, setVisitsMonthSeries] = useState<api.AnalyticsVisitsTimeseriesItem[]>([]);
  const [visitsYearSeries, setVisitsYearSeries] = useState<api.AnalyticsVisitsTimeseriesItem[]>([]);
  const [weeklyBusinessCurrent, setWeeklyBusinessCurrent] = useState<api.AnalyticsBusinessKpis | null>(null);
  const [weeklyBusinessPrevious, setWeeklyBusinessPrevious] = useState<api.AnalyticsBusinessKpis | null>(null);
  const [weeklyTopCtaCurrent, setWeeklyTopCtaCurrent] = useState<api.AnalyticsCtaPerformanceItem | null>(null);
  const [weeklyTopCtaPrevious, setWeeklyTopCtaPrevious] = useState<api.AnalyticsCtaPerformanceItem | null>(null);

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

  const openDeepDivePage = (section: "event_types" | "top_clicks" | "top_pages" | "whatsapp_pages" | "cta_performance") => {
    const topNBySection: Record<typeof section, "8" | "15" | "30" | "50"> = {
      top_pages: topNTopPages,
      whatsapp_pages: topNWhatsappPages,
      event_types: topNEventTypes,
      top_clicks: topNTopClicks,
      cta_performance: topNCta,
    };

    const params = new URLSearchParams({
      section,
      from,
      to,
      topN: topNBySection[section],
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
        const weekEnd = activeRange.to;
        const weekStart = shiftIsoDate(weekEnd, -6);
        const prevWeekEnd = shiftIsoDate(weekStart, -1);
        const prevWeekStart = shiftIsoDate(prevWeekEnd, -6);

        const [
          top,
          views,
          devices,
          eventTypes,
          compare,
          ctaRows,
          business,
          funnelData,
          pages,
          waPages,
          mix,
          clickSeries,
          recent,
          visitsDay,
          visitsWeek,
          visitsMonth,
          visitsYear,
          weekBusinessCurrent,
          weekBusinessPrevious,
          weekCtaCurrent,
          weekCtaPrevious,
        ] = await Promise.all([
          api.fetchAnalyticsTopClicks(activeRange.from, activeRange.to, 12),
          api.fetchAnalyticsPageViews(activeRange.from, activeRange.to),
          api.fetchAnalyticsDeviceBreakdown(activeRange.from, activeRange.to),
          api.fetchAnalyticsTopEventTypes(activeRange.from, activeRange.to, 8),
          api.fetchAnalyticsKpiCompare(activeRange.from, activeRange.to),
          api.fetchAnalyticsCtaPerformance(activeRange.from, activeRange.to, 20),
          api.fetchAnalyticsBusinessKpis(activeRange.from, activeRange.to),
          api.fetchAnalyticsFunnel(activeRange.from, activeRange.to),
          api.fetchAnalyticsTopPages(activeRange.from, activeRange.to, 8),
          api.fetchAnalyticsWhatsappByPage(activeRange.from, activeRange.to, 8),
          api.fetchAnalyticsEventMix(activeRange.from, activeRange.to),
          api.fetchAnalyticsClickTrend(activeRange.from, activeRange.to),
          api.fetchAnalyticsRecentEvents(activeRange.from, activeRange.to, eventsPage, 25, eventType),
          api.fetchAnalyticsVisitsTimeseries(activeRange.from, activeRange.to, "day"),
          api.fetchAnalyticsVisitsTimeseries(activeRange.from, activeRange.to, "week"),
          api.fetchAnalyticsVisitsTimeseries(activeRange.from, activeRange.to, "month"),
          api.fetchAnalyticsVisitsTimeseries(activeRange.from, activeRange.to, "year"),
          api.fetchAnalyticsBusinessKpis(weekStart, weekEnd),
          api.fetchAnalyticsBusinessKpis(prevWeekStart, prevWeekEnd),
          api.fetchAnalyticsCtaPerformance(weekStart, weekEnd, 10),
          api.fetchAnalyticsCtaPerformance(prevWeekStart, prevWeekEnd, 50),
        ]);

        setTopClicks(Array.isArray(top) ? top : []);
        setPageViews(Array.isArray(views) ? views : []);
        setDeviceBreakdown(Array.isArray(devices) ? devices : []);
        setTopEventTypes(Array.isArray(eventTypes) ? eventTypes : []);
        setKpiCompare(compare);
        setCtaPerformance(Array.isArray(ctaRows) ? ctaRows : []);
        setBusinessKpis(business);
        setFunnel(funnelData);
        setTopPages(Array.isArray(pages) ? pages : []);
        setWhatsappByPage(Array.isArray(waPages) ? waPages : []);
        setEventMix(mix);
        setClickTrend(Array.isArray(clickSeries) ? clickSeries : []);
        setRecentEvents(recent);
        setVisitsDaySeries(Array.isArray(visitsDay) ? visitsDay : []);
        setVisitsWeekSeries(Array.isArray(visitsWeek) ? visitsWeek : []);
        setVisitsMonthSeries(Array.isArray(visitsMonth) ? visitsMonth : []);
        setVisitsYearSeries(Array.isArray(visitsYear) ? visitsYear : []);
        setWeeklyBusinessCurrent(weekBusinessCurrent);
        setWeeklyBusinessPrevious(weekBusinessPrevious);

        const currentTopCta = Array.isArray(weekCtaCurrent) && weekCtaCurrent.length > 0 ? weekCtaCurrent[0] : null;
        setWeeklyTopCtaCurrent(currentTopCta);

        if (currentTopCta && Array.isArray(weekCtaPrevious)) {
          const previousMatch =
            weekCtaPrevious.find(
              (row) =>
                row.event_name === currentTopCta.event_name &&
                String(row.label || "") === String(currentTopCta.label || ""),
            ) || null;
          setWeeklyTopCtaPrevious(previousMatch);
        } else {
          setWeeklyTopCtaPrevious(null);
        }

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
          name: formatTopClickDisplayName(item.event_name, item.label),
          rawName: `${item.event_name}${item.label ? `: ${item.label}` : ""}`.toLowerCase(),
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

  const visitsSeriesByGranularity = useMemo(
    () => ({
      day: visitsDaySeries,
      week: visitsWeekSeries,
      month: visitsMonthSeries,
      year: visitsYearSeries,
    }),
    [visitsDaySeries, visitsWeekSeries, visitsMonthSeries, visitsYearSeries],
  );

  const selectedVisitsSeries = visitsSeriesByGranularity[visitsGranularity] || [];
  const visitsTrendChartData = useMemo(
    () => selectedVisitsSeries.map((row) => ({ bucket: row.bucket, visits: safeNumber(row.visits) })),
    [selectedVisitsSeries],
  );

  const buildVisitsStat = (rows: api.AnalyticsVisitsTimeseriesItem[]) => {
    if (!rows || rows.length === 0) {
      return {
        current: 0,
        previous: 0,
        delta: null as number | null,
      };
    }

    const sorted = [...rows].sort((a, b) => new Date(a.bucket_start).getTime() - new Date(b.bucket_start).getTime());
    const current = safeNumber(sorted[sorted.length - 1]?.visits);
    const previous = safeNumber(sorted[sorted.length - 2]?.visits);
    return {
      current,
      previous,
      delta: percentageDelta(current, previous),
    };
  };

  const visitsStats = {
    day: buildVisitsStat(visitsDaySeries),
    week: buildVisitsStat(visitsWeekSeries),
    month: buildVisitsStat(visitsMonthSeries),
    year: buildVisitsStat(visitsYearSeries),
  };

  const topNTopPagesValue = Number(topNTopPages);
  const topNWhatsappPagesValue = Number(topNWhatsappPages);
  const topNEventTypesValue = Number(topNEventTypes);
  const topNTopClicksValue = Number(topNTopClicks);
  const topNCtaValue = Number(topNCta);
  const normalizedTopPagesQuery = topPagesQuery.trim().toLowerCase();
  const normalizedWhatsappPagesQuery = whatsappPagesQuery.trim().toLowerCase();
  const normalizedEventTypesQuery = eventTypesQuery.trim().toLowerCase();
  const normalizedTopClicksQuery = topClicksQuery.trim().toLowerCase();
  const normalizedCtaQuery = ctaQuery.trim().toLowerCase();

  const filteredTopPages = useMemo(
    () =>
      topPages
        .filter((row) => (row.page || "/").toLowerCase().includes(normalizedTopPagesQuery))
        .slice(0, topNTopPagesValue),
    [topPages, normalizedTopPagesQuery, topNTopPagesValue],
  );

  const filteredWhatsappByPage = useMemo(
    () =>
      whatsappByPage
        .filter((row) => (row.page || "(unknown)").toLowerCase().includes(normalizedWhatsappPagesQuery))
        .slice(0, topNWhatsappPagesValue),
    [whatsappByPage, normalizedWhatsappPagesQuery, topNWhatsappPagesValue],
  );

  const filteredTopEventTypesChartData = useMemo(
    () => topEventTypesChartData.filter((row) => row.name.toLowerCase().includes(normalizedEventTypesQuery)).slice(0, topNEventTypesValue),
    [topEventTypesChartData, normalizedEventTypesQuery, topNEventTypesValue],
  );

  const filteredTopClicksChartData = useMemo(
    () =>
      topClicksChartData
        .filter((row) => row.rawName.includes(normalizedTopClicksQuery) || row.name.toLowerCase().includes(normalizedTopClicksQuery))
        .slice(0, topNTopClicksValue),
    [topClicksChartData, normalizedTopClicksQuery, topNTopClicksValue],
  );

  const ctaEventOptions = useMemo(
    () => Array.from(new Set(ctaPerformance.map((row) => row.event_name))).sort((a, b) => a.localeCompare(b)),
    [ctaPerformance],
  );

  const filterCtaRows = (rows: api.AnalyticsCtaPerformanceItem[]) =>
    rows.filter((row) => {
      const matchesEvent = ctaEventFilter === "all" || row.event_name === ctaEventFilter;
      const searchable = `${row.event_name} ${row.label || ""}`.toLowerCase();
      const matchesQuery = searchable.includes(normalizedCtaQuery);
      return matchesEvent && matchesQuery;
    });

  const filteredCtaPerformance = useMemo(
    () => filterCtaRows(ctaPerformance).slice(0, topNCtaValue),
    [ctaPerformance, ctaEventFilter, normalizedCtaQuery, topNCtaValue],
  );

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

  const weeklyLeadsCurrent = safeNumber(weeklyBusinessCurrent?.whatsapp_leads);
  const weeklyLeadsPrevious = safeNumber(weeklyBusinessPrevious?.whatsapp_leads);
  const weeklyConversionCurrent = safeNumber(weeklyBusinessCurrent?.conversion_rate);
  const weeklyConversionPrevious = safeNumber(weeklyBusinessPrevious?.conversion_rate);
  const weeklyTopCtaCurrentClicks = safeNumber(weeklyTopCtaCurrent?.clicks);
  const weeklyTopCtaPreviousClicks = safeNumber(weeklyTopCtaPrevious?.clicks);

  const weeklySummaryCards = [
    {
      label: "Weekly leads",
      value: formatCompact(weeklyLeadsCurrent),
      delta: percentageDelta(weeklyLeadsCurrent, weeklyLeadsPrevious),
      current: weeklyLeadsCurrent,
      previous: weeklyLeadsPrevious,
      sub: "WhatsApp leads (last 7d)",
    },
    {
      label: "Weekly conversion",
      value: formatPercent(weeklyConversionCurrent),
      delta: percentageDelta(weeklyConversionCurrent, weeklyConversionPrevious),
      current: weeklyConversionCurrent,
      previous: weeklyConversionPrevious,
      sub: "Lead conversion rate (last 7d)",
    },
    {
      label: "Top CTA this week",
      value: weeklyTopCtaCurrent
        ? `${toHumanToken(weeklyTopCtaCurrent.event_name)} • ${toHumanToken(weeklyTopCtaCurrent.label || "(no label)")}`
        : "No CTA clicks",
      delta: percentageDelta(weeklyTopCtaCurrentClicks, weeklyTopCtaPreviousClicks),
      current: weeklyTopCtaCurrentClicks,
      previous: weeklyTopCtaPreviousClicks,
      sub: weeklyTopCtaCurrent
        ? `${weeklyTopCtaCurrentClicks.toLocaleString()} clicks`
        : "No click data in last 7d",
      compactValue: true,
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
        maxWidthClassName="max-w-6xl"
      >
        {/* Date range + controls */}
        <AdminSection
          title="Date Range"
          description="Filter analytics by period. Admin routes are excluded from tracking."
          contentClassName="p-2"
        >
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5">
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
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {businessPrimaryCards.map((card) => (
                <div
                  key={card.label}
                  className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-3"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${card.accent}`}>
                    <card.icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-slate-500">{card.label}</p>
                    <p className="truncate text-lg font-semibold text-slate-900">
                      {loading ? "—" : card.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <AdminSection
              title="Weekly Business Summary"
              description="Week-over-week movement for key decisions (last 7 days vs previous 7 days)."
              contentClassName="p-1"
            >
              <div className="grid grid-cols-1 gap-1 md:grid-cols-3">
                {weeklySummaryCards.map((card) => {
                  const weeklyDelta = formatWeeklyDeltaMessage(card.current, card.previous);
                  const tone =
                    weeklyDelta.tone === "down"
                      ? "text-rose-600"
                      : weeklyDelta.tone === "up"
                        ? "text-emerald-600"
                        : "text-slate-500";
                  return (
                    <div key={card.label} className="rounded border border-slate-200 bg-slate-50 px-2 py-1">
                      <p className="truncate text-[10px] font-medium text-slate-500">{card.label}</p>
                      <p className={`${card.compactValue ? "text-[11px]" : "text-sm"} leading-tight font-semibold text-slate-900`}>
                        {loading ? "—" : card.value}
                      </p>
                      <p className="truncate text-[10px] leading-tight text-slate-500">{card.sub}</p>
                      <p className={`text-[10px] leading-tight font-medium ${tone}`}>
                        {loading ? "—" : weeklyDelta.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </AdminSection>
          </>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {kpiCards.map((card) => (
              <div
                key={card.label}
                className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${card.accent}`}>
                  <card.icon size={16} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium text-slate-500">{card.label}</p>
                  <p className="truncate text-lg font-semibold text-slate-900">
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

        <AdminSection
          title="Website Visits"
          description="Visits by day, week, month, and year with trend view."
          contentClassName="p-1.5"
        >
          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded border border-slate-200 bg-white px-2 py-1.5">
            {([
              { key: "day", label: "Per day" },
              { key: "week", label: "Per week" },
              { key: "month", label: "Per month" },
              { key: "year", label: "Per year" },
            ] as Array<{ key: "day" | "week" | "month" | "year"; label: string }>).map((item) => {
              const stat = visitsStats[item.key];
              const periodDelta = formatPeriodDeltaMessage(stat.current, stat.previous, item.key);
              const tone = periodDelta.tone === "down" ? "text-rose-600" : periodDelta.tone === "up" ? "text-emerald-600" : "text-slate-500";
              return (
                <p key={item.key} className="truncate text-[11px] leading-tight">
                  <span className="font-medium text-slate-600">{item.label}:</span>{" "}
                  <span className="font-semibold text-slate-900">{loading ? "—" : stat.current.toLocaleString()}</span>{" "}
                  <span className={`font-medium ${tone}`}>({loading ? "—" : periodDelta.text})</span>
                </p>
              );
            })}
          </div>

          <div className="mb-2 inline-flex items-center gap-0.5 rounded-md bg-slate-100 p-0.5">
            {([
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
              { value: "year", label: "Year" },
            ] as Array<{ value: "day" | "week" | "month" | "year"; label: string }>).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setVisitsGranularity(option.value)}
                className={`h-6 rounded px-2 text-[11px] font-medium transition ${
                  visitsGranularity === option.value
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="h-56 w-full">
            {!loading && visitsTrendChartData.length === 0 ? (
              <EmptyState message="No visit data in this range yet." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visitsTrendChartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Bar dataKey="visits" radius={[6, 6, 0, 0]} fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </AdminSection>

        {viewMode === "debug" && (
          <AdminSection title="Business Snapshot" description="Owner-focused metrics for lead generation and intent.">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
              {businessCards.map((card) => (
                <div key={card.label} className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{card.label}</p>
                  <p className="mt-0.5 text-base font-semibold text-slate-900">{loading ? "—" : card.value}</p>
                </div>
              ))}
            </div>
          </AdminSection>
        )}

        {viewMode === "business" && (
        <>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <AdminSection title="Business Funnel" description="Visitor journey from exploration to intent actions.">
            <div className="h-64 w-full">
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

          <AdminSection title="Funnel Step Drop-offs" description="How many users were kept or lost from one step to the next.">
            <div className="space-y-2">
              {funnelChartData.map((entry, idx) => {
                if (idx === 0) return null;
                const prev = funnelChartData[idx - 1]?.value || 0;
                const curr = entry.value;

                let changeLabel = "";
                let toneClass = "text-slate-500";
                let icon: "down" | "up" | null = null;

                if (prev === 0 && curr === 0) {
                  changeLabel = "No activity in either step";
                } else if (prev === 0 && curr > 0) {
                  changeLabel = `Started here: ${curr.toLocaleString()} users`;
                  toneClass = "text-emerald-600";
                  icon = "up";
                } else {
                  const conversion = (curr / prev) * 100;
                  if (curr <= prev) {
                    const dropOff = 100 - conversion;
                    const lost = prev - curr;
                    changeLabel = `Kept ${curr.toLocaleString()}/${prev.toLocaleString()} (${conversion.toFixed(1)}%) • Lost ${lost.toLocaleString()} (${dropOff.toFixed(1)}%)`;
                    toneClass = dropOff > 0 ? "text-rose-600" : "text-emerald-600";
                    icon = dropOff > 0 ? "down" : null;
                  } else {
                    const increase = ((curr - prev) / prev) * 100;
                    const entered = curr - prev;
                    changeLabel = `More users entered here: +${entered.toLocaleString()} (+${increase.toFixed(1)}%)`;
                    toneClass = "text-emerald-600";
                    icon = "up";
                  }
                }
                return (
                  <div key={entry.step} className="flex items-center justify-between rounded-md border border-slate-200 px-2.5 py-1.5">
                    <span className="text-xs text-slate-700">{funnelChartData[idx - 1].step} to {entry.step}</span>
                    <span className={`inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium ${toneClass}`}>
                      {icon === "down" ? <ArrowDownRight size={14} /> : icon === "up" ? <ArrowUpRight size={14} /> : null}
                      {changeLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </AdminSection>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <AdminSection
            title="Top Pages"
            description="Most visited pages and unique visitors."
            actions={(
              <button
                type="button"
                onClick={() => openDeepDivePage("top_pages")}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Expand
              </button>
            )}
          >
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <input
                type="text"
                value={topPagesQuery}
                onChange={(event) => setTopPagesQuery(event.target.value)}
                placeholder="Filter page path"
                className="h-7 min-w-[170px] rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
              />
              <select
                value={topNTopPages}
                onChange={(event) => setTopNTopPages(event.target.value as "8" | "15" | "30" | "50")}
                className="h-7 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-700"
              >
                <option value="8">Top 8</option>
                <option value="15">Top 15</option>
                <option value="30">Top 30</option>
                <option value="50">Top 50</option>
              </select>
            </div>
            <div className="overflow-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-2.5 py-2">Page</th>
                    <th className="px-2.5 py-2 text-right">Views</th>
                    <th className="px-2.5 py-2 text-right">Unique</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {filteredTopPages.length === 0 ? (
                    <tr>
                      <td className="px-2.5 py-5 text-center text-slate-500" colSpan={3}>
                        {loading ? "Loading pages…" : "No matching pages for this filter."}
                      </td>
                    </tr>
                  ) : (
                    filteredTopPages.map((row) => (
                      <tr key={row.page}>
                        <td className="max-w-[320px] truncate px-2.5 py-2 text-slate-700">{row.page || "/"}</td>
                        <td className="px-2.5 py-2 text-right font-medium text-slate-900">{safeNumber(row.views).toLocaleString()}</td>
                        <td className="px-2.5 py-2 text-right text-slate-600">{safeNumber(row.unique_visitors).toLocaleString()}</td>
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
                onClick={() => openDeepDivePage("whatsapp_pages")}
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
                value={topNWhatsappPages}
                onChange={(event) => setTopNWhatsappPages(event.target.value as "8" | "15" | "30" | "50")}
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
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <AdminSection title="Event Mix" description="Quick split of page views vs tracked button clicks.">
            <div className="h-56 w-full">
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
            <div className="h-56 w-full">
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

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <AdminSection
            title="Top Event Types"
            description="High-level click volume by event name (labels grouped)."
            actions={(
              <button
                type="button"
                onClick={() => openDeepDivePage("event_types")}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Expand
              </button>
            )}
          >
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <input
                type="text"
                value={eventTypesQuery}
                onChange={(event) => setEventTypesQuery(event.target.value)}
                placeholder="Filter event name"
                className="h-7 min-w-[170px] rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
              />
              <select
                value={topNEventTypes}
                onChange={(event) => setTopNEventTypes(event.target.value as "8" | "15" | "30" | "50")}
                className="h-7 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-700"
              >
                <option value="8">Top 8</option>
                <option value="15">Top 15</option>
                <option value="30">Top 30</option>
                <option value="50">Top 50</option>
              </select>
            </div>
            <div className="h-64 w-full">
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
                onClick={() => openDeepDivePage("top_clicks")}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Expand
              </button>
            )}
          >
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <input
                type="text"
                value={topClicksQuery}
                onChange={(event) => setTopClicksQuery(event.target.value)}
                placeholder="Filter event or label"
                className="h-7 min-w-[170px] rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
              />
              <select
                value={topNTopClicks}
                onChange={(event) => setTopNTopClicks(event.target.value as "8" | "15" | "30" | "50")}
                className="h-7 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-700"
              >
                <option value="8">Top 8</option>
                <option value="15">Top 15</option>
                <option value="30">Top 30</option>
                <option value="50">Top 50</option>
              </select>
            </div>
            <div className="h-64 w-full">
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
                      width={130}
                      tick={{ fontSize: 11, fill: "#334155" }}
                      tickFormatter={(value: string) => (value.length > 18 ? `${value.slice(0, 18)}…` : value)}
                    />
                    <Tooltip
                      cursor={{ fill: "#f1f5f9" }}
                      contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                    />
                    <Bar dataKey="count" fill="url(#topClicksGradient)" radius={[0, 6, 6, 0]} barSize={13} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </AdminSection>

          {/* Device breakdown — donut communicates share-of-total better than bars */}
          <AdminSection title="Device Breakdown" description="Traffic split by device category.">
            {!loading && deviceChartData.length === 0 ? (
              <div className="h-72 w-full">
                <EmptyState message="No device data in this range yet." />
              </div>
            ) : (
              <div className="flex h-64 w-full flex-col items-center gap-2 sm:flex-row">
                <div className="relative h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceChartData}
                        dataKey="count"
                        nameKey="device"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={78}
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
                    <span className="text-xl font-semibold text-slate-900">{formatCompact(deviceTotal)}</span>
                    <span className="text-[11px] text-slate-500">sessions</span>
                  </div>
                </div>

                <div className="w-full flex-1 space-y-1">
                  {deviceChartData.map((entry, index) => {
                    const pct = deviceTotal > 0 ? (entry.count / deviceTotal) * 100 : 0;
                    return (
                      <div key={entry.device} className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-slate-50">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <DeviceIcon device={entry.device} className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="flex-1 truncate text-xs capitalize text-slate-700">{entry.device}</span>
                        <span className="text-xs font-medium text-slate-900">{entry.count.toLocaleString()}</span>
                        <span className="w-10 text-right text-[11px] text-slate-400">{pct.toFixed(0)}%</span>
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
          <div className="h-64 w-full">
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
                onClick={() => openDeepDivePage("cta_performance")}
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
          <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-slate-50/70 px-2.5 py-1.5">
            <input
              type="text"
              value={ctaQuery}
              onChange={(event) => setCtaQuery(event.target.value)}
              placeholder="Filter event or label"
              className="h-7 min-w-[180px] rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
            />
            <select
              value={ctaEventFilter}
              onChange={(event) => setCtaEventFilter(event.target.value)}
              className="h-7 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-700"
            >
              <option value="all">All events</option>
              {ctaEventOptions.map((eventName) => (
                <option key={eventName} value={eventName}>
                  {eventName}
                </option>
              ))}
            </select>
            <select
              value={topNCta}
              onChange={(event) => setTopNCta(event.target.value as "8" | "15" | "30" | "50")}
              className="h-7 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-700"
            >
              <option value="8">Top 8</option>
              <option value="15">Top 15</option>
              <option value="30">Top 30</option>
              <option value="50">Top 50</option>
            </select>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Event</th>
                  <th className="px-3 py-2">Label</th>
                  <th className="px-3 py-2 text-right">Clicks</th>
                  <th className="px-3 py-2 text-right">Unique Sessions</th>
                  <th className="px-3 py-2 text-right">Share</th>
                  <th className="px-3 py-2 text-right">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {filteredCtaPerformance.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-slate-500" colSpan={6}>
                      {loading ? "Loading CTA performance…" : "No matching CTA rows for this filter."}
                    </td>
                  </tr>
                ) : (
                  filteredCtaPerformance.map((row) => {
                    const share = ctaTotalClicks > 0 ? (safeNumber(row.clicks) / ctaTotalClicks) * 100 : 0;
                    const trend = percentageDelta(safeNumber(row.clicks), safeNumber(row.previous_clicks));

                    return (
                      <tr key={`${row.event_name}:${row.label}`} className="transition hover:bg-slate-50">
                        <td className="whitespace-nowrap px-3 py-2">
                          <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium ${getEventBadgeClass(row.event_name)}`}>
                            {row.event_name}
                          </span>
                        </td>
                        <td className="max-w-[220px] truncate px-3 py-2">{row.label || "(no label)"}</td>
                        <td className="px-3 py-2 text-right font-medium text-slate-900">{safeNumber(row.clicks).toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-slate-600">{safeNumber(row.unique_sessions).toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-slate-600">{share.toFixed(1)}%</td>
                        <td className={`px-3 py-2 text-right font-medium ${trend !== null && trend < 0 ? "text-rose-600" : "text-emerald-600"}`}>
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

        {viewMode === "debug" && (
        <AdminSection title="Recent Raw Events" description="Latest captured events with pagination and metadata." contentClassName="p-0">
          <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-200 bg-slate-50/70 px-2.5 py-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Event Type</span>
            <div className="inline-flex items-center gap-0.5 rounded-md bg-white p-0.5 ring-1 ring-slate-200">
              {[
                { value: "all", label: "All" },
                { value: "clicks", label: "Clicks only" },
                { value: "page_view", label: "Page views" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setEventType(option.value as "all" | "page_view" | "clicks")}
                  className={`h-6 rounded px-2 text-[11px] font-medium transition ${
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
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Event</th>
                  <th className="px-3 py-2">Label</th>
                  <th className="px-3 py-2">Page</th>
                  <th className="px-3 py-2">Device</th>
                  <th className="px-3 py-2">Session</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {recentEvents.rows.length === 0 ? (
                  <tr>
                    <td className="px-3 py-7 text-center text-slate-500" colSpan={6}>
                      {loading ? "Loading events…" : "No events found for this date range."}
                    </td>
                  </tr>
                ) : (
                  recentEvents.rows.map((row) => (
                    <tr key={row.id} className="transition hover:bg-slate-50">
                      <td className="whitespace-nowrap px-3 py-2 text-slate-500">
                        {new Date(row.created_at).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium ${getEventBadgeClass(
                            row.event_name,
                          )}`}
                        >
                          {row.event_name}
                        </span>
                      </td>
                      <td className="max-w-[220px] truncate px-3 py-2">{row.label || "—"}</td>
                      <td className="max-w-[280px] truncate px-3 py-2 text-slate-500">{row.page_url || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <DeviceIcon device={row.device_type || "unknown"} className="h-3.5 w-3.5 text-slate-400" />
                          {row.device_type || "unknown"}
                        </span>
                      </td>
                      <td className="max-w-[180px] truncate px-3 py-2 font-mono text-[11px] text-slate-400">
                        {row.session_id || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2 text-xs text-slate-600">
            <span>
              Page {recentEvents.page} of {recentEvents.totalPages}
              <span className="ml-2 text-slate-400">({recentEvents.total.toLocaleString()} total)</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEventsPage((prev) => Math.max(1, prev - 1))}
                disabled={eventsPage <= 1 || loading}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setEventsPage((prev) => Math.min(recentEvents.totalPages, prev + 1))}
                disabled={eventsPage >= recentEvents.totalPages || loading}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] disabled:cursor-not-allowed disabled:opacity-50"
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