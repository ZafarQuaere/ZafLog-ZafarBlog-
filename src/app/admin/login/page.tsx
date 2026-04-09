"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import Link from "next/link";

function authErrorMessage(err: unknown, fallback: string, mode: "signin" | "reset" = "signin"): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return "Invalid email or password.";
      case "auth/user-not-found":
        return mode === "reset" ? "No account uses that email address." : "Invalid email or password.";
      case "auth/invalid-email":
        return "Invalid email or password.";
      case "auth/unauthorized-domain":
        return "This site’s domain is not allowed for sign-in. In Firebase Console → Authentication → Settings → Authorized domains, add your hosting domain (for App Hosting, the *.hosted.app URL).";
      case "auth/too-many-requests":
        return "Too many sign-in attempts. Wait a few minutes and try again.";
      case "auth/user-disabled":
        return "This account has been disabled in Firebase.";
      case "auth/network-request-failed":
        return "Network error. Check your connection and try again.";
      default:
        return err.message || fallback;
    }
  }
  return fallback;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      router.replace("/admin");
    } catch (err) {
      setError(authErrorMessage(err, "Invalid email or password."));
    } finally {
      setLoading(false);
    }
  }

  async function onReset() {
    setError("");
    if (!email) {
      setError("Enter your email to reset password.");
      return;
    }
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
      setError("");
      alert("Password reset email sent.");
    } catch (err) {
      setError(authErrorMessage(err, "Could not send reset email.", "reset"));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Admin login</h1>
        <p className="mt-1 text-sm text-zinc-500">Sign in to manage your blog.</p>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
          <Button type="button" variant="ghost" onClick={onReset}>
            Forgot password?
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/" className="underline">
            Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}
