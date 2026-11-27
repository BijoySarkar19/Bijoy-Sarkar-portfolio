"use client";

import { FormEvent, useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, Lock } from "lucide-react";

export function AdminLogin() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const clearAllCredentials = () => {
    setUsername("");
    setEmail("");
    setPassword("");
  };

  // Restore active lockout countdown on mount or page refresh and sync with server
  useEffect(() => {
    try {
      const stored = localStorage.getItem("admin_lockout_until");
      if (stored) {
        const targetTime = parseInt(stored, 10);
        const remaining = Math.ceil((targetTime - Date.now()) / 1000);
        if (remaining > 0) {
          setLockoutSeconds(remaining);
        } else {
          localStorage.removeItem("admin_lockout_until");
        }
      }
    } catch {
      // Storage access safety
    }

    // Query server for live lockout state
    fetch("/api/admin/auth-status?identifier=bijoysarkar7252@gmail.com")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.locked && data.remainingSeconds > 0) {
          setLockoutSeconds(data.remainingSeconds);
          try {
            localStorage.setItem("admin_lockout_until", String(Date.now() + data.remainingSeconds * 1000));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  // Ticking countdown clock every 1 second
  useEffect(() => {
    if (lockoutSeconds <= 0) return;

    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          try {
            localStorage.removeItem("admin_lockout_until");
          } catch {}
          setMessage("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lockoutSeconds > 0) return;

    setPending(true);
    setMessage("");
    const usernameVal = username.trim();
    const emailVal = email.trim();
    const passwordVal = password;

    try {
      const result = await signIn("credentials", {
        username: usernameVal,
        email: emailVal,
        password: passwordVal,
        redirect: false,
        callbackUrl: "/admin-admin/dashboard",
      });

      if (result?.error) {
        // If any credential is wrong, wipe all fields so the user must put them all in again
        clearAllCredentials();

        const errStr = result.error;
        let isLockout =
          errStr.startsWith("LOCKOUT:") ||
          errStr.toLowerCase().includes("15 minutes") ||
          errStr.toLowerCase().includes("attempts") ||
          errStr.toLowerCase().includes("too many");

        let sec = 15 * 60; // 900 seconds default
        if (errStr.startsWith("LOCKOUT:")) {
          const parts = errStr.split(":");
          const parsed = parseInt(parts[1], 10);
          if (!isNaN(parsed) && parsed > 0) {
            sec = parsed;
          }
        }

        // Also query live server status in case NextAuth masked the error as CredentialsSignin
        try {
          const checkRes = await fetch(`/api/admin/auth-status?identifier=${encodeURIComponent(emailVal || usernameVal)}`);
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (checkData.locked) {
              isLockout = true;
              sec = checkData.remainingSeconds || 900;
            }
          }
        } catch {}

        if (isLockout) {
          setLockoutSeconds(sec);
          try {
            localStorage.setItem("admin_lockout_until", String(Date.now() + sec * 1000));
          } catch {}
          setMessage("");
        } else {
          setMessage("Those credentials did not match an admin account.");
        }
        return;
      }

      try {
        localStorage.removeItem("admin_lockout_until");
      } catch {}
      router.replace("/admin-admin/dashboard");
      router.refresh();
    } catch {
      clearAllCredentials();
      setMessage("Sign-in is temporarily unavailable. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const isLocked = lockoutSeconds > 0;
  const minutes = Math.floor(lockoutSeconds / 60);
  const seconds = lockoutSeconds % 60;
  const formattedCountdown = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <form className="admin-login-form" onSubmit={submit}>
      {isLocked ? (
        <p className="admin-alert" role="alert" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Lock size={15} style={{ color: "var(--orange)", flexShrink: 0 }} />
          <span>
            Too many failed sign-in attempts. Please wait <strong>{formattedCountdown}</strong> before retrying.
          </span>
        </p>
      ) : message ? (
        <p className="admin-alert" role="alert">
          {message}
        </p>
      ) : null}

      <div className="field">
        <label htmlFor="admin-username">Username</label>
        <input
          id="admin-username"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          minLength={2}
          maxLength={64}
          disabled={isLocked || pending}
        />
      </div>
      <div className="field">
        <label htmlFor="admin-email">Email</label>
        <input
          id="admin-email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          maxLength={254}
          disabled={isLocked || pending}
        />
      </div>
      <div className="field">
        <label htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          maxLength={128}
          disabled={isLocked || pending}
        />
      </div>
      <button
        className="button"
        type="submit"
        disabled={pending || isLocked}
        style={isLocked ? { cursor: "not-allowed", opacity: 0.65, filter: "grayscale(0.3)" } : undefined}
      >
        {isLocked ? (
          <>
            Locked ({formattedCountdown}) <Lock size={14} />
          </>
        ) : pending ? (
          <>
            Checking… <KeyRound size={14} />
          </>
        ) : (
          <>
            Sign in <ArrowRight size={14} />
          </>
        )}
      </button>
    </form>
  );
}
