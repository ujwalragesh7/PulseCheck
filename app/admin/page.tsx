"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Amplify } from "aws-amplify";
import { fetchUserAttributes, getCurrentUser } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";

import outputs from "../../amplify_outputs.json";
import type { Schema } from "../../amplify/data/resource";
import "./admin.css";

Amplify.configure(outputs);

const client = generateClient<Schema>();
const ADMIN_EMAIL = "ujwalragesh2@gmail.com";

type Overview = NonNullable<Schema["AdminOverview"]["type"]>;
type OverviewUsers = NonNullable<Overview["users"]>;
type OverviewMonitoring = NonNullable<Overview["monitoring"]>;

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setError("");

    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const email = attributes.email ?? user.username;

      if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        setAuthorized(false);
        setOverview(null);
        return;
      }

      setAuthorized(true);

      const result = await client.queries.adminOverview();

      if (result.errors?.length) {
        throw new Error(result.errors[0]?.message ?? "Unable to load admin data.");
      }

      const data = result.data;

      if (!data || !data.users || !data.monitoring) {
        throw new Error("The admin dashboard returned incomplete data.");
      }

      setOverview(data as Overview);
    } catch (err) {
      setOverview(null);
      setError(
        err instanceof Error ? err.message : "Unable to load admin dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function setPlatform(enabled: boolean) {
    const message = enabled
      ? ""
      : "PulseCheck is temporarily stopped by the administrator. Monitoring and new monitoring operations are currently unavailable. Please try again later or contact support.";

    if (
      !enabled &&
      !window.confirm(
        "STOP ALL PULSECHECK MONITORING?\n\nThe scheduler will be disabled and monitoring operations will stop globally.",
      )
    ) {
      return;
    }

    setWorking(true);
    setError("");

    try {
      const result = await client.mutations.setPlatformState({
        enabled,
        message,
      });

      if (result.errors?.length) {
        throw new Error(
          result.errors[0]?.message ?? "Could not change platform state.",
        );
      }

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not change platform state.",
      );
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <main className="admin-shell">
        <div className="admin-loading">
          <div className="admin-spinner" />
          <span>Loading PulseCheck Operations Center…</span>
        </div>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="admin-shell">
        <section className="admin-denied">
          <div className="denied-icon">!</div>
          <p className="eyebrow">PULSECHECK / RESTRICTED</p>
          <h1>Administrator access required</h1>
          <p>This area is restricted to PulseCheck administrators.</p>
        </section>
      </main>
    );
  }

  if (!overview) {
    return (
      <main className="admin-shell">
        <section className="admin-denied">
          <div className="denied-icon">!</div>
          <p className="eyebrow">PULSECHECK / ADMIN</p>
          <h1>Unable to load dashboard</h1>
          <p>{error || "Please refresh and try again."}</p>
          <button className="secondary-button" onClick={() => void load()}>
            Refresh dashboard
          </button>
        </section>
      </main>
    );
  }

  const users = overview.users as OverviewUsers;
  const monitoring = overview.monitoring as OverviewMonitoring;

  return (
    <main className="admin-shell">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <p className="eyebrow">PULSECHECK / ADMIN</p>
            <h1>Operations Center</h1>
            <p className="subtitle">
              Platform-wide visibility, usage intelligence and the global safety control.
            </p>
          </div>

          <div className="admin-identity">
            <span className="admin-dot" />
            <span>{ADMIN_EMAIL}</span>
            <span className="admin-badge">ADMIN</span>
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}

        <section
          className={`platform-banner ${
            overview.platformRunning ? "running" : "stopped"
          }`}
        >
          <div className="platform-copy">
            <div className="platform-heading">
              <span className="status-pulse" />
              <span className="status-label">GLOBAL PLATFORM</span>
            </div>
            <strong>{overview.platformRunning ? "RUNNING" : "STOPPED"}</strong>
            <p>
              {overview.platformRunning
                ? "Monitoring scheduler is enabled. Users can create and operate monitors normally."
                : overview.platformMessage ||
                  "Monitoring operations are currently stopped."}
            </p>
          </div>

          <div className="platform-actions">
            <button
              className={overview.platformRunning ? "danger-button" : "start-button"}
              disabled={working}
              onClick={() => void setPlatform(!overview.platformRunning)}
            >
              {working
                ? overview.platformRunning
                  ? "Stopping…"
                  : "Starting…"
                : overview.platformRunning
                  ? "Stop Monitoring"
                  : "Start Monitoring"}
            </button>
          </div>
        </section>

        <section className="metric-grid">
          <Metric label="Total users" value={users.total} />
          <Metric label="Active · 30d" value={users.active} />
          <Metric label="Registered monitors" value={monitoring.total} />
          <Metric label="Healthy services" value={monitoring.healthy} tone="success" />
          <Metric label="Services down" value={monitoring.down} tone="danger" />
          <Metric label="Open incidents" value={monitoring.openIncidents} tone="warning" />
        </section>

        <section className="section-grid">
          <Panel title="User activity" caption="Cognito account and application activity">
            <Row label="Confirmed users" value={users.confirmed} />
            <Row label="Disabled users" value={users.disabled} />
            <Row label="New today" value={users.newToday} />
            <Row label="New in 7 days" value={users.new7d} />
            <Row label="New in 30 days" value={users.new30d} />
            <Row label="Logins today" value={users.loginsToday} />
            <Row label="Logins in 7 days" value={users.logins7d} />
            <Row label="Logins in 30 days" value={users.logins30d} />
          </Panel>

          <Panel title="Monitoring" caption="Current platform health">
            <Row label="Active monitors" value={monitoring.active} />
            <Row label="Healthy" value={monitoring.healthy} />
            <Row label="Down" value={monitoring.down} />
            <Row label="Disabled" value={monitoring.disabled} />
            <Row label="Open incidents" value={monitoring.openIncidents} />
            <Row label="Average response" value={`${monitoring.averageResponseTime} ms`} />
            <Row
              label="Uptime window"
              value={overview.uptimeWindowDays === 1 ? "24 hours" : `${overview.uptimeWindowDays} days`}
            />
          </Panel>
        </section>

        <footer className="admin-footer">
          <span>Global control applies to every PulseCheck user.</span>
          <span>Updated {new Date(overview.generatedAt).toLocaleString()}</span>
        </footer>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "success" | "danger" | "warning";
}) {
  return (
    <article className={`metric metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Panel({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{caption}</p>
        </div>
      </div>
      <div>{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
