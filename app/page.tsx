"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getCurrentUser,
  signOut,
} from "aws-amplify/auth";
import { Inter, IBM_Plex_Mono } from "next/font/google";

import type { Schema } from "../amplify/data/resource";
import { client } from "./amplify-client";

type Monitor = Schema["Monitor"]["type"];
type MonitorCheck = Schema["MonitorCheck"]["type"];
type Incident = Schema["Incident"]["type"];

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

/* ============================================================
   TYPES
   ============================================================ */

type Theme = "dark" | "light";
type DashboardFilter = "all" | "up" | "down" | "unknown" | "disabled";
type SortMode = "status" | "name" | "response" | "recent";

type SelectOption = {
  value: string;
  label: string;
  description?: string;
};

/* ============================================================
   ICONS
   ============================================================ */

function Icon({
  name,
  size = 18,
  strokeWidth = 1.8,
}: {
  name:
    | "activity"
    | "plus"
    | "refresh"
    | "settings"
    | "sun"
    | "moon"
    | "monitor"
    | "check"
    | "chevron"
    | "external"
    | "trash"
    | "pause"
    | "play"
    | "clock"
    | "zap"
    | "shield"
    | "chart"
    | "bell"
    | "search"
    | "more"
    | "expand"
    | "x"
    | "arrow"
    | "eye";
  size?: number;
  strokeWidth?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "activity":
      return (
        <svg {...common}>
          <path d="M3 12h4l3-8 4 16 3-8h4" />
        </svg>
      );

    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );

    case "refresh":
      return (
        <svg {...common}>
          <path d="M20 11a8.1 8.1 0 0 0-14.9-4L3 10" />
          <path d="M3 5v5h5" />
          <path d="M4 13a8.1 8.1 0 0 0 14.9 4L21 14" />
          <path d="M21 19v-5h-5" />
        </svg>
      );

    case "settings":
      return (
        <svg {...common}>
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.4v-.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.46 15a1.7 1.7 0 0 0-1.56-1.03H6.7v-2.4h.2A1.7 1.7 0 0 0 8.46 10a1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.7-1.7.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56V5h2.4v.2a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.56 1.03h.2v2.4h-.2A1.7 1.7 0 0 0 19.4 15Z" />
        </svg>
      );

    case "sun":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
        </svg>
      );

    case "moon":
      return (
        <svg {...common}>
          <path d="M20.5 14.7A8.5 8.5 0 0 1 9.3 3.5 8.5 8.5 0 1 0 20.5 14.7Z" />
        </svg>
      );

    case "monitor":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "chevron":
      return (
        <svg {...common}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );

    case "external":
      return (
        <svg {...common}>
          <path d="M14 5h5v5" />
          <path d="M10 14 19 5" />
          <path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
        </svg>
      );

    case "trash":
      return (
        <svg {...common}>
          <path d="M4 7h16M10 11v6M14 11v6" />
          <path d="M6 7l1 13h10l1-13M9 7V4h6v3" />
        </svg>
      );

    case "pause":
      return (
        <svg {...common}>
          <path d="M8 5v14M16 5v14" />
        </svg>
      );

    case "play":
      return (
        <svg {...common}>
          <path d="m8 5 11 7-11 7V5Z" />
        </svg>
      );

    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );

    case "zap":
      return (
        <svg {...common}>
          <path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z" />
        </svg>
      );

    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3 20 6v5c0 5-3.3 8.5-8 10-4.7-1.5-8-5-8-10V6l8-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );

    case "chart":
      return (
        <svg {...common}>
          <path d="M4 19V5M4 19h16" />
          <path d="m7 15 3-4 3 2 5-7" />
        </svg>
      );

    case "bell":
      return (
        <svg {...common}>
          <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
      );

    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
      );

    case "more":
      return (
        <svg {...common}>
          <circle cx="5" cy="12" r="1" fill="currentColor" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
          <circle cx="19" cy="12" r="1" fill="currentColor" />
        </svg>
      );

    case "expand":
      return (
        <svg {...common}>
          <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5" />
          <path d="m3 8 5-5M16 3l5 5M21 16l-5 5M8 21l-5-5" />
        </svg>
      );

    case "x":
      return (
        <svg {...common}>
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      );

    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );

    case "eye":
      return (
        <svg {...common}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );

    default:
      return null;
  }
}

/* ============================================================
   UTILITIES
   ============================================================ */

function formatChecked(value?: string | null) {
  if (!value) return "Never checked";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.max(0, Math.round(diffMs / 1000));

  if (diffSec < 10) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.round(diffSec / 60);

  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHour = Math.round(diffMin / 60);

  if (diffHour < 24) return `${diffHour}h ago`;

  return date.toLocaleDateString();
}

function formatResponse(value?: number | null) {
  if (value == null) return "—";
  return `${value} ms`;
}

function formatDuration(seconds?: number | null) {
  if (seconds == null) return "ongoing";
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.round(hours / 24);
  return `${days}d`;
}

function statusRank(monitor: Monitor) {
  if (!monitor.enabled) return 4;
  if (monitor.status === "DOWN") return 0;
  if (monitor.status === "UNKNOWN") return 1;
  return 2;
}

function getStatus(monitor: Monitor) {
  if (!monitor.enabled) return "disabled";

  if (monitor.status === "UP") return "up";
  if (monitor.status === "DOWN") return "down";

  return "unknown";
}

// Uptime % computed from real check records inside a time window — not a
// stored/stale field, so it only ever reflects what was actually observed.
function uptimeForWindow(checks: MonitorCheck[], hours: number) {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  const inWindow = checks.filter(
    (check) => new Date(check.checkedAt).getTime() >= cutoff
  );

  if (inWindow.length === 0) return null;

  const up = inWindow.filter((check) => check.status === "UP").length;
  return Math.round((up / inWindow.length) * 1000) / 10;
}

/* ============================================================
   RESPONSE TIME CHART
   ============================================================ */

function ResponseTimeChart({
  points,
}: {
  points: { y: number | null }[];
}) {
  const valid = points.filter((p) => p.y != null) as { y: number }[];

  if (valid.length < 2) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-[var(--pc-muted)]">
        Not enough data yet — check back after a few more checks run.
      </div>
    );
  }

  const width = 560;
  const height = 120;
  const maxY = Math.max(...valid.map((p) => p.y));
  const minY = Math.min(...valid.map((p) => p.y));
  const range = maxY - minY || 1;
  const stepX = width / Math.max(points.length - 1, 1);

  let path = "";
  points.forEach((point, index) => {
    if (point.y == null) return;
    const x = index * stepX;
    const y = height - ((point.y - minY) / range) * (height - 20) - 10;
    path += `${path === "" ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)} `;
  });

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-32 w-full"
        preserveAspectRatio="none"
      >
        <path
          d={path}
          fill="none"
          stroke="#4C8DFF"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-[var(--pc-muted)]">
        <span>{minY}ms</span>
        <span>{maxY}ms</span>
      </div>
    </div>
  );
}

/* ============================================================
   PREMIUM SELECT
   ============================================================ */

