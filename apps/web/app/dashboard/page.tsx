"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  FileText,
  HeartPulse,
  LogOut,
  Pill,
  ShieldCheck,
  Stethoscope,
  Upload
} from "lucide-react";
import {
  Appointment,
  getAppointments,
  getCurrentUser,
  getHealthMeasurements,
  getMedicalRecords,
  getMedications,
  HealthMeasurement,
  MedicalRecord,
  Medication,
  UserRead
} from "@/lib/api";

const navItems = [
  { label: "Dashboard", icon: HeartPulse, href: "/dashboard" },
  { label: "Records", icon: FileText, href: "/records" },
  { label: "Medications", icon: Pill, href: "/medications" },
  { label: "Doctors", icon: Stethoscope, href: "/doctors" },
  { label: "Appointments", icon: CalendarDays, href: "/appointments" },
  { label: "Uploads", icon: Upload, href: "/uploads" },
  { label: "Analytics", icon: CalendarDays, href: "/analytics" }
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserRead | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [measurements, setMeasurements] = useState<HealthMeasurement[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUser() {
      const token = window.localStorage.getItem("medicare_token");
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const [profile, medicalRecords, medicationList, appointmentList, measurementList] = await Promise.all([
          getCurrentUser(token),
          getMedicalRecords(token, "own"),
          getMedications(token, "own"),
          getAppointments(token, "own"),
          getHealthMeasurements(token, "own")
        ]);
        setUser(profile);
        setRecords(medicalRecords);
        setMedications(medicationList);
        setAppointments(appointmentList);
        setMeasurements(measurementList);
      } catch (err) {
        window.localStorage.removeItem("medicare_token");
        setError(err instanceof Error ? err.message : "Session expired");
        router.replace("/login");
      }
    }

    loadUser();
  }, [router]);

  const ownRecords = records.filter((record) => record.patient_user_id === user?.id);
  const latestRecord = records[0];
  const activeMedications = medications.filter((medication) => medication.is_active);
  const upcomingAppointments = appointments.filter((appointment) => {
    return appointment.status === "scheduled" && new Date(appointment.scheduled_at) >= new Date();
  });

  const metrics = [
    { label: "Your records", value: String(records.length), tone: "bg-mint text-teal" },
    { label: "Active medicines", value: String(activeMedications.length), tone: "bg-[#fde9df] text-coral" },
    { label: "Health readings", value: String(measurements.length), tone: "bg-[#fff1c9] text-[#956c12]" }
  ];

  function logout() {
    window.localStorage.removeItem("medicare_token");
    router.push("/login");
  }

  if (error) {
    return <main className="p-8">{error}</main>;
  }

  return (
    <main className="flex min-h-screen bg-[#f6f8f5]">
      <aside className="hidden w-72 border-r border-black/10 bg-white p-5 lg:block">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded bg-mint text-teal">
            <HeartPulse size={22} />
          </div>
          <div>
            <p className="font-semibold">Medicare</p>
            <p className="text-xs text-black/55">Family Health</p>
          </div>
        </div>

        <nav className="mt-8 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex h-10 w-full items-center gap-3 rounded px-3 text-left text-sm text-black/68 transition hover:bg-black/5"
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <section className="flex-1">
        <header className="flex min-h-16 items-center justify-between border-b border-black/10 bg-white px-5 md:px-8">
          <div>
            <p className="text-sm text-black/55">Signed in as</p>
            <h1 className="text-xl font-semibold">{user?.display_name ?? "Loading..."}</h1>
          </div>
          <button
            type="button"
            onClick={logout}
            className="grid h-10 w-10 place-items-center rounded border border-black/10 bg-white text-black/65 transition hover:bg-black/5"
            aria-label="Log out"
          >
            <LogOut size={18} />
          </button>
        </header>

        <div className="px-5 py-6 md:px-8">
          <section className="rounded-lg border border-black/10 bg-white p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-teal">Protected dashboard</p>
                <h2 className="mt-2 text-3xl font-semibold">Welcome, {user?.display_name ?? "family member"}</h2>
                <p className="mt-2 max-w-2xl text-black/60">
                  Your session is authenticated with the FastAPI backend. The next build step will add records,
                  uploads, medications, doctors, and analytics screens.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded bg-mint px-4 py-3 text-sm font-medium text-teal">
                <ShieldCheck size={18} />
                {user?.relationship_label ?? "authorized"}
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-lg border border-black/10 bg-white p-5">
                <p className="text-sm text-black/55">{metric.label}</p>
                <div className="mt-4 flex items-end justify-between">
                  <p className="text-4xl font-semibold">{metric.value}</p>
                  <span className={`rounded px-3 py-1 text-xs font-semibold ${metric.tone}`}>Ready</span>
                </div>
              </div>
            ))}
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
            <div className="rounded-lg border border-black/10 bg-white p-5">
              <h3 className="font-semibold">Family sharing boundary</h3>
              <p className="mt-2 text-sm leading-6 text-black/60">
                Mom and Dad share the parents dataset. Me and Sister share the siblings dataset. The backend
                authorization helper blocks cross-group access before protected data is returned.
              </p>
            </div>
            <div className="rounded-lg border border-black/10 bg-white p-5">
              <h3 className="font-semibold">Latest record</h3>
              {latestRecord ? (
                <div className="mt-2">
                  <p className="text-sm font-medium">{latestRecord.title}</p>
                  <p className="mt-1 text-sm text-black/60">
                    {latestRecord.record_type.replaceAll("_", " ")} · {latestRecord.record_date}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-black/60">No medical records yet.</p>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
