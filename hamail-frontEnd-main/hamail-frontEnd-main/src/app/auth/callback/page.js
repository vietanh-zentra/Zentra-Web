"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/utils/api";
import LoadingSpinner from "@/components/LoadingSpinner";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    // Handle OAuth callback from backend
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (accessToken && refreshToken) {
      // Store tokens
      apiClient.setTokens(accessToken, refreshToken);

      // Redirect to dashboard
      router.push("/dashboard");
    } else {
      setError("Authentication failed. Please try again.");
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    }
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="p-6 bg-red-500/20 border border-red-500/50 rounded-lg max-w-md">
          <h2 className="text-xl font-bold text-red-500 mb-2">
            Authentication Error
          </h2>
          <p className="text-red-400">{error}</p>
          <p className="text-red-400 mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <LoadingSpinner className="w-16 h-16 mb-4" />
      <p className="text-primary text-lg">Completing authentication...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary/95 to-secondary/90 flex flex-col items-center justify-center p-6">
          <LoadingSpinner className="w-16 h-16 mb-4" />
          <p className="text-primary text-lg">Loading...</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