function PremiumSelect({
  value,
  onChange,
  options,
  icon,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  icon: React.ReactNode;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, []);

  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyboard);

    return () => {
      document.removeEventListener("keydown", handleKeyboard);
    };
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      {label && (
        <label className="mb-2 block text-[12px] font-semibold text-[var(--pc-muted)]">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`
          group flex min-h-[54px] w-full items-center gap-3 rounded-xl
          border px-3.5 text-left outline-none transition-all duration-200
          ${
            open
              ? "border-[#4C8DFF] bg-[var(--pc-select-active)] shadow-[0_0_0_3px_rgba(76,141,255,0.12)]"
              : "border-[var(--pc-border)] bg-[var(--pc-input)] hover:border-[var(--pc-border-hover)]"
          }
        `}
      >
        <span
          className={`
            flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
            bg-[var(--pc-icon-bg)] text-[var(--pc-muted)]
            ${open ? "text-[#4C8DFF]" : ""}
          `}
        >
          {icon}
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-sm font-semibold ${
              selected
                ? "text-[var(--pc-text)]"
                : "text-[var(--pc-muted)]"
            }`}
          >
            {selected?.label ?? "Select"}
          </span>

          {selected?.description && (
            <span className="mt-0.5 block truncate text-[11px] text-[var(--pc-muted)]">
              {selected.description}
            </span>
          )}
        </span>

        <span
          className={`shrink-0 text-[var(--pc-muted)] transition-transform duration-200 ${
            open ? "rotate-180 text-[#4C8DFF]" : ""
          }`}
        >
          <Icon name="chevron" size={17} />
        </span>
      </button>

      {open && (
        <div
          className="
            absolute left-0 right-0 z-[200] mt-2 overflow-hidden
            rounded-xl border border-[var(--pc-border)]
            bg-[var(--pc-dropdown)] p-1.5
            shadow-[0_24px_60px_rgba(0,0,0,0.28)]
            backdrop-blur-xl
            animate-[pcDropdown_.16s_ease-out]
          "
        >
          {options.map((option) => {
            const active = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`
                  flex w-full items-center gap-3 rounded-lg px-3 py-3
                  text-left transition-all duration-150
                  ${
                    active
                      ? "bg-[#4C8DFF]/12 text-[#4C8DFF]"
                      : "text-[var(--pc-text)] hover:bg-[var(--pc-hover)]"
                  }
                `}
              >
                <span
                  className={`
                    flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
                    ${
                      active
                        ? "bg-[#4C8DFF]/10 text-[#4C8DFF]"
                        : "bg-[var(--pc-icon-bg)] text-[var(--pc-muted)]"
                    }
                  `}
                >
                  {icon}
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-sm ${
                      active ? "font-semibold" : "font-medium"
                    }`}
                  >
                    {option.label}
                  </span>

                  {option.description && (
                    <span className="mt-0.5 block truncate text-[11px] text-[var(--pc-muted)]">
                      {option.description}
                    </span>
                  )}
                </span>

                {active && (
                  <span className="text-[#4C8DFF]">
                    <Icon name="check" size={17} strokeWidth={2.4} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  /* ----------------------------------------------------------
     AUTH GUARD
     ---------------------------------------------------------- */

  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(false);

  /* ----------------------------------------------------------
     DATA
     ---------------------------------------------------------- */

  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loadingMonitors, setLoadingMonitors] = useState(false);

  /* ----------------------------------------------------------
     UI
     ---------------------------------------------------------- */

  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [theme, setTheme] = useState<Theme>("dark");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DashboardFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("status");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [checkInterval, setCheckInterval] = useState("5");
  const [monitorType, setMonitorType] = useState("HTTP");
  const [method, setMethod] = useState("GET");
  const [expectedStatusCode, setExpectedStatusCode] = useState("200");
  const [expectedBodyText, setExpectedBodyText] = useState("");
  const [timeoutSeconds, setTimeoutSeconds] = useState("10");
  const [port, setPort] = useState("");
  const [dnsRecordType, setDnsRecordType] = useState("A");
  const [dnsExpectedValue, setDnsExpectedValue] = useState("");
  const [sslExpiryWarningDays, setSslExpiryWarningDays] = useState("14");
  const [requestHeadersJson, setRequestHeadersJson] = useState("");
  const [requestBody, setRequestBody] = useState("");

  const [editMonitor, setEditMonitor] = useState<Monitor | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editCheckInterval, setEditCheckInterval] = useState("5");
  const [editMonitorType, setEditMonitorType] = useState("HTTP");
  const [editMethod, setEditMethod] = useState("GET");
  const [editExpectedStatusCode, setEditExpectedStatusCode] = useState("200");
  const [editExpectedBodyText, setEditExpectedBodyText] = useState("");
  const [editTimeoutSeconds, setEditTimeoutSeconds] = useState("10");
  const [editPort, setEditPort] = useState("");
  const [editDnsRecordType, setEditDnsRecordType] = useState("A");
  const [editDnsExpectedValue, setEditDnsExpectedValue] = useState("");
  const [editSslExpiryWarningDays, setEditSslExpiryWarningDays] = useState("14");
  const [editRequestHeadersJson, setEditRequestHeadersJson] = useState("");
  const [editRequestBody, setEditRequestBody] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [clock, setClock] = useState<Date | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  /* ----------------------------------------------------------
     MONITOR DETAIL DRAWER
     ---------------------------------------------------------- */

  const [viewMonitor, setViewMonitor] = useState<Monitor | null>(null);
  const [checksHistory, setChecksHistory] = useState<MonitorCheck[]>([]);
  const [incidentsHistory, setIncidentsHistory] = useState<Incident[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  async function openDetail(monitor: Monitor) {
    setViewMonitor(monitor);
    setDetailLoading(true);

    try {
      const [{ data: checks, errors: checkErrors }, { data: incidents, errors: incidentErrors }] =
        await Promise.all([
          client.models.MonitorCheck.list({
            filter: { monitorId: { eq: monitor.id } },
            limit: 200,
          }),
          client.models.Incident.list({
            filter: { monitorId: { eq: monitor.id } },
            limit: 50,
          }),
        ]);

      if (checkErrors?.length) throw new Error(checkErrors[0].message);
      if (incidentErrors?.length) throw new Error(incidentErrors[0].message);

      setChecksHistory(
        [...checks].sort(
          (a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime()
        )
      );
      setIncidentsHistory(
        [...incidents].sort(
          (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        )
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not load monitor history."
      );
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setViewMonitor(null);
    setChecksHistory([]);
    setIncidentsHistory([]);
  }

  /* ----------------------------------------------------------
     LOAD MONITORS
     ---------------------------------------------------------- */


  const loadMonitors = useCallback(async () => {
    setLoadingMonitors(true);

    try {
      const { data, errors } = await client.models.Monitor.list();

      if (errors?.length) {
        throw new Error(errors[0].message);
      }

      setMonitors(data);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load monitors."
      );
    } finally {
      setLoadingMonitors(false);
    }
  }, []);

  /* ----------------------------------------------------------
     AUTH INITIALIZATION
     ---------------------------------------------------------- */

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        /*
         * Cognito is the source of truth for authentication.
         * Do not call claimSession() here. The previous implementation
         * could reject a valid Cognito login and redirect back to /login.
         */
        await getCurrentUser();

      } catch (error) {
        if (!mounted) return;

        console.error("No valid Cognito session:", error);
        setUser(false);
        window.location.replace("/login");
        return;
      }

      if (!mounted) return;

      setUser(true);

      /*
       * These calls load dashboard data only. Their own error handlers
       * display data/API problems without destroying the Cognito session.
       */
      await loadMonitors();

      if (mounted) {
        setAuthReady(true);
      }
    }

    void initializeAuth();

    return () => {
      mounted = false;
    };
  }, [loadMonitors]);

  /* ----------------------------------------------------------
     AUTH SESSION
     ---------------------------------------------------------- */

  /*
   * Cognito owns the browser authentication session.
   * The old claimSession()/validateSession() polling loop has deliberately
   * been removed. It was causing the successful login -> / -> /login loop.
   * Dashboard data continues to refresh automatically below.
   */

  /* ----------------------------------------------------------
     AUTO REFRESH
     ---------------------------------------------------------- */

  useEffect(() => {
    if (!user || !autoRefresh) return;

    const timer = window.setInterval(() => {
      void loadMonitors();
    }, 15000);

    return () => {
      window.clearInterval(timer);
    };
  }, [user, autoRefresh, loadMonitors]);

  /* ----------------------------------------------------------
     CLOCK
     ---------------------------------------------------------- */

  useEffect(() => {
    setClock(new Date());

    const timer = window.setInterval(() => {
      setClock(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  /* ----------------------------------------------------------
     THEME
     ---------------------------------------------------------- */

  useEffect(() => {
    const saved = window.localStorage.getItem("pulsecheck-theme");

    const nextTheme: Theme =
      saved === "light" || saved === "dark" ? saved : "dark";

    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  }, []);

  function changeTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    window.localStorage.setItem("pulsecheck-theme", nextTheme);
  }

  /* ----------------------------------------------------------
     NOC VIEW MODE
     ---------------------------------------------------------- */

  function toggleFullscreen() {
    setFullscreen((current) => !current);
    setShowAdd(false);
    setEditMonitor(null);
    setShowSettings(false);
    setShowProfileMenu(false);
    setViewMonitor(null);
  }

  useEffect(() => {
    if (!fullscreen) return;

    function handleViewModeKey(event: KeyboardEvent) {
      if (event.key === "Escape") setFullscreen(false);
    }

    window.addEventListener("keydown", handleViewModeKey);
    return () => window.removeEventListener("keydown", handleViewModeKey);
  }, [fullscreen]);

  /* ----------------------------------------------------------
     LOGOUT
     ---------------------------------------------------------- */

  async function logout() {
    try {
      await signOut();
    } finally {
      window.sessionStorage.removeItem(
        "pulsecheck-session-id",
      );
      setUser(false);
      setMonitors([]);
      setShowProfileMenu(false);
      window.location.replace("/login");
    }
  }

  /* ----------------------------------------------------------
     ADD MONITOR
     ---------------------------------------------------------- */

  async function addMonitor() {

    const cleanName = name.trim();
    const cleanUrl = url.trim();

    if (!cleanName) {
      setMessage("Enter a monitor name.");
      return;
    }

    if (!cleanUrl) {
      setMessage("Enter a monitor URL.");
      return;
    }

    try {
      const parsed = new URL(cleanUrl);

      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error(
          "Only HTTP and HTTPS URLs are supported."
        );
      }

      setLoading(true);
      setMessage("");

      const normalizedType = monitorType.toUpperCase();
      if (!["HTTP", "API", "TCP", "DNS", "SSL"].includes(normalizedType)) {
        throw new Error("Select a supported monitor type.");
      }

      if (["HTTP", "API"].includes(normalizedType) && !cleanUrl.match(/^https?:\/\//i)) {
        throw new Error("HTTP and API monitors require an HTTP or HTTPS URL.");
      }

      if (normalizedType === "TCP" && (!port || Number(port) < 1 || Number(port) > 65535)) {
        throw new Error("TCP monitors require a valid port from 1 to 65535.");
      }

      const { errors } = await client.models.Monitor.create({
        name: cleanName,
        url: cleanUrl,
        monitorType: normalizedType,
        method: method.toUpperCase(),
        expectedStatusCode: Number(expectedStatusCode) || 200,
        expectedBodyText: expectedBodyText.trim() || undefined,
        timeoutSeconds: Math.min(60, Math.max(2, Number(timeoutSeconds) || 10)),
        port: port ? Number(port) : undefined,
        dnsRecordType: dnsRecordType.toUpperCase(),
        dnsExpectedValue: dnsExpectedValue.trim() || undefined,
        sslExpiryWarningDays: Math.max(1, Number(sslExpiryWarningDays) || 14),
        requestHeadersJson: requestHeadersJson.trim() || undefined,
        requestBody: requestBody || undefined,
        status: "UNKNOWN",
        enabled: true,
        checkInterval: Number(checkInterval),
      });

      if (errors?.length) {
        throw new Error(errors[0].message);
      }

      setName("");
      setUrl("");
      setCheckInterval("5");
      setMonitorType("HTTP");
      setMethod("GET");
      setExpectedStatusCode("200");
      setExpectedBodyText("");
      setTimeoutSeconds("10");
      setPort("");
      setDnsRecordType("A");
      setDnsExpectedValue("");
      setSslExpiryWarningDays("14");
      setRequestHeadersJson("");
      setRequestBody("");

      setShowAdd(false);

      setMessage(
        "Monitor added. The first status will appear after the next check."
      );

      await loadMonitors();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Enter a valid URL."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ----------------------------------------------------------
     DELETE
     ---------------------------------------------------------- */

  async function deleteMonitor(id: string) {

    const confirmed = window.confirm(
      "Delete this monitor permanently?"
    );

    if (!confirmed) return;

    try {
      const { errors } = await client.models.Monitor.delete({
        id,
      });

      if (errors?.length) {
        throw new Error(errors[0].message);
      }

      if (viewMonitor?.id === id) closeDetail();

      await loadMonitors();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not delete monitor."
      );
    }
  }

  /* ----------------------------------------------------------
     ENABLE / DISABLE
     ---------------------------------------------------------- */

  async function toggleMonitor(monitor: Monitor) {

    try {
      const { errors } = await client.models.Monitor.update({
        id: monitor.id,
        enabled: !monitor.enabled,
      });

      if (errors?.length) {
        throw new Error(errors[0].message);
      }

      await loadMonitors();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not update monitor."
      );
    }
  }

  /* ----------------------------------------------------------
     EDIT MONITOR
     ---------------------------------------------------------- */

  function beginEditMonitor(monitor: Monitor) {
    setEditMonitor(monitor);
    setEditName(monitor.name);
    setEditUrl(monitor.url);
    setEditCheckInterval(String(monitor.checkInterval ?? 5));
    setEditMonitorType(String(monitor.monitorType ?? "HTTP"));
    setEditMethod(String(monitor.method ?? "GET"));
    setEditExpectedStatusCode(String(monitor.expectedStatusCode ?? 200));
    setEditExpectedBodyText(monitor.expectedBodyText ?? "");
    setEditTimeoutSeconds(String(monitor.timeoutSeconds ?? 10));
    setEditPort(monitor.port == null ? "" : String(monitor.port));
    setEditDnsRecordType(String(monitor.dnsRecordType ?? "A"));
    setEditDnsExpectedValue(monitor.dnsExpectedValue ?? "");
    setEditSslExpiryWarningDays(String(monitor.sslExpiryWarningDays ?? 14));
    setEditRequestHeadersJson(monitor.requestHeadersJson ?? "");
    setEditRequestBody(monitor.requestBody ?? "");
    setMessage("");
  }

  async function saveEditMonitor() {
    if (!editMonitor) return;


    const cleanName = editName.trim();
    const cleanUrl = editUrl.trim();

    if (!cleanName) {
      setMessage("Enter a monitor name.");
      return;
    }

    if (!cleanUrl) {
      setMessage("Enter a monitor URL.");
      return;
    }

    try {
      const parsed = new URL(cleanUrl);

      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Only HTTP and HTTPS URLs are supported.");
      }

      setLoading(true);
      setMessage("");

      const normalizedType = editMonitorType.toUpperCase();
      if (!["HTTP", "API", "TCP", "DNS", "SSL"].includes(normalizedType)) {
        throw new Error("Select a supported monitor type.");
      }

      if (["HTTP", "API"].includes(normalizedType) && !cleanUrl.match(/^https?:\/\//i)) {
        throw new Error("HTTP and API monitors require an HTTP or HTTPS URL.");
      }

      if (normalizedType === "TCP" && (!editPort || Number(editPort) < 1 || Number(editPort) > 65535)) {
        throw new Error("TCP monitors require a valid port from 1 to 65535.");
      }

      const { errors } = await client.models.Monitor.update({
        id: editMonitor.id,
        name: cleanName,
        url: cleanUrl,
        monitorType: normalizedType,
        method: editMethod.toUpperCase(),
        expectedStatusCode: Number(editExpectedStatusCode) || 200,
        expectedBodyText: editExpectedBodyText.trim() || undefined,
        timeoutSeconds: Math.min(60, Math.max(2, Number(editTimeoutSeconds) || 10)),
        port: editPort ? Number(editPort) : undefined,
        dnsRecordType: editDnsRecordType.toUpperCase(),
        dnsExpectedValue: editDnsExpectedValue.trim() || undefined,
        sslExpiryWarningDays: Math.max(1, Number(editSslExpiryWarningDays) || 14),
        requestHeadersJson: editRequestHeadersJson.trim() || undefined,
        requestBody: editRequestBody || undefined,
        checkInterval: Number(editCheckInterval),
      });

      if (errors?.length) {
        throw new Error(errors[0].message);
      }

      setEditMonitor(null);
      await loadMonitors();

      if (viewMonitor?.id === editMonitor.id) {
        const updated = {
          ...viewMonitor,
          name: cleanName,
          url: cleanUrl,
          checkInterval: Number(editCheckInterval),
          monitorType: normalizedType,
          method: editMethod.toUpperCase(),
          expectedStatusCode: Number(editExpectedStatusCode) || 200,
          expectedBodyText: editExpectedBodyText.trim() || undefined,
          timeoutSeconds: Math.min(60, Math.max(2, Number(editTimeoutSeconds) || 10)),
          port: editPort ? Number(editPort) : undefined,
          dnsRecordType: editDnsRecordType.toUpperCase(),
          dnsExpectedValue: editDnsExpectedValue.trim() || undefined,
          sslExpiryWarningDays: Math.max(1, Number(editSslExpiryWarningDays) || 14),
          requestHeadersJson: editRequestHeadersJson.trim() || undefined,
          requestBody: editRequestBody || undefined,
        };

        setViewMonitor(updated);
      }

      setMessage("Monitor updated successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not update monitor.",
      );
    } finally {
      setLoading(false);
    }
  }

  /* ----------------------------------------------------------
     DUPLICATE MONITOR
     ---------------------------------------------------------- */

  async function duplicateMonitor(monitor: Monitor) {

    try {
      setLoading(true);
      setMessage("");

      const { errors } = await client.models.Monitor.create({
        name: `${monitor.name} (Copy)`,
        url: monitor.url,
        monitorType: monitor.monitorType ?? "HTTP",
        method: monitor.method ?? "GET",
        expectedStatusCode: monitor.expectedStatusCode ?? 200,
        expectedBodyText: monitor.expectedBodyText,
        timeoutSeconds: monitor.timeoutSeconds ?? 10,
        port: monitor.port,
        dnsRecordType: monitor.dnsRecordType ?? "A",
        dnsExpectedValue: monitor.dnsExpectedValue,
        sslExpiryWarningDays: monitor.sslExpiryWarningDays ?? 14,
        requestHeadersJson: monitor.requestHeadersJson,
        requestBody: monitor.requestBody,
        status: "UNKNOWN",
        enabled: true,
        checkInterval: Number(monitor.checkInterval ?? 5),
      });

      if (errors?.length) {
        throw new Error(errors[0].message);
      }

      setMessage("Monitor duplicated successfully.");
      await loadMonitors();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not duplicate monitor.",
      );
    } finally {
      setLoading(false);
    }
  }

  /* ----------------------------------------------------------
     COPY URL
     ---------------------------------------------------------- */

  async function copyMonitorUrl(monitor: Monitor) {
    try {
      await navigator.clipboard.writeText(monitor.url);
      setMessage("Monitor URL copied to clipboard.");
    } catch {
      setMessage("Could not copy the monitor URL.");
    }
  }

  /* ----------------------------------------------------------
     EXPORT MONITORS
     ---------------------------------------------------------- */

  function exportMonitors() {
    if (monitors.length === 0) {
      setMessage("There are no monitors to export.");
      return;
    }

    const header = [
      "Name",
      "URL",
      "Status",
      "Enabled",
      "Response Time (ms)",
      "Last Checked",
      "Check Interval (minutes)",
      "Created At",
      "Updated At",
    ];

    const rows = monitors.map((monitor) => [
      monitor.name,
      monitor.url,
      monitor.status,
      monitor.enabled ? "Yes" : "No",
      monitor.responseTime ?? "",
      monitor.lastChecked ?? "",
      monitor.checkInterval ?? "",
      monitor.createdAt ?? "",
      monitor.updatedAt ?? "",
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? "");
            return `"${text.replace(/"/g, '""')}"`;
          })
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = `pulsecheck-monitors-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);

    setMessage("Monitor report exported.");
  }

  /* ----------------------------------------------------------
     STATISTICS
     ---------------------------------------------------------- */

  const total = monitors.length;

  const healthy = useMemo(
    () =>
      monitors.filter(
        (monitor) =>
          monitor.enabled && monitor.status === "UP"
      ).length,
    [monitors]
  );

  const down = useMemo(
    () =>
      monitors.filter(
        (monitor) =>
          monitor.enabled && monitor.status === "DOWN"
      ).length,
    [monitors]
  );

  const unknown = useMemo(
    () =>
      monitors.filter(
        (monitor) =>
          monitor.enabled && monitor.status === "UNKNOWN"
      ).length,
    [monitors]
  );

  const disabled = useMemo(
    () =>
      monitors.filter(
        (monitor) => !monitor.enabled
      ).length,
    [monitors]
  );

  const activeTotal = healthy + down + unknown;

  const availability = useMemo(() => {
    if (activeTotal === 0) return 100;

    return Math.round(
      (healthy / activeTotal) * 1000
    ) / 10;
  }, [activeTotal, healthy]);

  const averageResponse = useMemo(() => {
    const values = monitors
      .filter(
        (monitor) =>
          monitor.enabled &&
          monitor.status === "UP" &&
          monitor.responseTime != null
      )
      .map((monitor) => monitor.responseTime as number);

    if (values.length === 0) return null;

    return Math.round(
      values.reduce((sum, value) => sum + value, 0) /
        values.length
    );
  }, [monitors]);

  /* ----------------------------------------------------------
     FILTERING
     ---------------------------------------------------------- */

  const filteredMonitors = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...monitors]
      .filter((monitor) => {
        if (!normalizedSearch) return true;

        return (
          monitor.name
            .toLowerCase()
            .includes(normalizedSearch) ||
          monitor.url
            .toLowerCase()
            .includes(normalizedSearch)
        );
      })
      .filter((monitor) => {
        if (filter === "all") return true;
        if (filter === "up")
          return monitor.enabled && monitor.status === "UP";
        if (filter === "down")
          return monitor.enabled && monitor.status === "DOWN";
        if (filter === "unknown")
          return monitor.enabled && monitor.status === "UNKNOWN";
        if (filter === "disabled")
          return !monitor.enabled;

        return true;
      })
      .sort((a, b) => {
        if (sortMode === "name") {
          return a.name.localeCompare(b.name);
        }

        if (sortMode === "response") {
          return (
            (a.responseTime ?? Number.MAX_SAFE_INTEGER) -
            (b.responseTime ?? Number.MAX_SAFE_INTEGER)
          );
        }

        if (sortMode === "recent") {
          return (
            new Date(b.lastChecked ?? b.updatedAt ?? b.createdAt ?? 0).getTime() -
            new Date(a.lastChecked ?? a.updatedAt ?? a.createdAt ?? 0).getTime()
          );
        }

        return statusRank(a) - statusRank(b);
      });
  }, [monitors, search, filter, sortMode]);

  /* ----------------------------------------------------------
     OVERALL STATE
     ---------------------------------------------------------- */

  const overall =
    down > 0
      ? "down"
      : activeTotal === 0
        ? "idle"
        : "operational";

  const overallTitle =
    overall === "down"
      ? `${down} ${
          down === 1 ? "service" : "services"
        } need attention`
      : overall === "idle"
        ? "No active monitors"
        : "All systems operational";

  /* ----------------------------------------------------------
     OPTIONS
     ---------------------------------------------------------- */

  const monitorTypeOptions: SelectOption[] = [
    { value: "HTTP", label: "HTTP / HTTPS", description: "Website availability" },
    { value: "API", label: "API", description: "Endpoint and response validation" },
    { value: "TCP", label: "TCP / Port", description: "Network service reachability" },
    { value: "DNS", label: "DNS", description: "DNS resolution monitoring" },
    { value: "SSL", label: "SSL / TLS", description: "Certificate and expiry monitoring" },
  ];

  const methodOptions: SelectOption[] = [
    { value: "GET", label: "GET", description: "Read endpoint" },
    { value: "HEAD", label: "HEAD", description: "Headers only" },
    { value: "POST", label: "POST", description: "API request" },
    { value: "PUT", label: "PUT", description: "API update request" },
  ];

  const dnsRecordOptions: SelectOption[] = [
    { value: "A", label: "A", description: "IPv4 address" },
    { value: "AAAA", label: "AAAA", description: "IPv6 address" },
    { value: "CNAME", label: "CNAME", description: "Canonical name" },
    { value: "MX", label: "MX", description: "Mail exchange" },
    { value: "TXT", label: "TXT", description: "Text record" },
  ];

  const intervalOptions: SelectOption[] = [
    {
      value: "1",
      label: "Every 1 minute",
      description: "Fast monitoring",
    },
    {
      value: "5",
      label: "Every 5 minutes",
      description: "Recommended",
    },
    {
      value: "10",
      label: "Every 10 minutes",
      description: "Balanced monitoring",
    },
    {
      value: "15",
      label: "Every 15 minutes",
      description: "Light monitoring",
    },
    {
      value: "30",
      label: "Every 30 minutes",
      description: "Low frequency",
    },
  ];

  /* ============================================================
     AUTH GUARD
     ============================================================ */

  if (!authReady) {
    return (
      <main className={`${inter.className} min-h-screen bg-[var(--pc-bg)] text-[var(--pc-text)]`}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-5">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] shadow-[var(--pc-shadow)]">
              <span className="absolute h-3 w-3 rounded-full bg-[#4C8DFF] shadow-[0_0_20px_rgba(76,141,255,0.65)]" />
              <span className="absolute h-7 w-7 animate-spin rounded-full border border-transparent border-t-[#4C8DFF]" />
            </div>
            <p className="text-sm font-medium text-[var(--pc-muted)]">Loading PulseCheck…</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) return null;

  const overallTone =
    overall === "operational"
      ? "healthy"
      : overall === "down"
        ? "critical"
        : "idle";

  const healthPercent =
    activeTotal > 0
      ? Math.round((healthy / activeTotal) * 100)
      : 100;

  const responseLabel =
    averageResponse == null
      ? "No samples yet"
      : averageResponse < 200
        ? "Excellent latency"
        : averageResponse < 500
          ? "Healthy latency"
          : averageResponse < 1000
            ? "Elevated latency"
            : "High latency";

  const statusItems = [
    { key: "up" as const, label: "Healthy", value: healthy, tone: "success" },
    { key: "down" as const, label: "Down", value: down, tone: "danger" },
    { key: "unknown" as const, label: "Unknown", value: unknown, tone: "warning" },
    { key: "disabled" as const, label: "Disabled", value: disabled, tone: "neutral" },
  ];

  return (
    <main
      className={`${inter.className} min-h-screen bg-[var(--pc-bg)] text-[var(--pc-text)] transition-colors duration-200`}
    >
      {/* ========================================================
          HEADER
          ======================================================== */}

      <header className="sticky top-0 z-[80] border-b border-[var(--pc-border)] bg-[var(--pc-bg)]/94 backdrop-blur-xl">
        <div className="flex min-h-[74px] w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#4C8DFF]/25 bg-[#4C8DFF]/10 text-[#4C8DFF] shadow-[0_5px_20px_rgba(76,141,255,0.08)]">
              <Icon name="activity" size={20} strokeWidth={2} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <p className="truncate text-[16px] font-bold tracking-[-0.02em]">PulseCheck</p>
                <span className="hidden rounded-md border border-[#34D399]/20 bg-[#34D399]/8 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#34D399] sm:inline">
                  Live
                </span>
              </div>

              <div className={`${mono.className} mt-0.5 flex items-center gap-2 text-[10px] text-[var(--pc-muted)]`}>
                <span>
                  {clock
                    ? clock.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })
                    : "--:--:--"}
                </span>
                <span className="opacity-40">•</span>
                <span>Asia/Kolkata</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!fullscreen && <button
              type="button"
              onClick={() => void loadMonitors()}
              disabled={loadingMonitors}
              className="hidden h-10 items-center gap-2 rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface)] px-3.5 text-sm font-medium text-[var(--pc-muted)] transition-all hover:border-[var(--pc-border-hover)] hover:text-[var(--pc-text)] disabled:opacity-50 sm:flex"
            >
              <Icon name="refresh" size={16} />
              <span>{loadingMonitors ? "Refreshing" : "Refresh"}</span>
            </button>}

            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface)] text-[var(--pc-muted)] transition-all hover:border-[var(--pc-border-hover)] hover:text-[var(--pc-text)] md:flex"
              title={fullscreen ? "Exit NOC View" : "NOC View"}
            >
              <Icon name="expand" size={17} />
            </button>

            {!fullscreen && <button
              type="button"
              onClick={() => changeTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface)] text-[var(--pc-muted)] transition-all hover:border-[var(--pc-border-hover)] hover:text-[var(--pc-text)]"
              title="Change theme"
            >
              {theme === "dark" ? <Icon name="sun" size={17} /> : <Icon name="moon" size={17} />}
            </button>}

            {!fullscreen && <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileMenu((current) => !current)}
                className="flex h-10 items-center gap-2 rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface)] px-2.5 text-sm font-medium transition-all hover:border-[var(--pc-border-hover)]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4C8DFF]/12 text-[11px] font-bold text-[#4C8DFF]">U</span>
                <span className="hidden max-w-[150px] truncate text-[var(--pc-text)] lg:block">Account</span>
                <span className="hidden text-[var(--pc-muted)] sm:block"><Icon name="chevron" size={14} /></span>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-[150] w-52 overflow-hidden rounded-xl border border-[var(--pc-border)] bg-[var(--pc-dropdown)] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettings(true);
                      setShowProfileMenu(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[var(--pc-text)] hover:bg-[var(--pc-hover)]"
                  >
                    <Icon name="settings" size={16} />
                    Settings
                  </button>
                  <div className="my-1 border-t border-[var(--pc-border)]" />
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#FB5B5B] hover:bg-[#FB5B5B]/8"
                  >
                    <Icon name="arrow" size={16} />
                    Sign out
                  </button>
                </div>
              )}
            </div>}
          </div>
        </div>
      </header>

      <div className="w-full px-4 pb-16 pt-6 sm:px-6 lg:px-8 xl:px-10 2xl:px-14">

        {/* COMMAND BAR */}
        {!fullscreen && <section className="mb-5 rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-5 shadow-[var(--pc-shadow)] xl:p-6">
          <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-end 2xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                  overallTone === "healthy"
                    ? "border-[#34D399]/20 bg-[#34D399]/8 text-[#34D399]"
                    : overallTone === "critical"
                      ? "border-[#FB5B5B]/20 bg-[#FB5B5B]/8 text-[#FB8585]"
                      : "border-[var(--pc-border)] bg-[var(--pc-input)] text-[var(--pc-muted)]"
                }`}>
                  Monitoring active
                </span>
                <span className="text-[11px] text-[var(--pc-muted)]">Personal monitoring workspace</span>
              </div>

              <h1 className="mt-3 text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
                {overallTitle}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--pc-muted)]">
                {down > 0
                  ? `${down} monitored service${down === 1 ? " requires" : "s require"} attention. Review the affected service cards and recent checks below.`
                  : activeTotal > 0
                    ? "Your services are being checked continuously. Use the controls below to operate monitors without leaving the command center."
                    : "Create your first monitor to start collecting availability and response-time data."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setMessage("");
                setShowAdd(true);
              }}
              disabled={false}
              className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#4C8DFF] px-5 text-sm font-bold text-white shadow-[0_8px_25px_rgba(76,141,255,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#3E7CE8] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Icon name="plus" size={17} strokeWidth={2.2} />
              Add monitor
            </button>
          </div>
        </section>}

        {!fullscreen && message && (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface)] px-4 py-3 text-sm text-[var(--pc-muted)] shadow-sm">
            <span>{message}</span>
            <button type="button" onClick={() => setMessage("")} className="shrink-0 text-[var(--pc-muted)] hover:text-[var(--pc-text)]">
              <Icon name="x" size={15} />
            </button>
          </div>
        )}

        {/* KPI GRID */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {[
            { label: "Total monitors", value: total, sub: "Registered", tone: "neutral", icon: "monitor" as const },
            { label: "Healthy", value: healthy, sub: activeTotal ? `${healthPercent}% of active` : "No active checks", tone: "success", icon: "check" as const },
            { label: "Down", value: down, sub: down ? "Needs attention" : "No failures", tone: "danger", icon: "bell" as const },
            { label: "Unknown", value: unknown, sub: unknown ? "Waiting for checks" : "No unknowns", tone: "warning", icon: "clock" as const },
            { label: "Disabled", value: disabled, sub: disabled ? "Paused by you" : "All enabled", tone: "neutral", icon: "pause" as const },
            { label: "Availability", value: `${availability}%`, sub: responseLabel, tone: "accent", icon: "chart" as const },
          ].map((item) => (
            <article key={item.label} className="min-w-0 rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-4 shadow-[var(--pc-shadow)]">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-[11px] font-semibold uppercase tracking-[0.09em] text-[var(--pc-muted)]">{item.label}</span>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  item.tone === "success" ? "bg-[#34D399]/10 text-[#34D399]" :
                  item.tone === "danger" ? "bg-[#FB5B5B]/10 text-[#FB5B5B]" :
                  item.tone === "warning" ? "bg-[#E8B94A]/10 text-[#E8B94A]" :
                  item.tone === "accent" ? "bg-[#4C8DFF]/10 text-[#4C8DFF]" :
                  "bg-[var(--pc-icon-bg)] text-[var(--pc-muted)]"
                }`}>
                  <Icon name={item.icon} size={15} />
                </span>
              </div>
              <strong className={`${mono.className} mt-4 block text-2xl font-semibold tracking-[-0.04em] ${
                item.tone === "success" ? "text-[#34D399]" :
                item.tone === "danger" ? "text-[#FB5B5B]" :
                item.tone === "warning" ? "text-[#E8B94A]" :
                item.tone === "accent" ? "text-[#4C8DFF]" :
                "text-[var(--pc-text)]"
              }`}>{item.value}</strong>
              <p className="mt-1 truncate text-[11px] text-[var(--pc-muted)]">{item.sub}</p>
            </article>
          ))}
        </section>

        {/* OPERATIONS OVERVIEW */}
        {!fullscreen && <section className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
          <article className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-5 shadow-[var(--pc-shadow)] xl:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[var(--pc-muted)]">Service health overview</p>
                <h2 className="mt-1.5 text-lg font-bold tracking-[-0.02em]">Reliability pulse</h2>
              </div>
              <div className="text-left sm:text-right">
                <p className={`${mono.className} text-2xl font-semibold text-[#4C8DFF]`}>{availability}%</p>
                <p className="text-[11px] text-[var(--pc-muted)]">Current active availability</p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="relative mx-auto flex h-48 w-48 items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ background: `conic-gradient(#34D399 ${healthPercent}%, #202938 ${healthPercent}% 100%)` }}
                />
                <div className="absolute inset-[11px] rounded-full bg-[var(--pc-surface)]" />
                <div className="relative text-center">
                  <strong className={`${mono.className} block text-4xl font-semibold tracking-[-0.06em]`}>{healthPercent}%</strong>
                  <span className="mt-1 block text-[11px] text-[var(--pc-muted)]">healthy services</span>
                </div>
              </div>

              <div className="space-y-4">
                {statusItems.map((item) => {
                  const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                  return (
                    <div key={item.key}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${
                            item.tone === "success" ? "bg-[#34D399]" :
                            item.tone === "danger" ? "bg-[#FB5B5B]" :
                            item.tone === "warning" ? "bg-[#E8B94A]" :
                            "bg-[var(--pc-muted)]"
                          }`} />
                          <span className="text-xs font-semibold">{item.label}</span>
                        </div>
                        <span className={`${mono.className} text-xs text-[var(--pc-muted)]`}>{item.value} · {percentage}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[var(--pc-input)]">
                        <div
                          className={`h-full rounded-full ${
                            item.tone === "success" ? "bg-[#34D399]" :
                            item.tone === "danger" ? "bg-[#FB5B5B]" :
                            item.tone === "warning" ? "bg-[#E8B94A]" :
                            "bg-[var(--pc-muted)]"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[var(--pc-border)] pt-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-[var(--pc-input)] p-3">
                    <span className="block text-[10px] uppercase tracking-[0.08em] text-[var(--pc-muted)]">Average response</span>
                    <strong className={`${mono.className} mt-1 block text-sm`}>{averageResponse == null ? "—" : `${averageResponse} ms`}</strong>
                  </div>
                  <div className="rounded-xl bg-[var(--pc-input)] p-3">
                    <span className="block text-[10px] uppercase tracking-[0.08em] text-[var(--pc-muted)]">Check cycle</span>
                    <strong className={`${mono.className} mt-1 block text-sm`}>15 sec refresh</strong>
                  </div>
                  <div className="rounded-xl bg-[var(--pc-input)] p-3 sm:col-span-1 col-span-2">
                    <span className="block text-[10px] uppercase tracking-[0.08em] text-[var(--pc-muted)]">Platform</span>
                    <strong className="mt-1 block text-sm">Operational</strong>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-5 shadow-[var(--pc-shadow)] xl:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[var(--pc-muted)]">Operations</p>
            <h2 className="mt-1.5 text-lg font-bold tracking-[-0.02em]">Quick control</h2>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setShowAdd(true);
                }}
                disabled={false}
                className="flex w-full items-center justify-between rounded-xl border border-[#4C8DFF]/20 bg-[#4C8DFF]/8 px-4 py-3 text-left transition-all hover:border-[#4C8DFF]/40 hover:bg-[#4C8DFF]/12 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4C8DFF]/10 text-[#4C8DFF]"><Icon name="plus" size={16} /></span>
                  <span><strong className="block text-sm">Create monitor</strong><span className="block text-[11px] text-[var(--pc-muted)]">Add a website or API endpoint</span></span>
                </span>
                <Icon name="arrow" size={15} />
              </button>

              <button
                type="button"
                onClick={() => void loadMonitors()}
                disabled={loadingMonitors}
                className="flex w-full items-center justify-between rounded-xl border border-[var(--pc-border)] bg-[var(--pc-input)] px-4 py-3 text-left transition-all hover:border-[var(--pc-border-hover)]"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--pc-icon-bg)] text-[var(--pc-muted)]"><Icon name="refresh" size={16} /></span>
                  <span><strong className="block text-sm">Refresh now</strong><span className="block text-[11px] text-[var(--pc-muted)]">Pull the latest monitor state</span></span>
                </span>
                <span className={`${mono.className} text-[11px] text-[var(--pc-muted)]`}>{loadingMonitors ? "Working" : "Ready"}</span>
              </button>

              <button
                type="button"
                onClick={exportMonitors}
                className="flex w-full items-center justify-between rounded-xl border border-[var(--pc-border)] bg-[var(--pc-input)] px-4 py-3 text-left transition-all hover:border-[var(--pc-border-hover)]"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--pc-icon-bg)] text-[var(--pc-muted)]"><Icon name="chart" size={16} /></span>
                  <span><strong className="block text-sm">Export report</strong><span className="block text-[11px] text-[var(--pc-muted)]">Download monitor data as CSV</span></span>
                </span>
                <Icon name="arrow" size={15} />
              </button>
            </div>

            <div className="mt-5 border-t border-[var(--pc-border)] pt-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-[var(--pc-muted)]">Auto refresh</span>
                <button
                  type="button"
                  onClick={() => setAutoRefresh((current) => !current)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${autoRefresh ? "bg-[#34D399]/10 text-[#34D399]" : "bg-[var(--pc-input)] text-[var(--pc-muted)]"}`}
                >
                  {autoRefresh ? "ON · 15s" : "OFF"}
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-[11px]">
                <span className="text-[var(--pc-muted)]">Last dashboard refresh</span>
                <span className={`${mono.className} text-[var(--pc-text)]`}>{clock ? clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
              </div>
            </div>
          </article>
        </section>} 

        {/* MONITORS */}
        <section className="mt-6">
          {!fullscreen && <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[var(--pc-muted)]">Service inventory</p>
              <h2 className="mt-1.5 text-xl font-bold tracking-[-0.025em]">Monitors</h2>
              <p className="mt-1 text-sm text-[var(--pc-muted)]">Manage health, response time, availability and monitor lifecycle from one workspace.</p>
            </div>


          </div>} 

          <section className="mt-4 overflow-hidden rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] shadow-[var(--pc-shadow)]">
            <div className="hidden grid-cols-[minmax(250px,1.8fr)_120px_130px_140px_minmax(260px,1fr)] gap-4 border-b border-[var(--pc-border)] bg-[var(--pc-surface-soft)] px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--pc-muted)] lg:grid">
              <span>Service</span>
              <span>Status</span>
              <span>Response</span>
              <span>Last checked</span>
              <span className="text-right">Actions</span>
            </div>

            {filteredMonitors.length === 0 ? (
              <div className="flex min-h-[310px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-input)] text-[var(--pc-muted)]"><Icon name="monitor" size={24} /></div>
                <h3 className="mt-4 text-base font-bold">{monitors.length === 0 ? "No monitors yet" : "No matching monitors"}</h3>
                <p className="mt-1.5 max-w-md text-sm leading-6 text-[var(--pc-muted)]">
                  {monitors.length === 0 ? "Add your first website or API endpoint and PulseCheck will start tracking it." : "Try changing the search or status filter."}
                </p>
                {monitors.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAdd(true)}
                    disabled={false}
                    className="mt-5 flex items-center gap-2 rounded-xl bg-[#4C8DFF] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#3E7CE8] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Icon name="plus" size={16} />
                    Add your first monitor
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-[var(--pc-border)]">
                {filteredMonitors.map((monitor) => {
                  const status = getStatus(monitor);
                  const statusColor = status === "up" ? "#34D399" : status === "down" ? "#FB5B5B" : status === "unknown" ? "#E8B94A" : "#7C8699";
                  return (
                    <article key={monitor.id} className="group px-4 py-4 transition-colors hover:bg-[var(--pc-hover)]/45 sm:px-5 sm:py-5">
                      <div className="grid gap-4 lg:grid-cols-[minmax(250px,1.8fr)_120px_130px_140px_minmax(260px,1fr)] lg:items-center">
                        <div className="min-w-0">
                          <div className="flex items-start gap-3">
                            <span className="mt-1.5 flex h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: statusColor, boxShadow: status === "up" ? "0 0 12px rgba(52,211,153,.45)" : status === "down" ? "0 0 12px rgba(251,91,91,.35)" : "none" }} />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                {fullscreen ? (
                                  <span className="truncate text-left text-sm font-bold text-[var(--pc-text)]">{monitor.name}</span>
                                ) : (
                                  <button type="button" onClick={() => void openDetail(monitor)} className="truncate text-left text-sm font-bold text-[var(--pc-text)] transition-colors hover:text-[#4C8DFF]">{monitor.name}</button>
                                )}
                                <span className={`${mono.className} rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em]`} style={{ color: statusColor, backgroundColor: `${statusColor}12` }}>{status}</span>
                              </div>
                              <div className="mt-1 flex min-w-0 items-center gap-2">
                                <p className={`${mono.className} truncate text-[11px] text-[var(--pc-muted)]`}>{monitor.url}</p>
                                <a href={monitor.url} target="_blank" rel="noreferrer" className="shrink-0 text-[var(--pc-muted)] transition-colors hover:text-[#4C8DFF]" title="Open endpoint"><Icon name="external" size={12} /></a>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 lg:block">
                          <span className="text-[11px] text-[var(--pc-muted)] lg:hidden">Status</span>
                          <span className="inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-semibold" style={{ color: statusColor, backgroundColor: `${statusColor}12` }}>{status === "up" ? "Operational" : status === "down" ? "Down" : status === "disabled" ? "Disabled" : "Waiting"}</span>
                        </div>

                        <div className="flex items-center gap-2 lg:block">
                          <span className="text-[11px] text-[var(--pc-muted)] lg:hidden">Response</span>
                          <span className={`${mono.className} text-xs font-medium text-[var(--pc-text)]`}>{formatResponse(monitor.responseTime)}</span>
                        </div>

                        <div className="flex items-center gap-2 lg:block">
                          <span className="text-[11px] text-[var(--pc-muted)] lg:hidden">Checked</span>
                          <span className={`${mono.className} text-xs text-[var(--pc-muted)]`}>{formatChecked(monitor.lastChecked)}</span>
                        </div>

                        {!fullscreen && <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
                          <button type="button" onClick={() => void openDetail(monitor)} className="inline-flex h-9 min-w-[72px] items-center justify-center gap-1.5 rounded-lg border border-[var(--pc-border)] bg-[var(--pc-input)] px-3 text-[11px] font-semibold text-[var(--pc-text)] transition-all hover:border-[#4C8DFF]/40 hover:bg-[#4C8DFF]/8 hover:text-[#4C8DFF]"><Icon name="eye" size={13} />View</button>
                          <button type="button" onClick={() => beginEditMonitor(monitor)} className="inline-flex h-9 min-w-[72px] items-center justify-center gap-1.5 rounded-lg border border-[var(--pc-border)] bg-[var(--pc-input)] px-3 text-[11px] font-semibold text-[var(--pc-text)] transition-all hover:border-[#4C8DFF]/40 hover:bg-[#4C8DFF]/8 hover:text-[#4C8DFF]"><Icon name="settings" size={13} />Edit</button>
                          <button type="button" onClick={() => void toggleMonitor(monitor)} disabled={false} className="inline-flex h-9 min-w-[92px] items-center justify-center gap-1.5 rounded-lg border border-[var(--pc-border)] bg-[var(--pc-input)] px-3 text-[11px] font-semibold text-[var(--pc-text)] transition-all hover:border-[#4C8DFF]/40 hover:bg-[#4C8DFF]/8 hover:text-[#4C8DFF] disabled:cursor-not-allowed disabled:opacity-45"><Icon name={monitor.enabled ? "pause" : "play"} size={13} />{monitor.enabled ? "Disable" : "Enable"}</button>
                          <button type="button" onClick={() => void copyMonitorUrl(monitor)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--pc-border)] bg-[var(--pc-input)] text-[var(--pc-muted)] transition-all hover:border-[#4C8DFF]/40 hover:bg-[#4C8DFF]/8 hover:text-[#4C8DFF]" title="Copy URL"><Icon name="external" size={13} /></button>
                          <button type="button" onClick={() => void duplicateMonitor(monitor)} disabled={false} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--pc-border)] bg-[var(--pc-input)] text-[var(--pc-muted)] transition-all hover:border-[#4C8DFF]/40 hover:bg-[#4C8DFF]/8 hover:text-[#4C8DFF] disabled:cursor-not-allowed disabled:opacity-45" title="Duplicate monitor"><Icon name="plus" size={13} /></button>
                          <button type="button" onClick={() => void deleteMonitor(monitor.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-[var(--pc-muted)] transition-all hover:border-[#FB5B5B]/20 hover:bg-[#FB5B5B]/8 hover:text-[#FB5B5B]" title="Delete monitor"><Icon name="trash" size={14} /></button>
                        </div>} 
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>

        {/* INSIGHTS */}
        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-5 shadow-[var(--pc-shadow)]">
            <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4C8DFF]/10 text-[#4C8DFF]"><Icon name="zap" size={17} /></div><div><p className="text-xs font-bold">Average response</p><p className={`${mono.className} mt-1 text-sm text-[var(--pc-muted)]`}>{averageResponse != null ? `${averageResponse} ms` : "Waiting for data"}</p></div></div>
            <p className="mt-4 text-[11px] leading-5 text-[var(--pc-muted)]">{responseLabel}. Response time is calculated from the currently available healthy monitor samples.</p>
          </article>

          <article className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-5 shadow-[var(--pc-shadow)]">
            <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#34D399]/10 text-[#34D399]"><Icon name="shield" size={17} /></div><div><p className="text-xs font-bold">Monitoring coverage</p><p className={`${mono.className} mt-1 text-sm text-[var(--pc-muted)]`}>{activeTotal} active service{activeTotal === 1 ? "" : "s"}</p></div></div>
            <p className="mt-4 text-[11px] leading-5 text-[var(--pc-muted)]">Every active monitor contributes to the live service-health picture shown above.</p>
          </article>

          <article className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-5 shadow-[var(--pc-shadow)]">
            <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8B94A]/10 text-[#E8B94A]"><Icon name="clock" size={17} /></div><div><p className="text-xs font-bold">Auto refresh</p><p className={`${mono.className} mt-1 text-sm text-[var(--pc-muted)]`}>{autoRefresh ? "Every 15 seconds" : "Paused"}</p></div></div>
            <p className="mt-4 text-[11px] leading-5 text-[var(--pc-muted)]">Keep this enabled for a continuously updated command center.</p>
          </article>

          <article className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-5 shadow-[var(--pc-shadow)]">
            <div className="flex items-center gap-3"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${down ? "bg-[#FB5B5B]/10 text-[#FB5B5B]" : "bg-[#34D399]/10 text-[#34D399]"}`}><Icon name={down ? "bell" : "check"} size={17} /></div><div><p className="text-xs font-bold">Operational queue</p><p className={`${mono.className} mt-1 text-sm ${down ? "text-[#FB5B5B]" : "text-[#34D399]"}`}>{down ? `${down} issue${down === 1 ? "" : "s"}` : "All clear"}</p></div></div>
            <p className="mt-4 text-[11px] leading-5 text-[var(--pc-muted)]">{down ? "Open affected services to inspect response and incident history." : "No service currently requires attention."}</p>
          </article>
        </section>

        <footer className="mt-8 flex flex-col gap-2 border-t border-[var(--pc-border)] py-5 text-[10px] text-[var(--pc-muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>PulseCheck · personal uptime intelligence workspace</span>
          <span className={mono.className}>Live refresh · 15 seconds</span>
        </footer>
      </div>

      {/* ========================================================
          ADD MONITOR MODAL
          ======================================================== */}

      {showAdd && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/55 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowAdd(false);
            }
          }}
        >
          <div className="w-full max-w-[520px] overflow-visible rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between border-b border-[var(--pc-border)] px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-base font-bold">
                  Add monitor
                </h2>

                <p className="mt-1 text-xs text-[var(--pc-muted)]">
                  Start monitoring a website or API endpoint.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--pc-muted)] hover:bg-[var(--pc-hover)] hover:text-[var(--pc-text)]"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <label className="mb-2 block text-[12px] font-semibold text-[var(--pc-muted)]">
                  Monitor name
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--pc-muted)]">
                    <Icon name="monitor" size={17} />
                  </span>

                  <input
                    autoFocus
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    className="h-[54px] w-full rounded-xl border border-[var(--pc-border)] bg-[var(--pc-input)] pl-11 pr-4 text-sm font-medium outline-none transition-all placeholder:text-[var(--pc-muted)] focus:border-[#4C8DFF] focus:ring-4 focus:ring-[#4C8DFF]/10"
                    placeholder="e.g. Production API"
                  />
                </div>
              </div>

              <PremiumSelect
                label="Monitor type"
                value={monitorType}
                onChange={setMonitorType}
                options={monitorTypeOptions}
                icon={<Icon name="activity" size={16} />}
              />

              <div>
                <label className="mb-2 block text-[12px] font-semibold text-[var(--pc-muted)]">
                  Target
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--pc-muted)]">
                    <Icon name="external" size={16} />
                  </span>

                  <input
                    value={url}
                    onChange={(event) =>
                      setUrl(event.target.value)
                    }
                    className={`${mono.className} h-[54px] w-full rounded-xl border border-[var(--pc-border)] bg-[var(--pc-input)] pl-11 pr-4 text-xs outline-none transition-all placeholder:text-[var(--pc-muted)] focus:border-[#4C8DFF] focus:ring-4 focus:ring-[#4C8DFF]/10`}
                    placeholder="https://example.com"
                    type="url"
                  />
                </div>
              </div>

              {(monitorType === "HTTP" || monitorType === "API") && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <PremiumSelect
                    label="HTTP method"
                    value={method}
                    onChange={setMethod}
                    options={methodOptions}
                    icon={<Icon name="arrow" size={16} />}
                  />

                  <div>
                    <label className="mb-2 block text-[12px] font-semibold text-[var(--pc-muted)]">
                      Expected status
                    </label>
                    <input
                      value={expectedStatusCode}
                      onChange={(event) => setExpectedStatusCode(event.target.value)}
                      inputMode="numeric"
                      className={`${mono.className} h-[54px] w-full rounded-xl border border-[var(--pc-border)] bg-[var(--pc-input)] px-4 text-xs outline-none transition-all focus:border-[#4C8DFF] focus:ring-4 focus:ring-[#4C8DFF]/10`}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-[12px] font-semibold text-[var(--pc-muted)]">
                      Expected response text <span className="font-normal">(optional)</span>
                    </label>
                    <input
                      value={expectedBodyText}
                      onChange={(event) => setExpectedBodyText(event.target.value)}
                      className="h-[54px] w-full rounded-xl border border-[var(--pc-border)] bg-[var(--pc-input)] px-4 text-sm outline-none transition-all placeholder:text-[var(--pc-muted)] focus:border-[#4C8DFF] focus:ring-4 focus:ring-[#4C8DFF]/10"
                      placeholder='e.g. "status":"ok"'
                    />
                  </div>

                  {monitorType === "API" && (
                    <>
                      <div className="sm:col-span-2">
                        <label className="mb-2 block text-[12px] font-semibold text-[var(--pc-muted)]">
                          Request headers JSON <span className="font-normal">(optional)</span>
                        </label>
                        <textarea
                          value={requestHeadersJson}
                          onChange={(event) => setRequestHeadersJson(event.target.value)}
                          className={`${mono.className} min-h-[90px] w-full rounded-xl border border-[var(--pc-border)] bg-[var(--pc-input)] px-4 py-3 text-xs outline-none transition-all placeholder:text-[var(--pc-muted)] focus:border-[#4C8DFF] focus:ring-4 focus:ring-[#4C8DFF]/10`}
                          placeholder='{"Authorization":"Bearer ..."}'
                        />
                      </div>
                      {method !== "GET" && method !== "HEAD" && (
                        <div className="sm:col-span-2">
                          <label className="mb-2 block text-[12px] font-semibold text-[var(--pc-muted)]">
                            Request body <span className="font-normal">(optional)</span>
                          </label>
                          <textarea
                            value={requestBody}
                            onChange={(event) => setRequestBody(event.target.value)}
                            className={`${mono.className} min-h-[90px] w-full rounded-xl border border-[var(--pc-border)] bg-[var(--pc-input)] px-4 py-3 text-xs outline-none transition-all placeholder:text-[var(--pc-muted)] focus:border-[#4C8DFF] focus:ring-4 focus:ring-[#4C8DFF]/10`}
                            placeholder='{"ping":true}'
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {monitorType === "TCP" && (
                <div>
                  <label className="mb-2 block text-[12px] font-semibold text-[var(--pc-muted)]">
                    Port
                  </label>
                  <input
                    value={port}
                    onChange={(event) => setPort(event.target.value)}
                    inputMode="numeric"
                    className={`${mono.className} h-[54px] w-full rounded-xl border border-[var(--pc-border)] bg-[var(--pc-input)] px-4 text-xs outline-none transition-all placeholder:text-[var(--pc-muted)] focus:border-[#4C8DFF] focus:ring-4 focus:ring-[#4C8DFF]/10`}
                    placeholder="443"
                  />
                </div>
              )}

              {monitorType === "DNS" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <PremiumSelect
                    label="Record type"
                    value={dnsRecordType}
                    onChange={setDnsRecordType}
                    options={dnsRecordOptions}
                    icon={<Icon name="chart" size={16} />}
                  />
                  <div>
                    <label className="mb-2 block text-[12px] font-semibold text-[var(--pc-muted)]">
                      Expected value <span className="font-normal">(optional)</span>
                    </label>
                    <input
                      value={dnsExpectedValue}
                      onChange={(event) => setDnsExpectedValue(event.target.value)}
                      className={`${mono.className} h-[54px] w-full rounded-xl border border-[var(--pc-border)] bg-[var(--pc-input)] px-4 text-xs outline-none transition-all placeholder:text-[var(--pc-muted)] focus:border-[#4C8DFF] focus:ring-4 focus:ring-[#4C8DFF]/10`}
                      placeholder="1.2.3.4"
                    />
                  </div>
                </div>
              )}

              {monitorType === "SSL" && (
                <div>
                  <label className="mb-2 block text-[12px] font-semibold text-[var(--pc-muted)]">
                    Warning days before expiry
                  </label>
                  <input
                    value={sslExpiryWarningDays}
                    onChange={(event) => setSslExpiryWarningDays(event.target.value)}
                    inputMode="numeric"
                    className={`${mono.className} h-[54px] w-full rounded-xl border border-[var(--pc-border)] bg-[var(--pc-input)] px-4 text-xs outline-none transition-all focus:border-[#4C8DFF] focus:ring-4 focus:ring-[#4C8DFF]/10`}
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-[12px] font-semibold text-[var(--pc-muted)]">
                  Timeout (seconds)
                </label>
                <input
                  value={timeoutSeconds}
                  onChange={(event) => setTimeoutSeconds(event.target.value)}
                  inputMode="numeric"
                  className={`${mono.className} h-[54px] w-full rounded-xl border border-[var(--pc-border)] bg-[var(--pc-input)] px-4 text-xs outline-none transition-all focus:border-[#4C8DFF] focus:ring-4 focus:ring-[#4C8DFF]/10`}
                />
              </div>

              <PremiumSelect
                label="Check interval"
                value={checkInterval}
                onChange={setCheckInterval}
                options={intervalOptions}
                icon={<Icon name="clock" size={16} />}
              />

              <div className="rounded-xl border border-[var(--pc-border)] bg-[var(--pc-input)] p-3.5">
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#4C8DFF]/10 text-[#4C8DFF]">
                    <Icon name="shield" size={14} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold">
                      HTTP monitoring
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-[var(--pc-muted)]">
                      PulseCheck will request the endpoint
                      and record status, response time and
                      check history.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-[var(--pc-border)] p-5 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="h-11 rounded-xl border border-[var(--pc-border)] px-5 text-sm font-semibold text-[var(--pc-muted)] transition-colors hover:border-[var(--pc-border-hover)] hover:text-[var(--pc-text)]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void addMonitor()}
                disabled={loading || false}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#4C8DFF] px-5 text-sm font-bold text-white transition-all hover:bg-[#3E7CE8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon name="plus" size={16} />
                {loading
                  ? "Creating…"
                  : "Create monitor"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          EDIT MONITOR MODAL
          ======================================================== */}

      {editMonitor && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/55 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setEditMonitor(null);
            }
          }}
        >
          <div className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between border-b border-[var(--pc-border)] px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-base font-bold">
                  Edit monitor
                </h2>

                <p className="mt-1 text-xs text-[var(--pc-muted)]">
                  Update the name, endpoint or check interval.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditMonitor(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--pc-muted)] hover:bg-[var(--pc-hover)] hover:text-[var(--pc-text)]"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <label className="mb-2 block text-[12px] font-semibold text-[var(--pc-muted)]">
                  Monitor name
                </label>

                <input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  className="h-[54px] w-full rounded-xl border border-[var(--pc-border)] bg-[var(--pc-input)] px-4 text-sm font-medium outline-none transition-all placeholder:text-[var(--pc-muted)] focus:border-[#4C8DFF] focus:ring-4 focus:ring-[#4C8DFF]/10"
                  placeholder="Production API"
                />
              </div>

              <PremiumSelect
                label="Monitor type"
                value={editMonitorType}
                onChange={setEditMonitorType}
                options={monitorTypeOptions}
                icon={<Icon name="activity" size={16} />}
              />

              <div>
                <label className="mb-2 block text-[12px] font-semibold text-[var(--pc-muted)]">
                  Target
                </label>

                <input
                  value={editUrl}
                  onChange={(event) => setEditUrl(event.target.value)}
                  className={`${mono.className} h-[54px] w-full rounded-xl border border-[var(--pc-border)] bg-[var(--pc-input)] px-4 text-xs outline-none transition-all placeholder:text-[var(--pc-muted)] focus:border-[#4C8DFF] focus:ring-4 focus:ring-[#4C8DFF]/10`}
                  placeholder="https://example.com"
                  type="url"
                />
              </div>

              {(editMonitorType === "HTTP" || editMonitorType === "API") && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <PremiumSelect
                    label="HTTP method"
                    value={editMethod}
                    onChange={setEditMethod}
                    options={methodOptions}
                    icon={<Icon name="arrow" size={16} />}
                  />
                  <div>
                    <label className="mb-2 block text-[12px] font-semibold text-[var(--pc-muted)]">
                      Expected status
                    </label>
                    <input value={editExpectedStatusCode} onChange={(event) => setEditExpectedStatusCode(event.target.value)} inputMode="numeric" className={`${mono.className} h-[54px] w-full rounded-xl border border-[var(--pc-border)] bg-[var(--pc-input)] px-4 text-xs outline-none transition-all focus:border-[#4C8DFF]`} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-[12px] font-semibold text-[var(--pc-muted)]">Expected response text <span className="font-normal">(optional)</span></label>
                    <input value={editExpectedBodyText} onChange={(event) => setEditExpectedBodyText(event.target.value)} className="h-[54px] w-full rounded-xl border border-[var(--pc-border)] bg-[var(--pc-input)] px-4 text-sm outline-none transition-all focus:border-[#4C8DFF]" />
                  </div>
                  {editMonitorType === "API" && (
                    <>
                      <div className="sm:col-span-2">
                        <label className="mb-2 block text-[12px] font-semibold text-[var(--pc-muted)]">Request headers JSON <span className="font-normal">(optional)</span></label>
                        <textarea value={editRequestHeadersJson} onChange={(event) => setEditRequestHeadersJson(event.target.value)} className={`${mono.className} min-h-[90px] w-full rounded-xl border border-[var(--pc-border)] bg-[var(--pc-input)] px-4 py-3 text-xs outline-none transition-all focus:border-[#4C8DFF]`} />
                      </div>
                      {editMethod !== "GET" && editMethod !== "HEAD" && (
                        <div className="sm:col-span-2">
                          <label className="mb-2 block text-[12px] font-semibold text-[var(--pc-muted)]">Request body <span className="font-normal">(optional)</span></label>
                          <textarea value={editRequestBody} onChange={(event) => setEditRequestBody(event.target.value)} className={`${mono.className} min-h-[90px] w-full rounded-xl border border-[var(--pc-border)] bg-[var(--pc-input)] px-4 py-3 text-xs outline-none transition-all focus:border-[#4C8DFF]`} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              {editMonitorType === "TCP" && (
                <div>
                  <label className="mb-2 block text-[12px] font-semibold text-[var(--pc-muted)]">Port</label>
                  <input value={editPort} onChange={(event) => setEditPort(event.target.value)} inputMode="numeric" className={`${mono.className} h-[54px] w-full rounded-xl border border-[var(--pc-border)] bg-[var(--pc-input)] px-4 text-xs outline-none transition-all focus:border-[#4C8DFF]`} />
                </div>
              )}
              {editMonitorType === "DNS" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <PremiumSelect label="Record type" value={editDnsRecordType} onChange={setEditDnsRecordType} options={dnsRecordOptions} icon={<Icon name="chart" size={16} />} />
                  <div>
                    <label className="mb-2 block text-[12px] font-semibold text-[var(--pc-muted)]">Expected value <span className="font-normal">(optional)</span></label>
                    <input value={editDnsExpectedValue} onChange={(event) => setEditDnsExpectedValue(event.target.value)} className={`${mono.className} h-[54px] w-full rounded-xl border border-[var(--pc-border)] bg-[var(--pc-input)] px-4 text-xs outline-none transition-all focus:border-[#4C8DFF]`} />
                  </div>
                </div>
              )}
              {editMonitorType === "SSL" && (
                <div>
                  <label className="mb-2 block text-[12px] font-semibold text-[var(--pc-muted)]">Warning days before expiry</label>
                  <input value={editSslExpiryWarningDays} onChange={(event) => setEditSslExpiryWarningDays(event.target.value)} inputMode="numeric" className={`${mono.className} h-[54px] w-full rounded-xl border border-[var(--pc-border)] bg-[var(--pc-input)] px-4 text-xs outline-none transition-all focus:border-[#4C8DFF]`} />
                </div>
              )}
              <div>
                <label className="mb-2 block text-[12px] font-semibold text-[var(--pc-muted)]">Timeout (seconds)</label>
                <input value={editTimeoutSeconds} onChange={(event) => setEditTimeoutSeconds(event.target.value)} inputMode="numeric" className={`${mono.className} h-[54px] w-full rounded-xl border border-[var(--pc-border)] bg-[var(--pc-input)] px-4 text-xs outline-none transition-all focus:border-[#4C8DFF]`} />
              </div>

              <PremiumSelect
                label="Check interval"
                value={editCheckInterval}
                onChange={setEditCheckInterval}
                options={intervalOptions}
                icon={<Icon name="clock" size={16} />}
              />
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-[var(--pc-border)] p-5 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={() => setEditMonitor(null)}
                className="h-11 rounded-xl border border-[var(--pc-border)] px-5 text-sm font-semibold text-[var(--pc-muted)] transition-colors hover:border-[var(--pc-border-hover)] hover:text-[var(--pc-text)]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void saveEditMonitor()}
                disabled={loading}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#4C8DFF] px-5 text-sm font-bold text-white transition-all hover:bg-[#3E7CE8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon name="check" size={16} />
                {loading ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MONITOR DETAIL DRAWER
          ======================================================== */}

      {viewMonitor && (
        <div
          className="fixed inset-0 z-[300] flex justify-end bg-black/55 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDetail();
          }}
        >
          <div className="flex h-full w-full max-w-[640px] flex-col border-l border-[var(--pc-border)] bg-[var(--pc-surface)] shadow-[0_0_100px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between border-b border-[var(--pc-border)] px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        getStatus(viewMonitor) === "up"
                          ? "#34D399"
                          : getStatus(viewMonitor) === "down"
                            ? "#FB5B5B"
                            : getStatus(viewMonitor) === "unknown"
                              ? "#E8B94A"
                              : "#7C8699",
                    }}
                  />
                  <h2 className="truncate text-base font-bold">{viewMonitor.name}</h2>
                </div>
                <p className={`${mono.className} mt-1 truncate text-[11px] text-[var(--pc-muted)]`}>
                  {viewMonitor.url}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDetail}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--pc-muted)] hover:bg-[var(--pc-hover)] hover:text-[var(--pc-text)]"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
              {/* uptime */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  ["24h", uptimeForWindow(checksHistory, 24)],
                  ["7d", uptimeForWindow(checksHistory, 24 * 7)],
                  ["30d", uptimeForWindow(checksHistory, 24 * 30)],
                ].map(([label, value]) => (
                  <div
                    key={label as string}
                    className="rounded-xl border border-[var(--pc-border)] bg-[var(--pc-input)] p-4"
                  >
                    <p className="text-[11px] font-medium text-[var(--pc-muted)]">Uptime · {label}</p>
                    <p className={`${mono.className} mt-1 text-xl font-semibold`}>
                      {value == null ? "—" : `${value}%`}
                    </p>
                  </div>
                ))}
              </div>

              {/* response time chart */}
              <div className="rounded-xl border border-[var(--pc-border)] bg-[var(--pc-input)] p-4">
                <p className="mb-2 text-[11px] font-medium text-[var(--pc-muted)]">
                  Response time — last {Math.min(checksHistory.length, 50)} checks
                </p>
                {detailLoading ? (
                  <div className="flex h-32 items-center justify-center text-xs text-[var(--pc-muted)]">
                    Loading…
                  </div>
                ) : (
                  <ResponseTimeChart
                    points={[...checksHistory]
                      .slice(0, 50)
                      .reverse()
                      .map((check) => ({ y: check.responseTime ?? null }))}
                  />
                )}
              </div>

              {/* incidents */}
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-[var(--pc-muted)]">
                  Incident history
                </p>

                {incidentsHistory.length === 0 ? (
                  <p className="text-sm text-[var(--pc-muted)]">
                    No incidents recorded for this monitor.
                  </p>
                ) : (
                  <div className="divide-y divide-[var(--pc-border)] overflow-hidden rounded-xl border border-[var(--pc-border)]">
                    {incidentsHistory.map((incident) => (
                      <div
                        key={incident.id}
                        className="flex items-center justify-between gap-3 bg-[var(--pc-input)] p-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {incident.reason || "Service unreachable"}
                          </p>
                          <p className={`${mono.className} mt-1 text-[11px] text-[var(--pc-muted)]`}>
                            {new Date(incident.startedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span
                            className={`inline-block rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                              incident.status === "OPEN"
                                ? "bg-[#FB5B5B]/10 text-[#FB5B5B]"
                                : "bg-[#34D399]/10 text-[#34D399]"
                            }`}
                          >
                            {incident.status === "OPEN" ? "Ongoing" : "Resolved"}
                          </span>
                          <p className={`${mono.className} mt-1 text-[11px] text-[var(--pc-muted)]`}>
                            {formatDuration(incident.duration)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* recent checks */}
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-[var(--pc-muted)]">
                  Recent checks
                </p>
                <div className="max-h-72 divide-y divide-[var(--pc-border)] overflow-y-auto rounded-xl border border-[var(--pc-border)]">
                  {checksHistory.slice(0, 30).map((check) => (
                    <div
                      key={check.id}
                      className="flex items-center justify-between gap-3 bg-[var(--pc-input)] px-4 py-2.5"
                    >
                      <span className={`${mono.className} text-[11px] text-[var(--pc-muted)]`}>
                        {new Date(check.checkedAt).toLocaleString()}
                      </span>
                      <span
                        className={`${mono.className} text-[11px] font-semibold`}
                        style={{ color: check.status === "UP" ? "#34D399" : "#FB5B5B" }}
                      >
                        {check.status}
                        {check.statusCode ? ` · ${check.statusCode}` : ""}
                      </span>
                      <span className={`${mono.className} text-[11px] text-[var(--pc-muted)]`}>
                        {check.responseTime != null ? `${check.responseTime}ms` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SETTINGS
          ======================================================== */}

      {showSettings && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/55 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowSettings(false);
            }
          }}
        >
          <div className="w-full max-w-[620px] overflow-hidden rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between border-b border-[var(--pc-border)] px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-base font-bold">
                  Settings
                </h2>

                <p className="mt-1 text-xs text-[var(--pc-muted)]">
                  Configure your PulseCheck workspace.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--pc-muted)] hover:bg-[var(--pc-hover)] hover:text-[var(--pc-text)]"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--pc-muted)]">
                  Appearance
                </p>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => changeTheme("dark")}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      theme === "dark"
                        ? "border-[#4C8DFF] bg-[#4C8DFF]/8"
                        : "border-[var(--pc-border)] bg-[var(--pc-input)] hover:border-[var(--pc-border-hover)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#080B11] text-white">
                        <Icon name="moon" size={16} />
                      </span>

                      <div>
                        <p className="text-sm font-semibold">
                          Dark
                        </p>
                        <p className="mt-0.5 text-[10px] text-[var(--pc-muted)]">
                          NOC friendly
                        </p>
                      </div>

                      {theme === "dark" && (
                        <span className="ml-auto text-[#4C8DFF]">
                          <Icon name="check" size={16} />
                        </span>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => changeTheme("light")}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      theme === "light"
                        ? "border-[#4C8DFF] bg-[#4C8DFF]/8"
                        : "border-[var(--pc-border)] bg-[var(--pc-input)] hover:border-[var(--pc-border-hover)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm">
                        <Icon name="sun" size={16} />
                      </span>

                      <div>
                        <p className="text-sm font-semibold">
                          Light
                        </p>
                        <p className="mt-0.5 text-[10px] text-[var(--pc-muted)]">
                          Daytime workspace
                        </p>
                      </div>

                      {theme === "light" && (
                        <span className="ml-auto text-[#4C8DFF]">
                          <Icon name="check" size={16} />
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              <div className="my-6 border-t border-[var(--pc-border)]" />

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--pc-muted)]">
                  Workspace
                </p>

                <div className="mt-3 divide-y divide-[var(--pc-border)] overflow-hidden rounded-xl border border-[var(--pc-border)]">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 bg-[var(--pc-input)] p-4 text-left"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4C8DFF]/10 text-[#4C8DFF]">
                      <Icon name="settings" size={16} />
                    </span>

                    <span className="flex-1">
                      <span className="block text-sm font-semibold">
                        Monitoring settings
                      </span>

                      <span className="mt-0.5 block text-[11px] text-[var(--pc-muted)]">
                        Configure monitoring behavior
                      </span>
                    </span>

                    <Icon name="arrow" size={15} />
                  </button>

                  <button
                    type="button"
                    className="flex w-full items-center gap-3 bg-[var(--pc-input)] p-4 text-left"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#34D399]/10 text-[#34D399]">
                      <Icon name="bell" size={16} />
                    </span>

                    <span className="flex-1">
                      <span className="block text-sm font-semibold">
                        Notifications
                      </span>

                      <span className="mt-0.5 block text-[11px] text-[var(--pc-muted)]">
                        Alerts and incident notifications
                      </span>
                    </span>

                    <Icon name="arrow" size={15} />
                  </button>
                </div>
              </div>

              <div className="my-6 border-t border-[var(--pc-border)]" />

              <div className="rounded-xl border border-[var(--pc-border)] bg-[var(--pc-input)] p-4">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#4C8DFF]/10 text-[#4C8DFF]">
                    <Icon name="shield" size={17} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      PulseCheck
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-[var(--pc-muted)]">
                      Professional monitoring features,
                      subscriptions and account controls
                      belong here in Settings — not on the
                      main monitoring dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--pc-border)] p-5 text-right sm:px-6">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="rounded-xl bg-[#4C8DFF] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#3E7CE8]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}


      <style jsx global>{`
        :root {
          --pc-bg: #080b11;
          --pc-surface: #10151e;
          --pc-surface-soft: #121923;
          --pc-input: #111827;
          --pc-dropdown: rgba(17, 24, 39, 0.98);
          --pc-select-active: #14233f;
          --pc-border: #202938;
          --pc-border-hover: #344158;
          --pc-text: #edf2f8;
          --pc-muted: #7d899c;
          --pc-hover: #182131;
          --pc-icon-bg: #182131;
          --pc-shadow: 0 25px 70px rgba(0, 0, 0, 0.35);
        }

        html[data-theme="light"] {
          --pc-bg: #f5f7fb;
          --pc-surface: #ffffff;
          --pc-surface-soft: #f8fafc;
          --pc-input: #f7f9fc;
          --pc-dropdown: rgba(255, 255, 255, 0.98);
          --pc-select-active: #f4f8ff;
          --pc-border: #e2e8f0;
          --pc-border-hover: #cbd5e1;
          --pc-text: #0f172a;
          --pc-muted: #64748b;
          --pc-hover: #f1f5f9;
          --pc-icon-bg: #eef3f9;
          --pc-shadow: 0 20px 60px rgba(15, 23, 42, 0.10);
        }

        @keyframes pcDropdown {
          from {
            opacity: 0;
            transform: translateY(-5px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: var(--pc-bg);
          color: var(--pc-text);
          transition: background-color 180ms ease, color 180ms ease;
        }

        * {
          scrollbar-width: thin;
          scrollbar-color: var(--pc-border-hover) transparent;
        }

        *::-webkit-scrollbar {
          width: 7px;
          height: 7px;
        }

        *::-webkit-scrollbar-track {
          background: transparent;
        }

        *::-webkit-scrollbar-thumb {
          background: var(--pc-border-hover);
          border-radius: 999px;
        }
      `}</style>

      {/* ========================================================
          FULLSCREEN INDICATOR
          ======================================================== */}

      {fullscreen && (
        <div className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2 rounded-full border border-[var(--pc-border)] bg-[var(--pc-surface)] px-4 py-2 text-[11px] font-medium text-[var(--pc-muted)] shadow-[var(--pc-shadow)]">
          NOC View · press Esc to exit
        </div>
      )}
    </main>
  );
}