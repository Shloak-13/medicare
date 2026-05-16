"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, HeartPulse, Trash2 } from "lucide-react";
import {
  Appointment,
  createAppointment,
  deleteAppointment,
  Doctor,
  getAppointments,
  getCurrentUser,
  getDoctors,
  updateAppointment,
  UserRead
} from "@/lib/api";

const statuses = ["scheduled", "completed", "cancelled", "missed"];

export default function AppointmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserRead | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sharedAppointments, setSharedAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [scheduledAt, setScheduledAt] = useState(toDateTimeLocal(new Date()));
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("scheduled");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const token = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return window.localStorage.getItem("medicare_token");
  }, []);

  useEffect(() => {
    async function load() {
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const [profile, ownAppointments, sharedData, ownDoctors] = await Promise.all([
          getCurrentUser(token),
          getAppointments(token, "own"),
          getAppointments(token, "shared"),
          getDoctors(token, "own")
        ]);
        setUser(profile);
        setAppointments(ownAppointments);
        setSharedAppointments(sharedData);
        setDoctors(ownDoctors);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load appointments");
      }
    }

    load();
  }, [router, token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      router.replace("/login");
      return;
    }

    setError("");
    setIsSaving(true);
    try {
      const created = await createAppointment(token, {
        doctor_id: doctorId || undefined,
        scheduled_at: new Date(scheduledAt).toISOString(),
        reason,
        status,
        notes
      });
      setAppointments((current) => [...current, created].sort(compareAppointments));
      setDoctorId("");
      setScheduledAt(toDateTimeLocal(new Date()));
      setReason("");
      setStatus("scheduled");
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save appointment");
    } finally {
      setIsSaving(false);
    }
  }

  async function changeStatus(appointment: Appointment, nextStatus: string) {
    if (!token) {
      return;
    }

    try {
      const updated = await updateAppointment(token, appointment.id, { status: nextStatus });
      setAppointments((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update appointment");
    }
  }

  async function handleDelete(appointmentId: string) {
    if (!token) {
      return;
    }

    try {
      await deleteAppointment(token, appointmentId);
      setAppointments((current) => current.filter((appointment) => appointment.id !== appointmentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete appointment");
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8f5]">
      <header className="border-b border-black/10 bg-white px-5 py-4 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded bg-mint text-teal">
              <HeartPulse size={22} />
            </div>
            <div>
              <p className="text-sm text-black/55">Appointment management</p>
              <h1 className="text-xl font-semibold">{user?.display_name ?? "Loading..."}</h1>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center gap-2 rounded border border-black/10 bg-white px-3 text-sm font-medium text-black/70 hover:bg-black/5"
          >
            <ArrowLeft size={17} />
            Dashboard
          </Link>
        </div>
      </header>

      <section className="grid gap-6 px-5 py-6 md:px-8 lg:grid-cols-[420px_1fr]">
        <form onSubmit={handleSubmit} className="rounded-lg border border-black/10 bg-white p-5">
          <div className="flex items-center gap-2">
            <CalendarDays size={20} className="text-teal" />
            <h2 className="font-semibold">Add appointment</h2>
          </div>

          <label className="mt-5 block text-sm font-medium" htmlFor="doctor">
            Doctor
          </label>
          <select
            id="doctor"
            value={doctorId}
            onChange={(event) => setDoctorId(event.target.value)}
            className="mt-2 h-11 w-full rounded border border-black/15 bg-white px-3 outline-none focus:border-teal"
          >
            <option value="">No doctor selected</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} · {doctor.specialty.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <label className="mt-4 block text-sm font-medium" htmlFor="scheduled-at">
            Date and time
          </label>
          <input
            id="scheduled-at"
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            required
            className="mt-2 h-11 w-full rounded border border-black/15 px-3 outline-none focus:border-teal"
          />

          <label className="mt-4 block text-sm font-medium" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="mt-2 h-11 w-full rounded border border-black/15 bg-white px-3 outline-none focus:border-teal"
          >
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <label className="mt-4 block text-sm font-medium" htmlFor="reason">
            Reason
          </label>
          <input
            id="reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="mt-2 h-11 w-full rounded border border-black/15 px-3 outline-none focus:border-teal"
            placeholder="Follow-up visit"
          />

          <label className="mt-4 block text-sm font-medium" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="mt-2 min-h-24 w-full rounded border border-black/15 p-3 outline-none focus:border-teal"
            placeholder="Bring previous report"
          />

          {error ? <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={isSaving}
            className="mt-5 h-11 w-full rounded bg-teal font-semibold text-white hover:bg-[#1d625a] disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save appointment"}
          </button>
        </form>

        <section className="rounded-lg border border-black/10 bg-white">
          <div className="border-b border-black/10 p-5">
            <h2 className="font-semibold">My appointments</h2>
            <p className="mt-1 text-sm text-black/55">These appointments are owned by your account.</p>
          </div>

          <AppointmentList
            appointments={appointments}
            canEdit
            onDelete={handleDelete}
            onStatusChange={changeStatus}
            emptyText="No appointments yet."
          />

          <div className="border-y border-black/10 bg-[#fbfcfa] p-5">
            <h2 className="font-semibold">Shared with me</h2>
            <p className="mt-1 text-sm text-black/55">
              These appointments belong to your authorized family group.
            </p>
          </div>

          <AppointmentList appointments={sharedAppointments} emptyText="No shared appointments available." />
        </section>
      </section>
    </main>
  );
}

function AppointmentList({
  appointments,
  canEdit = false,
  onDelete,
  onStatusChange,
  emptyText
}: {
  appointments: Appointment[];
  canEdit?: boolean;
  onDelete?: (appointmentId: string) => void;
  onStatusChange?: (appointment: Appointment, nextStatus: string) => void;
  emptyText: string;
}) {
  if (appointments.length === 0) {
    return <p className="p-5 text-sm text-black/55">{emptyText}</p>;
  }

  return (
    <div className="divide-y divide-black/10">
      {appointments.map((appointment) => (
        <article key={appointment.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{appointment.reason || "Appointment"}</h3>
              <span className="rounded bg-mint px-2 py-1 text-xs font-medium text-teal">
                {appointment.status}
              </span>
              {!canEdit ? (
                <span className="rounded bg-[#fff1c9] px-2 py-1 text-xs font-medium text-[#956c12]">
                  {appointment.patient_display_name}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-black/55">
              Owner: {appointment.patient_display_name} · {formatDateTime(appointment.scheduled_at)}
            </p>
            <p className="mt-2 text-sm text-black/60">
              Doctor: {appointment.doctor_name ?? "No doctor selected"}
            </p>
            {appointment.notes ? (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-black/65">{appointment.notes}</p>
            ) : null}
          </div>

          {canEdit ? (
            <div className="flex gap-2">
              <select
                value={appointment.status}
                onChange={(event) => onStatusChange?.(appointment, event.target.value)}
                className="h-10 rounded border border-black/10 bg-white px-2 text-sm text-black/65"
                aria-label="Appointment status"
              >
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onDelete?.(appointment.id)}
                className="grid h-10 w-10 place-items-center rounded border border-black/10 text-black/55 hover:bg-red-50 hover:text-red-700"
                aria-label="Delete appointment"
              >
                <Trash2 size={17} />
              </button>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function toDateTimeLocal(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function compareAppointments(a: Appointment, b: Appointment): number {
  return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
