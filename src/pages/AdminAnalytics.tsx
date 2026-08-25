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
  Eye,
  HelpCircle,
  Monitor,
  RefreshCw,
  Smartphone,
  Tablet,
  TrendingUp,
} from "lucide-react";
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
  const [rangePreset, setRangePreset] = useState<"7" | "30" | "90" | "custom">("30");
  const [eventType, setEventType] = useState<"all" | "page_view" | "clicks">("all");
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(isoDate(new Date()));

  const [loading, setLoading] = useState(true);
  const [topClicks, setTopClicks] = useState<api.AnalyticsTopClickItem[]>([]);
  const [pageViews, setPageViews] = useState<api.AnalyticsPageViewItem[]>([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState<api.AnalyticsDeviceBreakdownItem[]>([]);
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
        const [top, views, devices, mix, clickSeries, recent] = await Promise.all([
          api.fetchAnalyticsTopClicks(activeRange.from, activeRange.to, 12),
          api.fetchAnalyticsPageViews(activeRange.from, activeRange.to),
          api.fetchAnalyticsDeviceBreakdown(activeRange.from, activeRange.to),
          api.fetchAnalyticsEventMix(activeRange.from, activeRange.to),
          api.fetchAnalyticsClickTrend(activeRange.from, activeRange.to),
          api.fetchAnalyticsRecentEvents(activeRange.from, activeRange.to, eventsPage, 25, eventType),
        ]);

        setTopClicks(Array.isArray(top) ? top : []);
        setPageViews(Array.isArray(views) ? views : []);
        setDeviceBreakdown(Array.isArray(devices) ? devices : []);
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

  // ---- KPI summary ----

  const totalPageViews = pageViewsChartData.reduce((sum, item) => sum + item.views, 0);
  const totalClicks = eventMixChartData.find((item) => item.name === "Clicks")?.count || 0;
  const deviceTotal = deviceChartData.reduce((sum, item) => sum + item.count, 0);
  const topDevice = deviceChartData[0];
  const rangeDays = daysBetween(from, to);
  const avgEventsPerDay = recentEvents.total > 0 ? Math.round(recentEvents.total / rangeDays) : 0;

  const kpiCards = [
    {
      label: "Total events",
      value: formatCompact(recentEvents.total),
      icon: Activity,
      accent: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Page views",
      value: formatCompact(totalPageViews),
      icon: Eye,
      accent: "bg-sky-50 text-sky-600",
    },
    {
      label: "Button clicks",
      value: formatCompact(totalClicks),
      icon: Activity,
      accent: "bg-rose-50 text-rose-600",
    },
    {
      label: "Top device",
      value: topDevice ? topDevice.device : "—",
      icon: Smartphone,
      accent: "bg-teal-50 text-teal-600",
    },
    {
      label: "Avg. events / day",
      value: formatCompact(avgEventsPerDay),
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
              </div>
            </div>
          ))}
        </div>

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
          {/* Top clicked items — horizontal bars read long labels far more easily */}
          <AdminSection title="Top Clicked Items" description="Most clicked actions and labels in the selected period.">
            <div className="h-80 w-full">
              {!loading && topClicksChartData.length === 0 ? (
                <EmptyState message="No click events in this range yet." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topClicksChartData}
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

        {/* Recent raw events */}
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

        {/* Tracking guide */}
        <AdminSection
          title="How To Track New Buttons"
          description="Use the data-track attribute on any public-page element. Analytics is automatic and excludes /admin routes."
          contentClassName="space-y-4"
        >
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-medium text-slate-900">Attribute format</p>
            <p className="mt-1 font-mono text-xs text-slate-600">data-track="event_name:label"</p>
            <p className="mt-3 text-slate-600">
              Example names: package_click, whatsapp_click, phone_click, gallery_image_open, contact_form_submit.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-2 text-sm font-medium text-slate-900">Copy example</p>
            <pre className="overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
{`<a
  href="https://wa.me/254720111928"
  data-track="whatsapp_click:hero_cta"
>
  Chat on WhatsApp
</a>`}
            </pre>
          </div>

          <p className="text-sm text-slate-600">
            Tip: keep event_name stable and vary the label for placement (for example: hero_cta, pricing_card,
            footer_link) so reports stay clean.
          </p>
        </AdminSection>
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