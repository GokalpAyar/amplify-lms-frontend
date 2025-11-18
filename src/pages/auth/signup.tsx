import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BASE_URL } from "@/config";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(false);

      if (password !== confirm) {
        setError("Passwords do not match");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/users/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const contentType = res.headers.get("content-type") ?? "";
        let data: any = null;
        let rawText: string | null = null;

        try {
          if (contentType.includes("application/json")) {
            data = await res.json();
          } else {
            rawText = await res.text();
          }
        } catch (parseError) {
          console.warn("Unable to parse signup response body", parseError);
        }

        if (!res.ok) {
          const cleanedHtml =
            rawText?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || null;

          const serverMessage =
            data?.detail ||
            data?.message ||
            data?.error ||
            cleanedHtml ||
            `Signup failed (status ${res.status})`;

          throw new Error(serverMessage);
        }

        setSuccess(true);
        setTimeout(() => navigate("/login"), 2000);
      } catch (err: unknown) {
        console.error("Signup failed:", err);
        if (err instanceof TypeError) {
          setError("Unable to reach the server. Please check your connection and try again.");
          return;
        }
        if (err instanceof Error) {
          setError(err.message || "Failed to sign up");
          return;
        }
        setError("Failed to sign up");
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center text-blue-700">
          Amplify LMS – Instructor Signup
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full border rounded-md p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full border rounded-md p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a strong password"
              className="w-full border rounded-md p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter your password"
              className="w-full border rounded-md p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
              required
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">✅ Account created! Redirecting...</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-4 text-sm text-center text-gray-600">
        Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Log in
            </Link>
        </div>
      </div>
    </div>
  );
}
