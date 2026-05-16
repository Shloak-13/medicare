"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { HeartPulse, LockKeyhole, Mail } from "lucide-react";
import { login } from "@/lib/api";

const demoUsers = [
  "mom@example.com",
  "dad@example.com",
  "me@example.com",
  "sister@example.com"
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("me@example.com");
  const [password, setPassword] = useState("ChangeMe123!");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const token = await login(email, password);
      window.localStorage.setItem("medicare_token", token.access_token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen grid-cols-1 bg-[#f6f8f5] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="flex min-h-screen flex-col justify-between bg-ink p-8 text-white">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded bg-mint text-teal">
            <HeartPulse size={25} />
          </div>
          <div>
            <p className="text-lg font-semibold">Medicare Family Health</p>
            <p className="text-sm text-white/65">Private family records workspace</p>
          </div>
        </div>

        <div className="max-w-2xl py-16">
          <h1 className="text-5xl font-semibold leading-tight md:text-6xl">
            Secure healthcare records for your family.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/72">
            Parents and siblings have separate protected data groups, with each member controlling their own records.
          </p>
        </div>

        <div className="grid gap-3 text-sm text-white/70 md:grid-cols-3">
          <p>JWT authentication</p>
          <p>Dataset-level authorization</p>
          <p>PostgreSQL-backed records</p>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg border border-black/10 bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-semibold">Sign in</h2>
          <p className="mt-2 text-sm text-black/60">Use one of the seeded family accounts.</p>

          <label className="mt-6 block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <div className="mt-2 flex items-center gap-2 rounded border border-black/15 bg-white px-3">
            <Mail size={18} className="text-black/45" />
            <select
              id="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 flex-1 bg-transparent outline-none"
            >
              {demoUsers.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>

          <label className="mt-5 block text-sm font-medium" htmlFor="password">
            Password
          </label>
          <div className="mt-2 flex items-center gap-2 rounded border border-black/15 bg-white px-3">
            <LockKeyhole size={18} className="text-black/45" />
            <input
              id="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              className="h-11 flex-1 outline-none"
            />
          </div>

          {error ? <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 h-11 w-full rounded bg-teal font-semibold text-white transition hover:bg-[#1d625a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

