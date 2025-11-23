import { SignIn, SignUp, useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const cardAppearance = {
  elements: {
    rootBox: "w-full",
    card: "shadow-none border border-gray-200 w-full",
  },
};

const AdminAccess = () => {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();
  const [showSignUp, setShowSignUp] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      navigate("/dashboard/teacher", { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-3xl">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-sm uppercase tracking-wide text-blue-600 font-semibold">
              Amplify LMS
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">Access Your Demo Workspace</h1>
            <p className="text-sm text-gray-600 mt-2">
              Use the hosted Clerk experience to sign in or create a demo account.
            </p>
          </div>

          <div className="mt-10 flex justify-center">
            <div
              className={`flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-gray-200 p-6 ${
                showSignUp ? "bg-emerald-50/60" : "bg-blue-50/40"
              }`}
            >
              <div className="text-center space-y-1">
                <p
                  className={`text-xs uppercase tracking-wide font-semibold ${
                    showSignUp ? "text-emerald-600" : "text-blue-600"
                  }`}
                >
                  {showSignUp ? "New to Amplify" : "Returning user"}
                </p>
                <h2 className="text-xl font-semibold text-gray-900">
                  {showSignUp ? "Create an account" : "Sign in"}
                </h2>
                <p className="text-sm text-gray-600">
                  {showSignUp
                    ? "Spin up a fresh demo profile with Clerk's hosted onboarding."
                    : "Continue right where you left off in the teacher dashboard."}
                </p>
              </div>
              {showSignUp ? (
                <SignUp
                  afterSignUpUrl="/dashboard/teacher"
                  signInUrl="/admin"
                  appearance={cardAppearance}
                />
              ) : (
                <SignIn
                  afterSignInUrl="/dashboard/teacher"
                  signUpUrl="/admin"
                  appearance={cardAppearance}
                />
              )}
              <button
                type="button"
                onClick={() => setShowSignUp((prev) => !prev)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {showSignUp ? "Have an account? Sign in" : "Need an account? Sign up"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
};

export default AdminAccess;

