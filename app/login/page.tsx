"use client";

import "../amplify-config";

import { FormEvent, useState } from "react";
import {
  signIn,
  signUp,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
  resendSignUpCode,
  getCurrentUser,
  signOut,
} from "aws-amplify/auth";

type Mode =
  | "signin"
  | "signup"
  | "forgot"
  | "confirm-signup"
  | "confirm-reset";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const clearMessages = () => {
    setMessage("");
    setError("");
  };

  async function handleSignIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    clearMessages();
    setLoading(true);

    try {
      /*
       * PulseCheck is intentionally single-session per browser.
       * When another account is already signed in locally, silently
       * sign it out before authenticating the newly entered account.
       */
      try {
        await getCurrentUser();
        await signOut();
      } catch {
        // No existing local session. Continue normally.
      }

      window.sessionStorage.removeItem("pulsecheck-session-id");

      const result = await signIn({
        username: email.trim(),
        password,
      });

      if (result.isSignedIn) {
        await getCurrentUser();
        window.location.replace("/");
        return;
      }

      if (result.nextStep?.signInStep === "CONFIRM_SIGN_UP") {
        setMode("confirm-signup");
        setMessage("Please confirm your email address.");
      } else {
        setMessage("Additional verification is required.");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unable to sign in.";

      if (errorMessage.toLowerCase().includes("already a signed in user")) {
        try {
          await signOut();
        } catch {
          // Ignore local cleanup errors.
        }
        window.sessionStorage.removeItem("pulsecheck-session-id");
        setMessage("Please sign in again.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    clearMessages();
    setLoading(true);

    try {
      const result = await signUp({
        username: email.trim(),
        password,
        options: {
          userAttributes: {
            email: email.trim(),
          },
        },
      });

      if (result.nextStep?.signUpStep === "CONFIRM_SIGN_UP") {
        setMode("confirm-signup");
        setMessage("A verification code has been sent to your email.");
      } else {
        setMode("signin");
        setMessage("Account created successfully. You can now sign in.");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unable to create account.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmSignUp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    clearMessages();
    setLoading(true);

    try {
      await confirmSignUp({
        username: email.trim(),
        confirmationCode: confirmationCode.trim(),
      });

      setMode("signin");
      setConfirmationCode("");
      setMessage("Email verified successfully. You can now sign in.");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Invalid verification code.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    clearMessages();
    setLoading(true);

    try {
      await resendSignUpCode({
        username: email.trim(),
      });

      setMessage("A new verification code has been sent.");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unable to resend the code.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    clearMessages();
    setLoading(true);

    try {
      const result = await resetPassword({
        username: email.trim(),
      });

      if (
        result.nextStep.resetPasswordStep ===
        "CONFIRM_RESET_PASSWORD_WITH_CODE"
      ) {
        setMode("confirm-reset");
        setMessage("A password reset code has been sent to your email.");
      } else {
        setMessage("Password reset instructions have been sent.");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unable to reset password.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    clearMessages();
    setLoading(true);

    try {
      await confirmResetPassword({
        username: email.trim(),
        confirmationCode: confirmationCode.trim(),
        newPassword,
      });

      setMode("signin");
      setPassword("");
      setNewPassword("");
      setConfirmationCode("");
      setShowPassword(false);
      setShowNewPassword(false);

      setMessage("Password changed successfully. You can now sign in.");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unable to change password.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  function switchToSignIn() {
    clearMessages();
    setMode("signin");
  }

  function switchToSignUp() {
    clearMessages();
    setPassword("");
    setShowPassword(false);
    setMode("signup");
  }

  function switchToForgot() {
    clearMessages();
    setPassword("");
    setShowPassword(false);
    setMode("forgot");
  }

  const inputClass =
    "w-full rounded-xl border border-[#202a3a] bg-[#111827] px-4 py-3.5 text-[15px] text-white outline-none transition-all duration-150 placeholder:text-[#71809a] hover:border-[#3b82f6] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]";

  const buttonClass =
    "w-full rounded-xl bg-[#4f8df7] px-4 py-3.5 text-[15px] font-medium text-white transition-all duration-150 hover:bg-[#4383ed] hover:shadow-[0_0_22px_rgba(79,141,247,0.22)] disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <main className="min-h-screen bg-[#070a0f] text-white">
      <div className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-[422px]">
          <div className="mb-7 flex flex-col items-center">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#244b85] bg-[#0d182b]">
                <svg
                  width="23"
                  height="23"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 12H7L9.5 5L14 19L16.5 12H21"
                    stroke="#4f8df7"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div>
                <div className="text-[19px] font-semibold tracking-tight">
                  PulseCheck
                </div>
                <div className="mt-0.5 text-[9px] tracking-[0.25em] text-[#6d88a9]">
                  UPTIME INTELLIGENCE
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#202a3a] bg-[#0e131c] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
            {mode === "signin" && (
              <>
                <div className="mb-6">
                  <h1 className="text-[23px] font-semibold tracking-tight">
                    Welcome back
                  </h1>
                  <p className="mt-1.5 text-[14px] text-[#7890ae]">
                    Sign in to continue monitoring your services.
                  </p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-5">
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-[12px] font-medium text-[#8da6c5]"
                    >
                      Email address
                    </label>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-[12px] font-medium text-[#8da6c5]"
                    >
                      Password
                    </label>

                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                        className={`${inputClass} pr-12`}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((value) => !value)
                        }
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#71809a] transition-colors hover:text-[#a9bdd8]"
                      >
                        {showPassword ? (
                          <svg
                            width="19"
                            height="19"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M3 3L21 21"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinecap="round"
                            />
                            <path
                              d="M10.6 10.6C10.2 11 10 11.5 10 12C10 13.1 10.9 14 12 14C12.5 14 13 13.8 13.4 13.4"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinecap="round"
                            />
                            <path
                              d="M9.9 5.2C10.6 5.1 11.3 5 12 5C17.5 5 21 12 21 12C21 12 19.7 14.6 17.4 16.7"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M6.6 6.6C4.2 8.4 3 12 3 12C3 12 6.5 19 12 19C13.3 19 14.5 18.7 15.5 18.3"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          <svg
                            width="19"
                            height="19"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M2.5 12C2.5 12 6 5 12 5C18 5 21.5 12 21.5 12C21.5 12 18 19 12 19C6 19 2.5 12 2.5 12Z"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinejoin="round"
                            />
                            <circle
                              cx="12"
                              cy="12"
                              r="3"
                              stroke="currentColor"
                              strokeWidth="1.7"
                            />
                          </svg>
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={switchToForgot}
                      className="mt-2.5 text-[13px] text-[#4f8df7] transition-colors hover:text-[#75a8ff]"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {error && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3.5 py-3 text-[13px] text-red-400">
                      {error}
                    </div>
                  )}

                  {message && (
                    <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-3.5 py-3 text-[13px] text-green-400">
                      {message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className={buttonClass}
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </button>
                </form>

                <div className="mt-6 text-center text-[13px] text-[#71809a]">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={switchToSignUp}
                    className="font-medium text-[#4f8df7] hover:text-[#75a8ff]"
                  >
                    Sign up
                  </button>
                </div>
              </>
            )}

            {mode === "signup" && (
              <>
                <div className="mb-6">
                  <h1 className="text-[23px] font-semibold tracking-tight">
                    Create your account
                  </h1>
                  <p className="mt-1.5 text-[14px] text-[#7890ae]">
                    Start monitoring your services.
                  </p>
                </div>

                <form onSubmit={handleSignUp} className="space-y-5">
                  <div>
                    <label
                      htmlFor="signup-email"
                      className="mb-2 block text-[12px] font-medium text-[#8da6c5]"
                    >
                      Email address
                    </label>

                    <input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="signup-password"
                      className="mb-2 block text-[12px] font-medium text-[#8da6c5]"
                    >
                      Password
                    </label>

                    <div className="relative">
                      <input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        className={`${inputClass} pr-12`}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((value) => !value)
                        }
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#71809a] transition-colors hover:text-[#a9bdd8]"
                      >
                        {showPassword ? "◉" : "◌"}
                      </button>
                    </div>

                    <p className="mt-2 text-[11px] leading-5 text-[#60728d]">
                      Minimum 8 characters with uppercase, lowercase, number
                      and symbol.
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3.5 py-3 text-[13px] text-red-400">
                      {error}
                    </div>
                  )}

                  {message && (
                    <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-3.5 py-3 text-[13px] text-green-400">
                      {message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className={buttonClass}
                  >
                    {loading ? "Creating account..." : "Create account"}
                  </button>
                </form>

                <div className="mt-6 text-center text-[13px] text-[#71809a]">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={switchToSignIn}
                    className="font-medium text-[#4f8df7] hover:text-[#75a8ff]"
                  >
                    Sign in
                  </button>
                </div>
              </>
            )}

            {mode === "confirm-signup" && (
              <>
                <div className="mb-6">
                  <h1 className="text-[23px] font-semibold tracking-tight">
                    Verify your email
                  </h1>
                  <p className="mt-1.5 text-[14px] text-[#7890ae]">
                    Enter the verification code sent to your email.
                  </p>
                </div>

                <form
                  onSubmit={handleConfirmSignUp}
                  className="space-y-5"
                >
                  <div>
                    <label
                      htmlFor="confirmation-code"
                      className="mb-2 block text-[12px] font-medium text-[#8da6c5]"
                    >
                      Verification code
                    </label>

                    <input
                      id="confirmation-code"
                      type="text"
                      value={confirmationCode}
                      onChange={(e) =>
                        setConfirmationCode(e.target.value)
                      }
                      placeholder="Enter verification code"
                      autoComplete="one-time-code"
                      required
                      className={inputClass}
                    />
                  </div>

                  {error && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3.5 py-3 text-[13px] text-red-400">
                      {error}
                    </div>
                  )}

                  {message && (
                    <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-3.5 py-3 text-[13px] text-green-400">
                      {message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className={buttonClass}
                  >
                    {loading ? "Verifying..." : "Verify email"}
                  </button>
                </form>

                <div className="mt-5 text-center">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-[13px] text-[#4f8df7] hover:text-[#75a8ff]"
                  >
                    Resend code
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={switchToSignIn}
                    className="text-[13px] text-[#71809a] hover:text-white"
                  >
                    Back to sign in
                  </button>
                </div>
              </>
            )}

            {mode === "forgot" && (
              <>
                <div className="mb-6">
                  <h1 className="text-[23px] font-semibold tracking-tight">
                    Forgot password?
                  </h1>
                  <p className="mt-1.5 text-[14px] text-[#7890ae]">
                    Enter your email and we'll send you a reset code.
                  </p>
                </div>

                <form
                  onSubmit={handleForgotPassword}
                  className="space-y-5"
                >
                  <div>
                    <label
                      htmlFor="forgot-email"
                      className="mb-2 block text-[12px] font-medium text-[#8da6c5]"
                    >
                      Email address
                    </label>

                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      className={inputClass}
                    />
                  </div>

                  {error && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3.5 py-3 text-[13px] text-red-400">
                      {error}
                    </div>
                  )}

                  {message && (
                    <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-3.5 py-3 text-[13px] text-green-400">
                      {message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className={buttonClass}
                  >
                    {loading ? "Sending..." : "Send reset code"}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={switchToSignIn}
                    className="text-[13px] text-[#71809a] hover:text-white"
                  >
                    Back to sign in
                  </button>
                </div>
              </>
            )}

            {mode === "confirm-reset" && (
              <>
                <div className="mb-6">
                  <h1 className="text-[23px] font-semibold tracking-tight">
                    Reset password
                  </h1>
                  <p className="mt-1.5 text-[14px] text-[#7890ae]">
                    Enter the code from your email and choose a new password.
                  </p>
                </div>

                <form
                  onSubmit={handleConfirmReset}
                  className="space-y-5"
                >
                  <div>
                    <label
                      htmlFor="reset-code"
                      className="mb-2 block text-[12px] font-medium text-[#8da6c5]"
                    >
                      Reset code
                    </label>

                    <input
                      id="reset-code"
                      type="text"
                      value={confirmationCode}
                      onChange={(e) =>
                        setConfirmationCode(e.target.value)
                      }
                      placeholder="Enter reset code"
                      autoComplete="one-time-code"
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="new-password"
                      className="mb-2 block text-[12px] font-medium text-[#8da6c5]"
                    >
                      New password
                    </label>

                    <div className="relative">
                      <input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) =>
                          setNewPassword(e.target.value)
                        }
                        placeholder="Enter new password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        className={`${inputClass} pr-12`}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowNewPassword((value) => !value)
                        }
                        aria-label={
                          showNewPassword
                            ? "Hide new password"
                            : "Show new password"
                        }
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#71809a] transition-colors hover:text-[#a9bdd8]"
                      >
                        {showNewPassword ? "◉" : "◌"}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3.5 py-3 text-[13px] text-red-400">
                      {error}
                    </div>
                  )}

                  {message && (
                    <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-3.5 py-3 text-[13px] text-green-400">
                      {message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className={buttonClass}
                  >
                    {loading ? "Updating..." : "Reset password"}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={switchToSignIn}
                    className="text-[13px] text-[#71809a] hover:text-white"
                  >
                    Back to sign in
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-[#60728d]">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 3L19 6V11C19 15.5 16.1 19.2 12 21C7.9 19.2 5 15.5 5 11V6L12 3Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M8.5 12L10.8 14.3L15.5 9.6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>

            <span>Secure cloud-based monitoring</span>
          </div>
        </div>
      </div>
    </main>
  );
}