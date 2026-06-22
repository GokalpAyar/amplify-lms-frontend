// src/pages/ResetPassword.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/supabaseClient";

const appAuthKeys = ["token", "userRole", "userId", "userEmail"];

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

function getRecoveryParams() {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(
    window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash
  );

  return {
    code: searchParams.get("code"),
    accessToken:
      hashParams.get("access_token") || searchParams.get("access_token"),
    refreshToken:
      hashParams.get("refresh_token") || searchParams.get("refresh_token"),
    linkError:
      hashParams.get("error_description") ||
      searchParams.get("error_description") ||
      hashParams.get("error") ||
      searchParams.get("error"),
  };
}

function clearRecoveryUrl() {
  window.history.replaceState({}, document.title, "/reset-password");
}

export default function ResetPassword() {
  const [initializing, setInitializing] = useState(true);
  const [ready, setReady] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const prepareRecoverySession = async () => {
      setInitializing(true);
      setError(null);

      try {
        const recoveryParams = getRecoveryParams();

        if (recoveryParams.linkError) {
          throw new Error(recoveryParams.linkError.replace(/\+/g, " "));
        }

        if (recoveryParams.code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(recoveryParams.code);

          if (exchangeError) throw new Error(exchangeError.message);
          clearRecoveryUrl();
        } else if (recoveryParams.accessToken && recoveryParams.refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: recoveryParams.accessToken,
            refresh_token: recoveryParams.refreshToken,
          });

          if (sessionError) throw new Error(sessionError.message);
          clearRecoveryUrl();
        }

        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw new Error(sessionError.message);
        if (!data.session) {
          throw new Error(
            "This password reset link is invalid or expired. Request a new link from the login page."
          );
        }

        if (isMounted) setReady(true);
      } catch (err: unknown) {
        if (isMounted) {
          setReady(false);
          setError(
            getErrorMessage(
              err,
              "Unable to verify this password reset link."
            )
          );
        }
      } finally {
        if (isMounted) setInitializing(false);
      }
    };

    void prepareRecoverySession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw new Error(updateError.message);

      appAuthKeys.forEach((key) => localStorage.removeItem(key));
      await supabase.auth.signOut();

      setReady(false);
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password updated successfully. You can now log in.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to update password."));
    } finally {
      setLoading(false);
    }
  };

  const fieldsDisabled = initializing || loading || !ready;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center text-blue-700">
          Amplify LMS – Reset Password
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter a new password"
              className="w-full border rounded-md p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200 disabled:bg-gray-100"
              minLength={6}
              disabled={fieldsDisabled}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              className="w-full border rounded-md p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200 disabled:bg-gray-100"
              minLength={6}
              disabled={fieldsDisabled}
              required
            />
          </div>

          {initializing && (
            <p className="text-blue-600 text-sm text-center">
              Checking reset link...
            </p>
          )}

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          {message && (
            <p className="text-green-600 text-sm text-center">{message}</p>
          )}

          <button
            type="submit"
            disabled={fieldsDisabled}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Updating password..." : "Update Password"}
          </button>
        </form>

        <div className="mt-4 text-sm text-center text-gray-600">
          <Link to="/login" className="text-blue-600 hover:underline">
            Return to login
          </Link>
        </div>
      </div>
    </div>
  );
}
