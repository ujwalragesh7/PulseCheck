 "use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Amplify } from "aws-amplify";
import {
  confirmSignUp,
  getCurrentUser,
  signIn,
  signOut,
  signUp,
} from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import outputs from "../amplify_outputs.json";
import type { Schema } from "../amplify/data/resource";

Amplify.configure(outputs);

const client = generateClient<Schema>();
type Monitor = Schema["Monitor"]["type"];

function formatChecked(value?: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
}

export default function Home() {
  const [user, setUser] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loadingMonitors, setLoadingMonitors] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const loadMonitors = useCallback(async () => {
    setLoadingMonitors(true);
    try {
      const { data, errors } = await client.models.Monitor.list();
      if (errors?.length) throw new Error(errors[0].message);
      setMonitors(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load monitors.");
    } finally {
      setLoadingMonitors(false);
    }
  }, []);

  useEffect(() => {
    getCurrentUser()
      .then(() => {
        setUser(true);
        void loadMonitors();
      })
      .catch(() => {});
  }, [loadMonitors]);

  useEffect(() => {
    if (!user) return;
    const timer = window.setInterval(() => void loadMonitors(), 15000);
    return () => window.clearInterval(timer);
  }, [user, loadMonitors]);

  async function authenticate() {
    if (!email.trim() || !password) {
      setMessage("Enter your email and password.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      if (authMode === "signup") {
        const result = await signUp({
          username: email.trim(),
          password,
          options: { userAttributes: { email: email.trim() } },
        });

        if (result.nextStep.signUpStep === "CONFIRM_SIGN_UP") {
          setConfirming(true);
          setMessage("Check your email for the verification code.");
        } else {
          setAuthMode("signin");
          setMessage("Account created. Sign in now.");
        }
      } else {
        await signIn({ username: email.trim(), password });
        setUser(true);
        await loadMonitors();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    if (!code.trim()) {
      setMessage("Enter the verification code.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await confirmSignUp({
        username: email.trim(),
        confirmationCode: code.trim(),
      });
      setConfirming(false);
      setAuthMode("signin");
      setCode("");
      setMessage("Email verified. Sign in now.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  async function addMonitor() {
    const cleanName = name.trim();
    const cleanUrl = url.trim();

    if (!cleanName || !cleanUrl) {
      setMessage("Enter a monitor name and URL.");
      return;
    }

    try {
      const parsed = new URL(cleanUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Only HTTP and HTTPS URLs are supported.");
      }

      setLoading(true);
      const { errors } = await client.models.Monitor.create({
        name: cleanName,
        url: cleanUrl,
        status: "UNKNOWN",
        enabled: true,
      });

      if (errors?.length) throw new Error(errors[0].message);

      setName("");
      setUrl("");
      setShowAdd(false);
      setMessage("Monitor added. The AWS checker will test it automatically.");
      await loadMonitors();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Enter a valid URL.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteMonitor(id: string) {
    if (!window.confirm("Delete this monitor?")) return;

    try {
      const { errors } = await client.models.Monitor.delete({ id });
      if (errors?.length) throw new Error(errors[0].message);
      await loadMonitors();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete monitor.");
    }
  }

  async function toggleMonitor(monitor: Monitor) {
    try {
      const { errors } = await client.models.Monitor.update({
        id: monitor.id,
        enabled: !monitor.enabled,
      });
      if (errors?.length) throw new Error(errors[0].message);
      await loadMonitors();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update monitor.");
    }
  }

  async function logout() {
    await signOut();
    setUser(false);
    setMonitors([]);
  }

  const healthy = useMemo(
    () => monitors.filter((m) => m.enabled && m.status === "UP").length,
    [monitors]
  );
  const down = useMemo(
    () => monitors.filter((m) => m.enabled && m.status === "DOWN").length,
    [monitors]
  );
  const disabled = useMemo(
    () => monitors.filter((m) => !m.enabled).length,
    [monitors]
  );

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-300 mb-4">
              AWS-powered monitoring
            </div>
            <h1 className="text-5xl font-bold tracking-tight">PulseCheck</h1>
            <p className="mt-3 text-slate-400">Secure website monitoring platform</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
            <div className="flex mb-6 bg-slate-950 rounded-lg p-1">
              <button
                onClick={() => {
                  setAuthMode("signin");
                  setConfirming(false);
                  setMessage("");
                }}
                className={`flex-1 py-2 rounded-md ${
                  authMode === "signin" ? "bg-slate-800" : "text-slate-400"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthMode("signup");
                  setConfirming(false);
                  setMessage("");
                }}
                className={`flex-1 py-2 rounded-md ${
                  authMode === "signup" ? "bg-slate-800" : "text-slate-400"
                }`}
              >
                Create account
              </button>
            </div>

            {!confirming ? (
              <>
                <label className="text-sm text-slate-300">Email</label>
                <input
                  className="w-full mt-2 mb-4 rounded-lg bg-slate-950 border border-slate-700 p-3 outline-none focus:border-blue-500"
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <label className="text-sm text-slate-300">Password</label>
                <input
                  className="w-full mt-2 rounded-lg bg-slate-950 border border-slate-700 p-3 outline-none focus:border-blue-500"
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button
                  onClick={authenticate}
                  disabled={loading}
                  className="w-full mt-5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 p-3 font-semibold"
                >
                  {loading ? "Please wait..." : authMode === "signin" ? "Sign In" : "Create Account"}
                </button>
              </>
            ) : (
              <>
                <p className="text-slate-400 mb-4">
                  Enter the verification code sent to your email.
                </p>
                <input
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 p-3 outline-none focus:border-blue-500"
                  placeholder="Verification code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <button
                  onClick={verify}
                  disabled={loading}
                  className="w-full mt-5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 p-3 font-semibold"
                >
                  {loading ? "Verifying..." : "Verify Email"}
                </button>
              </>
            )}

            {message && (
              <p className="mt-5 text-center text-sm text-slate-400">{message}</p>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">PulseCheck</h1>
            <p className="text-xs text-slate-500">Website Monitoring</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => void loadMonitors()}
              disabled={loadingMonitors}
              className="border border-slate-700 rounded-lg px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"
            >
              {loadingMonitors ? "Refreshing..." : "Refresh"}
            </button>
            <button
              onClick={logout}
              className="border border-slate-700 rounded-lg px-4 py-2 text-sm hover:bg-slate-800"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-5 mb-8">
          <div>
            <p className="text-blue-400 uppercase text-xs tracking-widest">Dashboard</p>
            <h2 className="text-4xl font-bold mt-2">Monitor Overview</h2>
            <p className="text-slate-500 mt-2">Automatic checks run every 5 minutes.</p>
          </div>

          <button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-blue-600 hover:bg-blue-500 rounded-lg px-5 py-3 font-semibold"
          >
            + Add Monitor
          </button>
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 px-5 py-4 text-sm text-slate-300">
            {message}
          </div>
        )}

        {showAdd && (
          <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-xl font-semibold mb-5">Add Website</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                className="rounded-lg bg-slate-950 border border-slate-700 p-3 outline-none focus:border-blue-500"
                placeholder="Monitor name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="rounded-lg bg-slate-950 border border-slate-700 p-3 outline-none focus:border-blue-500"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <button
              onClick={addMonitor}
              disabled={loading}
              className="mt-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg px-5 py-2 font-semibold"
            >
              {loading ? "Saving..." : "Save Monitor"}
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-5 mb-8">
          {[
            ["Total", monitors.length, "text-white"],
            ["Healthy", healthy, "text-emerald-400"],
            ["Down", down, "text-red-400"],
            ["Disabled", disabled, "text-slate-400"],
          ].map(([label, value, color]) => (
            <div key={String(label)} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-slate-400">{label}</p>
              <p className={`text-4xl font-bold mt-2 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-xl font-semibold">Your Monitors</h3>
            <span className="text-xs text-slate-500">Live data refresh</span>
          </div>

          {monitors.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-lg text-slate-300">No monitors yet.</p>
              <p className="text-slate-500 mt-2">Add your first website to start monitoring.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {monitors.map((monitor) => (
                <div
                  key={monitor.id}
                  className="p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          !monitor.enabled
                            ? "bg-slate-600"
                            : monitor.status === "UP"
                              ? "bg-emerald-400"
                              : monitor.status === "DOWN"
                                ? "bg-red-400"
                                : "bg-yellow-400"
                        }`}
                      />
                      <h4 className="font-semibold text-lg truncate">{monitor.name}</h4>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 break-all">{monitor.url}</p>
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
                      <span>
                        Response:{" "}
                        <b className="text-slate-300">
                          {monitor.responseTime != null ? `${monitor.responseTime} ms` : "—"}
                        </b>
                      </span>
                      <span>
                        Last checked:{" "}
                        <b className="text-slate-300">{formatChecked(monitor.lastChecked)}</b>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        !monitor.enabled
                          ? "bg-slate-800 text-slate-400"
                          : monitor.status === "UP"
                            ? "bg-emerald-950 text-emerald-400"
                            : monitor.status === "DOWN"
                              ? "bg-red-950 text-red-400"
                              : "bg-yellow-950 text-yellow-400"
                      }`}
                    >
                      {!monitor.enabled ? "DISABLED" : monitor.status}
                    </span>

                    <button
                      onClick={() => void toggleMonitor(monitor)}
                      className="text-sm text-slate-400 hover:text-white"
                    >
                      {monitor.enabled ? "Disable" : "Enable"}
                    </button>

                    <button
                      onClick={() => void deleteMonitor(monitor.id)}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
