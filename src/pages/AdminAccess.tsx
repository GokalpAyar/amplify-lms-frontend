import { SignIn, SignUp, useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const AdminAccess = () => {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") === "sign-up" ? "sign-up" : "sign-in";

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      navigate("/dashboard/teacher", { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  const handleViewChange = (nextView: "sign-in" | "sign-up") => {
    if (nextView === "sign-in") {
      const params = new URLSearchParams(searchParams);
      params.delete("view");
      setSearchParams(params, { replace: true });
      return;
    }

    setSearchParams({ view: "sign-up" }, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-xl">
        <div className="text-center">
          <p className="text-sm uppercase tracking-wide text-blue-600 font-semibold">
            Amplify LMS
          </p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">
            Access Your Demo Workspace
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Use the hosted Clerk experience to sign in or create a demo account.
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3 rounded-full bg-blue-50 p-1">
          <button
            type="button"
            onClick={() => handleViewChange("sign-in")}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
              view === "sign-in"
                ? "bg-white shadow text-blue-700"
                : "text-blue-500 hover:text-blue-700"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => handleViewChange("sign-up")}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
              view === "sign-up"
                ? "bg-white shadow text-blue-700"
                : "text-blue-500 hover:text-blue-700"
            }`}
          >
            Sign up
          </button>
        </div>

        <div className="mt-6 flex justify-center">
          {view === "sign-in" ? (
            <SignIn
              afterSignInUrl="/dashboard/teacher"
              signUpUrl="/admin?view=sign-up"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border border-gray-200",
                },
              }}
            />
          ) : (
            <SignUp
              afterSignUpUrl="/dashboard/teacher"
              signInUrl="/admin"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border border-gray-200",
                },
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAccess;

