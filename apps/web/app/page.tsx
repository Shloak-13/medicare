"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = window.localStorage.getItem("medicare_token");
    router.replace(token ? "/dashboard" : "/login");
  }, [router]);

  return <main className="min-h-screen bg-[#f6f8f5]" />;
}

