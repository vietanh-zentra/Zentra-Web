"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/utils/api";
import LoadingSpinner from "@/components/LoadingSpinner";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const hasToken = Boolean(token);

  const [verifyStatus, setVerifyStatus] = useState(
    hasToken ? "verifying" : "idle"
  );
  const [sendStatus, setSendStatus] = useState(hasToken ? "idle" : "sending");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [email, setEmail] = useState("");
  const [autoRequested, setAutoRequested] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setEmail(localStorage.getItem("pendingVerificationEmail") || "");
    }
  }, []);

  useEffect(() => {
    if (token) {
      setVerifyStatus("verifying");
      setError("");
      setInfoMessage("");

      apiClient
        .verifyEmail(token)
        .then(() => {
          setVerifyStatus("success");
          setInfoMessage("Your email has been verified. You can continue.");
          if (typeof window !== "undefined") {
            localStorage.removeItem("pendingVerificationEmail");
          }
        })
        .catch((err) => {
          setVerifyStatus("error");
          setError(
            err.message || "Verification failed. Request a new link below."
          );
        });
    }
  }, [token]);

  const handleSendVerification = useCallback(
    async (isAuto = false) => {
      if (hasToken) return;

      setSendStatus("sending");
      setError("");
      if (!isAuto) {
        setInfoMessage("");
      }

      try {
        // Check if user has authentication token
        const token = apiClient.getToken();
        if (!token) {
          setError("Please sign in to request a verification email.");
          setSendStatus("unauthorized");
          return;
        }

        await apiClient.sendVerificationEmail();
        setSendStatus(isAuto ? "sent" : "resent");
        setInfoMessage(
          isAuto
            ? "We just sent a verification link to your inbox."
            : "A new verification email is on its way."
        );
      } catch (err) {
        console.error("Send verification email error:", err);
        const message =
          err.message || "Unable to send the verification email right now.";
        setError(message);
        if (
          message.toLowerCase().includes("authenticate") ||
          err.status === 401
        ) {
          setSendStatus("unauthorized");
        } else if (err.status === 500) {
          setError(
            "Server error. Please try again in a moment or contact support."
          );
          setSendStatus("error");
        } else {
          setSendStatus("error");
        }
      }
    },
    [hasToken]
  );

  useEffect(() => {
    if (!hasToken && !autoRequested) {
      setAutoRequested(true);
      handleSendVerification(true);
    }
  }, [autoRequested, hasToken, handleSendVerification]);

  const handleRequestNewLink = () => {
    router.replace("/auth/verify-email");
  };

  const renderTokenState = () => {
    if (verifyStatus === "verifying") {
      return (
        <div className="space-y-4 text-center">
          <LoadingSpinner className="w-12 h-12 mx-auto" />
          <p className="text-gray-700 font-medium">
            Verifying your email. Hang tight...
          </p>
        </div>
      );
    }

    if (verifyStatus === "success") {
      return (
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl">
              ✓
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Email verified!
            </h1>
            <p className="text-gray-600 mt-2">{infoMessage}</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all duration-300"
            >
              Go to dashboard
            </button>
            <Link
              href="/auth/login"
              className="block text-sm text-primary font-medium hover:text-tertiary"
            >
              Back to login
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-3xl">
            !
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Verification failed
          </h1>
          <p className="text-gray-600 mt-2">
            {error || "The link may have expired. Request a new one below."}
          </p>
        </div>
        <button
          onClick={handleRequestNewLink}
          className="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all duration-300"
        >
          Request a new link
        </button>
      </div>
    );
  };

  const renderInstructions = () => (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary mb-2">
          Verify your email
        </p>
        <h1 className="text-3xl font-semibold text-gray-900">
          Check your inbox
        </h1>
        <p className="text-gray-600 mt-3">
          {infoMessage ||
            "We sent you a link to confirm your email. Click it to start using your account."}
        </p>
        {email && (
          <p className="text-gray-800 font-medium mt-2 break-words">{email}</p>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={() => handleSendVerification(false)}
          disabled={sendStatus === "sending"}
          className="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {sendStatus === "sending"
            ? "Sending..."
            : "Resend verification email"}
        </button>
        <p className="text-sm text-gray-500 text-center">
          Didn{"'"}t get it? Check spam or click resend above.
        </p>
      </div>

      <div className="pt-4 border-t border-gray-100 space-y-2 text-center">
        {sendStatus === "unauthorized" ? (
          <p className="text-sm text-gray-600">
            Session expired.{" "}
            <Link
              href="/auth/login"
              className="text-primary font-medium hover:text-tertiary"
            >
              Sign in
            </Link>{" "}
            to request a new email.
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Use a different email address?
            </p>
            <Link
              href="/auth/signup"
              className="text-primary font-medium hover:text-tertiary"
            >
              Go back to sign up
            </Link>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        {hasToken ? renderTokenState() : renderInstructions()}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6">
          <LoadingSpinner className="w-12 h-12" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
