import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "@/config";

const AdminAccess = () => {
  const navigate = useNavigate();
  const [secretKey, setSecretKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("isAdmin") === "true") {
      navigate("/teacher/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!secretKey.trim()) {
      setError("Please enter the instructor key.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${BASE_URL}/auth/validate-key`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: secretKey.trim() }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.valid) {
        setError("Invalid key");
        return;
      }

      localStorage.setItem("isAdmin", "true");
      navigate("/teacher/dashboard", { replace: true });
    } catch (err) {
      console.error("Failed to validate key", err);
      setError("Unable to validate key. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center text-blue-700">
          Amplify LMS – Demo Access
        </h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Enter the instructor secret key to explore the demo dashboards.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Instructor Key
            </label>
            <input
              type="password"
              value={secretKey}
              onChange={(event) => setSecretKey(event.target.value)}
              placeholder="Enter secret key"
              className="w-full border rounded-md p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isSubmitting ? "Validating..." : "Unlock Demo"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminAccess;

