// src/pages/Login.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";

type Mode = "login" | "signup" | "forgot";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("login");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // If already logged in, go straight to teacher dashboard
  useEffect(() => {
    const existingToken = localStorage.getItem("token");
    if (existingToken) {
      navigate("/dashboard/teacher", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      throw new Error("Email is required.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error) throw new Error(error.message);
    if (!data.session?.access_token) {
      throw new Error("No session token returned from Supabase.");
    }

    localStorage.setItem("token", data.session.access_token);
    localStorage.setItem("userRole", "teacher");

    if (data.user?.id) localStorage.setItem("userId", data.user.id);
    if (data.user?.email) localStorage.setItem("userEmail", data.user.email);

    navigate("/dashboard/teacher", { replace: true });
  };

  const handleSignUp = async () => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmedUsername) {
      throw new Error("Username is required.");
    }

    if (!trimmedEmail) {
      throw new Error("Email is required.");
    }

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          username: trimmedUsername,
        },
      },
    });

    if (error) throw new Error(error.message);

    // If email confirmation is OFF, session may be returned immediately
    if (data.session?.access_token) {
      localStorage.setItem("token", data.session.access_token);
      localStorage.setItem("userRole", "teacher");

      if (data.user?.id) localStorage.setItem("userId", data.user.id);
      if (data.user?.email) localStorage.setItem("userEmail", data.user.email);

      navigate("/dashboard/teacher", { replace: true });
      return;
    }

    // If email confirmation is ON
    setMessage(
      "Account created successfully. Please check your email to confirm your account before logging in."
    );
    setMode("login");
    setPassword("");
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      throw new Error("Email is required.");
    }

    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw new Error(error.message);

    setMessage(
      "If an instructor account exists for this email, a password reset link has been sent."
    );
    setMode("login");
    setPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await handleLogin();
      } else if (mode === "signup") {
        await handleSignUp();
      } else {
        await handleForgotPassword();
      }
    } catch (err: unknown) {
      console.error(`${mode} failed:`, err);
      setError(getErrorMessage(err, `${mode} failed`));
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<Mode, string> = {
    login: "Amplify LMS – Instructor Login",
    signup: "Amplify LMS – Instructor Sign Up",
    forgot: "Amplify LMS – Reset Password",
  };

  const getButtonLabel = () => {
    if (mode === "login") return loading ? "Logging in..." : "Login";
    if (mode === "signup") {
      return loading ? "Creating account..." : "Create Account";
    }
    return loading ? "Sending reset link..." : "Send Reset Link";
  };

  const buttonLabel = getButtonLabel();
  const title = titles[mode];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center text-blue-700">
          {title}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter a username"
                className="w-full border rounded-md p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
                required={mode === "signup"}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                mode === "forgot"
                  ? "Enter your account email"
                  : "Enter your email"
              }
              className="w-full border rounded-md p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
              required
            />
          </div>

          {mode !== "forgot" && (
            <div>
              <div className="flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setError(null);
                      setMessage(null);
                      setPassword("");
                    }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  mode === "login" ? "Enter your password" : "Create a password"
                }
                className="w-full border rounded-md p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
                required
              />
            </div>
          )}

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          {message && (
            <p className="text-green-600 text-sm text-center">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {buttonLabel}
          </button>
        </form>

        <div className="mt-4 text-sm text-center text-gray-600">
          {mode === "login" ? (
            <>
              Don’t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setMessage(null);
                }}
                className="text-blue-600 hover:underline"
              >
                Create one
              </button>
            </>
          ) : mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setMessage(null);
                }}
                className="text-blue-600 hover:underline"
              >
                Login
              </button>
            </>
          ) : (
            <>
              Remember your password?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setMessage(null);
                }}
                className="text-blue-600 hover:underline"
              >
                Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
