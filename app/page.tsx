"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Amplify } from "aws-amplify";
import {
  getCurrentUser,
  signOut,
} from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import { Inter, IBM_Plex_Mono } from "next/font/google";

import outputs from "../amplify_outputs.json";
import type { Schema } from "../amplify/data/resource";

Amplify.configure(outputs);

const client = generateClient<Schema>();

type Monitor = Schema["Monitor"]["type"];

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
    | "arrow";
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
}export default function Home() {
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

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [checkInterval, setCheckInterval] = useState("5");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [clock, setClock] = useState<Date | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [platformRunning, setPlatformRunning] = useState(true);
  const [platformMessage, setPlatformMessage] = useState("");
  const [platformLoaded, setPlatformLoaded] = useState(false);
  /* ----------------------------------------------------------
     LOAD MONITORS
     ---------------------------------------------------------- */

  const loadPlatformStatus = useCallback(async () => {
    try {
      const { data, errors } = await client.queries.platformStatus();

      if (errors?.length) {
        throw new Error(errors[0]?.message ?? "Could not load platform status.");
      }

      setPlatformRunning(data?.monitoringEnabled ?? true);
      setPlatformMessage(data?.message ?? "");
    } catch (error) {
      console.error("Could not load platform status:", error);
      // Fail closed for write operations if the global control cannot be read.
      setPlatformRunning(false);
      setPlatformMessage(
        "PulseCheck platform status is temporarily unavailable. Monitoring changes are disabled until the service is available again.",
      );
    } finally {
      setPlatformLoaded(true);
    }
  }, []);

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
        await getCurrentUser();

        if (!mounted) return;

        setUser(true);
        await loadPlatformStatus();
        await loadMonitors();
      } catch {
        if (!mounted) return;

        setUser(false);
        window.location.replace("/login");
      } finally {
        if (mounted) {
          setAuthReady(true);
        }
      }
    }

    void initializeAuth();

    return () => {
      mounted = false;
    };
  }, [loadMonitors, loadPlatformStatus]);

  /* ----------------------------------------------------------
     AUTO REFRESH
     ---------------------------------------------------------- */

  useEffect(() => {
    if (!user) return;

    const timer = window.setInterval(() => {
      void loadMonitors();
      void loadPlatformStatus();
    }, 15000);

    return () => {
      window.clearInterval(timer);
    };
  }, [user, loadMonitors, loadPlatformStatus]);

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
     FULLSCREEN
     ---------------------------------------------------------- */

  useEffect(() => {
    function onFullscreenChange() {
      setFullscreen(Boolean(document.fullscreenElement));
    }

    document.addEventListener(
      "fullscreenchange",
      onFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        onFullscreenChange
      );
    };
  }, []);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      setMessage("Fullscreen is not available in this browser.");
    }
  }

  /* ----------------------------------------------------------
  /* ----------------------------------------------------------
     LOGOUT
     ---------------------------------------------------------- */

  async function logout() {
    try {
      await signOut();
    } finally {
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
    if (!platformLoaded || !platformRunning) {
      setMessage(
        platformMessage ||
          "PulseCheck is temporarily stopped. Contact support before creating a monitor.",
      );
      return;
    }

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

      const { errors } = await client.models.Monitor.create({
        name: cleanName,
        url: cleanUrl,
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
    if (!platformLoaded || !platformRunning) {
      setMessage(
        platformMessage ||
          "PulseCheck is temporarily stopped. Monitoring changes are unavailable.",
      );
      return;
    }

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
    if (!platformLoaded || !platformRunning) {
      setMessage(
        platformMessage ||
          "PulseCheck is temporarily stopped. Monitoring changes are unavailable.",
      );
      return;
    }

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
      .sort(
        (a, b) => statusRank(a) - statusRank(b)
      );
  }, [monitors, search, filter]);

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
  /* ============================================================
     AUTH GUARD
     ============================================================ */

  if (!authReady) {
    return (
      <main
        className={`${inter.className} min-h-screen bg-[var(--pc-bg)] text-[var(--pc-text)]`}
      >
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-5">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] shadow-[var(--pc-shadow)]">
              <span className="absolute h-3 w-3 rounded-full bg-[#4C8DFF] shadow-[0_0_20px_rgba(76,141,255,0.65)]" />
              <span className="absolute h-7 w-7 animate-spin rounded-full border border-transparent border-t-[#4C8DFF]" />
            </div>
            <p className="text-sm font-medium text-[var(--pc-muted)]">
              Loading PulseCheck…
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main
      className={`${inter.className} min-h-screen bg-[var(--pc-bg)] text-[var(--pc-text)] transition-colors duration-200`}
    >
      {/* ========================================================
          HEADER
          ======================================================== */}

      <header className="sticky top-0 z-[80] border-b border-[var(--pc-border)] bg-[var(--pc-bg)]/92 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] w-full max-w-[1500px] items-center justify-between gap-5 px-5 sm:px-7 xl:px-10">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#4C8DFF]/25 bg-[#4C8DFF]/10 text-[#4C8DFF] shadow-[0_5px_20px_rgba(76,141,255,0.08)]">
              <Icon name="activity" size={20} strokeWidth={2} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <p className="truncate text-[16px] font-bold tracking-[-0.02em]">
                  PulseCheck
                </p>

                <span className="hidden rounded-md border border-[#34D399]/20 bg-[#34D399]/8 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#34D399] sm:inline">
                  Live
                </span>
              </div>

              <div
                className={`${mono.className} mt-0.5 flex items-center gap-2 text-[10px] text-[var(--pc-muted)]`}
              >
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
            <button
              type="button"
              onClick={() => void loadMonitors()}
              disabled={loadingMonitors}
              className="hidden h-10 items-center gap-2 rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface)] px-3.5 text-sm font-medium text-[var(--pc-muted)] transition-all hover:border-[var(--pc-border-hover)] hover:text-[var(--pc-text)] disabled:opacity-50 sm:flex"
            >
              <Icon name="refresh" size={16} />
              <span>
                {loadingMonitors
                  ? "Refreshing"
                  : "Refresh"}
              </span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface)] text-[var(--pc-muted)] transition-all hover:border-[var(--pc-border-hover)] hover:text-[var(--pc-text)] md:flex"
              title="Fullscreen"
            >
              <Icon name="expand" size={17} />
            </button>

            <button
              type="button"
              onClick={() =>
                changeTheme(
                  theme === "dark" ? "light" : "dark"
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface)] text-[var(--pc-muted)] transition-all hover:border-[var(--pc-border-hover)] hover:text-[var(--pc-text)]"
              title="Change theme"
            >
              {theme === "dark" ? (
                <Icon name="sun" size={17} />
              ) : (
                <Icon name="moon" size={17} />
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setShowProfileMenu(
                    (current) => !current
                  )
                }
                className="flex h-10 items-center gap-2 rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface)] px-2.5 text-sm font-medium transition-all hover:border-[var(--pc-border-hover)]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4C8DFF]/12 text-[11px] font-bold text-[#4C8DFF]">
                  U
                </span>

                <span className="hidden max-w-[110px] truncate text-[var(--pc-text)] lg:block">
                  Account
                </span>

                <span className="hidden text-[var(--pc-muted)] sm:block">
                  <Icon name="chevron" size={14} />
                </span>
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
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================
          CONTENT
          ======================================================== */}

      <div className="mx-auto w-full max-w-[1500px] px-5 pb-16 pt-7 sm:px-7 xl:px-10">
        {!platformRunning && (
          <section className="mb-4 flex flex-col gap-3 rounded-2xl border border-[#FB5B5B]/25 bg-[#FB5B5B]/[0.045] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#FB5B5B] shadow-[0_0_14px_rgba(251,91,91,0.55)]" />
              <div>
                <p className="text-sm font-bold text-[#FF8585]">PulseCheck is temporarily stopped</p>
                <p className="mt-1 text-xs leading-5 text-[var(--pc-muted)]">
                  {platformMessage || "Monitoring and new monitoring operations are currently unavailable. Please try again later or contact support."}
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-lg border border-[#FB5B5B]/20 bg-[#FB5B5B]/8 px-3 py-2 text-[11px] font-semibold text-[#FF9B9B]">
              View-only mode
            </span>
          </section>
        )}

        {/* HERO */}

        <section
          className={`
            relative overflow-hidden rounded-2xl border p-5
            sm:p-6 xl:p-7
            ${
              overall === "down"
                ? "border-[#FB5B5B]/25 bg-[#FB5B5B]/[0.035]"
                : "border-[var(--pc-border)] bg-[var(--pc-surface)]"
            }
          `}
        >
          <div className="pointer-events-none absolute right-[-80px] top-[-100px] h-64 w-64 rounded-full bg-[#4C8DFF]/5 blur-[90px]" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="relative flex h-3.5 w-3.5">
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-35 ${
                      overall === "down"
                        ? "bg-[#FB5B5B]"
                        : overall === "idle"
                          ? "bg-[#7C8699]"
                          : "bg-[#34D399]"
                    }`}
                  />

                  <span
                    className={`relative inline-flex h-3.5 w-3.5 rounded-full ${
                      overall === "down"
                        ? "bg-[#FB5B5B]"
                        : overall === "idle"
                          ? "bg-[#7C8699]"
                          : "bg-[#34D399]"
                    }`}
                  />
                </span>

                <h1
                  className={`text-xl font-bold tracking-[-0.025em] sm:text-2xl ${
                    overall === "down"
                      ? "text-[#FB5B5B]"
                      : overall === "idle"
                        ? "text-[var(--pc-muted)]"
                        : "text-[#34D399]"
                  }`}
                >
                  {overallTitle}
                </h1>
              </div>

              <p className="mt-2 pl-6 text-sm text-[var(--pc-muted)]">
                {down > 0
                  ? "Review the affected services below."
                  : "Real-time visibility across your monitored services."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!platformRunning) {
                  setMessage(
                    platformMessage ||
                      "PulseCheck is temporarily stopped. Contact support before creating a monitor.",
                  );
                  return;
                }
                setMessage("");
                setShowAdd(true);
              }}
              disabled={!platformLoaded || !platformRunning}
              className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#4C8DFF] px-5 text-sm font-bold text-white shadow-[0_8px_25px_rgba(76,141,255,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#3E7CE8] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Icon name="plus" size={17} strokeWidth={2.2} />
              Add monitor
            </button>
          </div>
        </section>

        {/* MESSAGE */}

        {message && (
          <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface)] px-4 py-3 text-sm text-[var(--pc-muted)] shadow-sm">
            <span>{message}</span>

            <button
              type="button"
              onClick={() => setMessage("")}
              className="shrink-0 text-[var(--pc-muted)] hover:text-[var(--pc-text)]"
            >
              <Icon name="x" size={15} />
            </button>
          </div>
        )}

        {/* STATISTICS */}

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            {
              label: "Total",
              value: total,
              icon: "monitor" as const,
              valueClass: "text-[var(--pc-text)]",
            },
            {
              label: "Healthy",
              value: healthy,
              icon: "check" as const,
              valueClass: "text-[#34D399]",
            },
            {
              label: "Down",
              value: down,
              icon: "bell" as const,
              valueClass: "text-[#FB5B5B]",
            },
            {
              label: "Unknown",
              value: unknown,
              icon: "clock" as const,
              valueClass: "text-[#E8B94A]",
            },
            {
              label: "Availability",
              value: `${availability}%`,
              icon: "chart" as const,
              valueClass: "text-[#4C8DFF]",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-4 transition-all hover:-translate-y-0.5 hover:shadow-[var(--pc-shadow)] sm:p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-[var(--pc-muted)]">
                  {item.label}
                </span>

                <span className="text-[var(--pc-muted)]">
                  <Icon name={item.icon} size={16} />
                </span>
              </div>

              <p
                className={`${mono.className} mt-2 text-2xl font-semibold tracking-[-0.04em] ${item.valueClass}`}
              >
                {item.value}
              </p>
            </div>
          ))}
        </section>

        {/* TOOLBAR */}

        <section className="mt-7">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-[-0.02em]">
                Monitors
              </h2>

              <p className="mt-1 text-sm text-[var(--pc-muted)]">
                Service health, response time and availability.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 sm:w-64">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--pc-muted)]">
                  <Icon name="search" size={16} />
                </span>

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  className="h-10 w-full rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface)] pl-10 pr-3 text-sm outline-none transition-all placeholder:text-[var(--pc-muted)] focus:border-[#4C8DFF] focus:ring-4 focus:ring-[#4C8DFF]/8"
                  placeholder="Search monitors"
                />
              </div>

              <div className="flex overflow-x-auto rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-1">
                {[
                  ["all", "All"],
                  ["up", "Healthy"],
                  ["down", "Down"],
                  ["unknown", "Unknown"],
                  ["disabled", "Disabled"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setFilter(
                        value as DashboardFilter
                      )
                    }
                    className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                      filter === value
                        ? "bg-[var(--pc-input)] text-[var(--pc-text)] shadow-sm"
                        : "text-[var(--pc-muted)] hover:text-[var(--pc-text)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* MONITOR TABLE */}

        <section className="mt-4 overflow-hidden rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)]">
          <div className="hidden grid-cols-[minmax(250px,1.8fr)_120px_130px_140px_120px] gap-4 border-b border-[var(--pc-border)] bg-[var(--pc-surface-soft)] px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--pc-muted)] lg:grid">
            <span>Service</span>
            <span>Status</span>
            <span>Response</span>
            <span>Last checked</span>
            <span className="text-right">Actions</span>
          </div>

          {filteredMonitors.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-input)] text-[var(--pc-muted)]">
                <Icon name="monitor" size={24} />
              </div>

              <h3 className="mt-4 text-base font-bold">
                {monitors.length === 0
                  ? "No monitors yet"
                  : "No matching monitors"}
              </h3>

              <p className="mt-1.5 max-w-md text-sm leading-6 text-[var(--pc-muted)]">
                {monitors.length === 0
                  ? "Add your first website or API endpoint and PulseCheck will start tracking it."
                  : "Try changing the search or status filter."}
              </p>

              {monitors.length === 0 && (
                <button
                  type="button"
                  onClick={() => setShowAdd(true)}
                  className="mt-5 flex items-center gap-2 rounded-xl bg-[#4C8DFF] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#3E7CE8]"
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

                const statusColor =
                  status === "up"
                    ? "#34D399"
                    : status === "down"
                      ? "#FB5B5B"
                      : status === "unknown"
                        ? "#E8B94A"
                        : "#7C8699";

                const statusBg =
                  status === "up"
                    ? "bg-[#34D399]/8"
                    : status === "down"
                      ? "bg-[#FB5B5B]/8"
                      : status === "unknown"
                        ? "bg-[#E8B94A]/8"
                        : "bg-[var(--pc-input)]";

                return (
                  <div
                    key={monitor.id}
                    className="group px-4 py-4 transition-colors hover:bg-[var(--pc-hover)]/45 sm:px-5 sm:py-5"
                  >
                    <div className="grid gap-4 lg:grid-cols-[minmax(250px,1.8fr)_120px_130px_140px_120px] lg:items-center">
                      {/* SERVICE */}

                      <div className="min-w-0">
                        <div className="flex items-start gap-3">
                          <span
                            className="mt-1.5 flex h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor: statusColor,
                              boxShadow:
                                status === "up"
                                  ? "0 0 12px rgba(52,211,153,.45)"
                                  : status === "down"
                                    ? "0 0 12px rgba(251,91,91,.35)"
                                    : "none",
                            }}
                          />

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-sm font-bold text-[var(--pc-text)]">
                                {monitor.name}
                              </h3>

                              <span
                                className={`${mono.className} rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em]`}
                                style={{
                                  color: statusColor,
                                  backgroundColor:
                                    `${statusColor}12`,
                                }}
                              >
                                {status}
                              </span>
                            </div>

                            <div className="mt-1 flex min-w-0 items-center gap-1.5">
                              <p
                                className={`${mono.className} truncate text-[11px] text-[var(--pc-muted)]`}
                              >
                                {monitor.url}
                              </p>

                              <a
                                href={monitor.url}
                                target="_blank"
                                rel="noreferrer"
                                className="shrink-0 text-[var(--pc-muted)] opacity-0 transition-opacity hover:text-[#4C8DFF] group-hover:opacity-100"
                                title="Open endpoint"
                              >
                                <Icon
                                  name="external"
                                  size={12}
                                />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* STATUS */}

                      <div className="flex items-center gap-2 lg:block">
                        <span className="text-[11px] text-[var(--pc-muted)] lg:hidden">
                          Status
                        </span>

                        <span
                          className={`inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-semibold ${statusBg}`}
                          style={{ color: statusColor }}
                        >
                          {status === "up"
                            ? "Operational"
                            : status === "down"
                              ? "Down"
                              : status === "disabled"
                                ? "Disabled"
                                : "Waiting"}
                        </span>
                      </div>

                      {/* RESPONSE */}

                      <div className="flex items-center gap-2 lg:block">
                        <span className="text-[11px] text-[var(--pc-muted)] lg:hidden">
                          Response
                        </span>

                        <span
                          className={`${mono.className} text-xs font-medium text-[var(--pc-text)]`}
                        >
                          {formatResponse(
                            monitor.responseTime
                          )}
                        </span>
                      </div>

                      {/* CHECKED */}

                      <div className="flex items-center gap-2 lg:block">
                        <span className="text-[11px] text-[var(--pc-muted)] lg:hidden">
                          Checked
                        </span>

                        <span
                          className={`${mono.className} text-xs text-[var(--pc-muted)]`}
                        >
                          {formatChecked(
                            monitor.lastChecked
                          )}
                        </span>
                      </div>

                      {/* ACTIONS */}

                      <div className="flex items-center justify-between gap-2 lg:justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            void toggleMonitor(monitor)
                          }
                          disabled={!platformLoaded || !platformRunning}
                          className="flex items-center gap-1.5 rounded-lg border border-[var(--pc-border)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--pc-muted)] transition-colors hover:border-[var(--pc-border-hover)] hover:text-[var(--pc-text)]"
                        >
                          <Icon
                            name={
                              monitor.enabled
                                ? "pause"
                                : "play"
                            }
                            size={13}
                          />

                          {monitor.enabled
                            ? "Disable"
                            : "Enable"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void deleteMonitor(
                              monitor.id
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--pc-muted)] transition-colors hover:bg-[#FB5B5B]/8 hover:text-[#FB5B5B]"
                          title="Delete monitor"
                        >
                          <Icon
                            name="trash"
                            size={14}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* FOOTER INSIGHT */}

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4C8DFF]/10 text-[#4C8DFF]">
                <Icon name="zap" size={17} />
              </div>

              <div>
                <p className="text-xs font-bold">
                  Average response
                </p>

                <p
                  className={`${mono.className} mt-1 text-sm text-[var(--pc-muted)]`}
                >
                  {averageResponse != null
                    ? `${averageResponse} ms`
                    : "Waiting for data"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#34D399]/10 text-[#34D399]">
                <Icon name="shield" size={17} />
              </div>

              <div>
                <p className="text-xs font-bold">
                  Monitoring coverage
                </p>

                <p
                  className={`${mono.className} mt-1 text-sm text-[var(--pc-muted)]`}
                >
                  {activeTotal} active service
                  {activeTotal === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8B94A]/10 text-[#E8B94A]">
                <Icon name="clock" size={17} />
              </div>

              <div>
                <p className="text-xs font-bold">
                  Auto refresh
                </p>

                <p
                  className={`${mono.className} mt-1 text-sm text-[var(--pc-muted)]`}
                >
                  Every 15 seconds
                </p>
              </div>
            </div>
          </div>
        </section>
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

              <div>
                <label className="mb-2 block text-[12px] font-semibold text-[var(--pc-muted)]">
                  URL
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
                disabled={loading || !platformRunning}
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
          Fullscreen monitoring view
        </div>
      )}
    </main>
  );
}
