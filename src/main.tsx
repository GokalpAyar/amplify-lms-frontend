import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import AppRouter from "./router";
import { Toaster } from "react-hot-toast";
import { LoadingProvider } from "./context/LoadingContext";
import { ClerkProvider } from "@clerk/clerk-react";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in environment");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <LoadingProvider>
        <AppRouter />
        <Toaster position="top-right" />
      </LoadingProvider>
    </ClerkProvider>
  </React.StrictMode>
);
