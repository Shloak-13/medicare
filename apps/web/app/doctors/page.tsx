"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, HeartPulse, Stethoscope, Trash2 } from "lucide-react";
import { createDoctor, deleteDoctor, Doctor, getCurrentUser, getDoctors, UserRead } from "@/lib/api";

const specialties = [
  "cardiologist",
  "dentist",
  "chiropractor",
  "neurologist",
  "general_physician",
  "other"
];

export default function DoctorsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserRead | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [sharedDoctors, setSharedDoctors] = useState<Doctor[]>([]);
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("general_physician");
  const [clinicName, setClinicName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
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
        const [profile, ownData, sharedData] = await Promise.all([
          getCurrentUser(token),
          getDoctors(token, "own"),
          getDoctors(token, "shared")
        ]);
        setUser(profile);
        setDoctors(ownData);
        setSharedDoctors(sharedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load doctors");
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
      const created = await createDoctor(token, {
        name,
        specialty,
        clinic_name: clinicName,
        phone,
        email,
        address,
        notes
      });
      setDoctors((current) => [created, ...current]);
      setName("");
      setSpecialty("general_physician");
      setClinicName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save doctor");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(doctorId: string) {
    if (!token) {
      return;
    }

    try {
      await deleteDoctor(token, doctorId);
      setDoctors((current) => current.filter((doctor) => doctor.id !== doctorId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete doctor");
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
              <p className="text-sm text-black/55">Doctor management</p>
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
            <Stethoscope size={20} className="text-teal" />
            <h2 className="font-semibold">Add doctor</h2>
          </div>

          <label className="mt-5 block text-sm font-medium" htmlFor="name">
            Doctor name
          </label>
          <input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="mt-2 h-11 w-full rounded border border-black/15 px-3 outline-none focus:border-teal"
            placeholder="Dr. Rao"
          />

          <label className="mt-4 block text-sm font-medium" htmlFor="specialty">
            Specialty
          </label>
          <select
            id="specialty"
            value={specialty}
            onChange={(event) => setSpecialty(event.target.value)}
            className="mt-2 h-11 w-full rounded border border-black/15 bg-white px-3 outline-none focus:border-teal"
          >
            {specialties.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <label className="mt-4 block text-sm font-medium" htmlFor="clinic">
            Clinic
          </label>
          <input
            id="clinic"
            value={clinicName}
            onChange={(event) => setClinicName(event.target.value)}
            className="mt-2 h-11 w-full rounded border border-black/15 px-3 outline-none focus:border-teal"
            placeholder="City Heart Clinic"
          />

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium" htmlFor="phone">
                Phone
              </label>
              <input
                id="phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-2 h-11 w-full rounded border border-black/15 px-3 outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 h-11 w-full rounded border border-black/15 px-3 outline-none focus:border-teal"
              />
            </div>
          </div>

          <label className="mt-4 block text-sm font-medium" htmlFor="address">
            Address
          </label>
          <input
            id="address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className="mt-2 h-11 w-full rounded border border-black/15 px-3 outline-none focus:border-teal"
          />

          <label className="mt-4 block text-sm font-medium" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="mt-2 min-h-24 w-full rounded border border-black/15 p-3 outline-none focus:border-teal"
            placeholder="Prescription or visit notes"
          />

          {error ? <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={isSaving}
            className="mt-5 h-11 w-full rounded bg-teal font-semibold text-white hover:bg-[#1d625a] disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save doctor"}
          </button>
        </form>

        <section className="rounded-lg border border-black/10 bg-white">
          <div className="border-b border-black/10 p-5">
            <h2 className="font-semibold">My doctors</h2>
            <p className="mt-1 text-sm text-black/55">These doctors are owned by your account.</p>
          </div>

          <DoctorList doctors={doctors} canDelete onDelete={handleDelete} emptyText="No doctors yet." />

          <div className="border-y border-black/10 bg-[#fbfcfa] p-5">
            <h2 className="font-semibold">Shared with me</h2>
            <p className="mt-1 text-sm text-black/55">
              These doctors belong to your authorized family group.
            </p>
          </div>

          <DoctorList doctors={sharedDoctors} emptyText="No shared doctors available." />
        </section>
      </section>
    </main>
  );
}

function DoctorList({
  doctors,
  canDelete = false,
  onDelete,
  emptyText
}: {
  doctors: Doctor[];
  canDelete?: boolean;
  onDelete?: (doctorId: string) => void;
  emptyText: string;
}) {
  if (doctors.length === 0) {
    return <p className="p-5 text-sm text-black/55">{emptyText}</p>;
  }

  return (
    <div className="divide-y divide-black/10">
      {doctors.map((doctor) => (
        <article key={doctor.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{doctor.name}</h3>
              <span className="rounded bg-mint px-2 py-1 text-xs font-medium text-teal">
                {doctor.specialty.replaceAll("_", " ")}
              </span>
              {!canDelete ? (
                <span className="rounded bg-[#fff1c9] px-2 py-1 text-xs font-medium text-[#956c12]">
                  {doctor.owner_display_name}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-black/55">
              Owner: {doctor.owner_display_name}
              {doctor.clinic_name ? ` · ${doctor.clinic_name}` : ""}
            </p>
            {doctor.phone || doctor.email ? (
              <p className="mt-2 text-sm text-black/60">
                {[doctor.phone, doctor.email].filter(Boolean).join(" · ")}
              </p>
            ) : null}
            {doctor.address ? <p className="mt-2 text-sm text-black/60">{doctor.address}</p> : null}
            {doctor.notes ? <p className="mt-3 max-w-2xl text-sm leading-6 text-black/65">{doctor.notes}</p> : null}
          </div>

          {canDelete ? (
            <button
              type="button"
              onClick={() => onDelete?.(doctor.id)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded border border-black/10 text-black/55 hover:bg-red-50 hover:text-red-700"
              aria-label="Delete doctor"
            >
              <Trash2 size={17} />
            </button>
          ) : null}
        </article>
      ))}
    </div>
  );
}
