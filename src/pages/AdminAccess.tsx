import { SignIn, SignUp, useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
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

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      navigate("/dashboard/teacher", { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-5xl">
        <div className="text-center max-w-2xl mx-auto">
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

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-blue-50/40 p-6">
            <div className="text-center space-y-1">
              <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">
                Returning user
              </p>
              <h2 className="text-xl font-semibold text-gray-900">Sign in</h2>
              <p className="text-sm text-gray-600">
                Continue right where you left off in the teacher dashboard.
              </p>
            </div>
            <SignIn
              afterSignInUrl="/dashboard/teacher"
              signUpUrl="/admin#sign-up"
              appearance={cardAppearance}
            />
          </div>

          <div
            id="sign-up"
            className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-emerald-50/60 p-6"
          >
            <div className="text-center space-y-1">
              <p className="text-xs uppercase tracking-wide text-emerald-600 font-semibold">
                New to Amplify
              </p>
              <h2 className="text-xl font-semibold text-gray-900">Create an account</h2>
              <p className="text-sm text-gray-600">
                Spin up a fresh demo profile with Clerk&apos;s hosted onboarding.
              </p>
            </div>
            <SignUp
              afterSignUpUrl="/dashboard/teacher"
              signInUrl="/admin"
              appearance={cardAppearance}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAccess;

