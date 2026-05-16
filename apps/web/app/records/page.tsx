"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FilePlus2, HeartPulse, Trash2 } from "lucide-react";
import {
  createMedicalRecord,
  deleteMedicalRecord,
  getCurrentUser,
  getMedicalRecords,
  MedicalRecord,
  UserRead
} from "@/lib/api";

const recordTypes = [
  "prescription",
  "xray",
  "ct_scan",
  "blood_report",
  "doctor_note",
  "vaccination",
  "diagnosis",
  "other"
];

export default function RecordsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserRead | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [sharedRecords, setSharedRecords] = useState<MedicalRecord[]>([]);
  const [recordType, setRecordType] = useState("doctor_note");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recordDate, setRecordDate] = useState(new Date().toISOString().slice(0, 10));
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
          getMedicalRecords(token, "own"),
          getMedicalRecords(token, "shared")
        ]);
        setUser(profile);
        setRecords(ownData);
        setSharedRecords(sharedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load records");
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
      const created = await createMedicalRecord(token, {
        record_type: recordType,
        title,
        description,
        record_date: recordDate
      });
      setRecords((current) => [created, ...current]);
      setTitle("");
      setDescription("");
      setRecordType("doctor_note");
      setRecordDate(new Date().toISOString().slice(0, 10));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save record");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(recordId: string) {
    if (!token) {
      return;
    }

    setError("");
    try {
      await deleteMedicalRecord(token, recordId);
      setRecords((current) => current.filter((record) => record.id !== recordId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete record");
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
              <p className="text-sm text-black/55">Medical records</p>
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
            <FilePlus2 size={20} className="text-teal" />
            <h2 className="font-semibold">Add your record</h2>
          </div>

          <label className="mt-5 block text-sm font-medium" htmlFor="record-type">
            Type
          </label>
          <select
            id="record-type"
            value={recordType}
            onChange={(event) => setRecordType(event.target.value)}
            className="mt-2 h-11 w-full rounded border border-black/15 bg-white px-3"
          >
            {recordTypes.map((type) => (
              <option key={type} value={type}>
                {type.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <label className="mt-4 block text-sm font-medium" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            className="mt-2 h-11 w-full rounded border border-black/15 px-3 outline-none focus:border-teal"
            placeholder="Annual blood report"
          />

          <label className="mt-4 block text-sm font-medium" htmlFor="record-date">
            Date
          </label>
          <input
            id="record-date"
            type="date"
            value={recordDate}
            onChange={(event) => setRecordDate(event.target.value)}
            required
            className="mt-2 h-11 w-full rounded border border-black/15 px-3 outline-none focus:border-teal"
          />

          <label className="mt-4 block text-sm font-medium" htmlFor="description">
            Notes
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-2 min-h-28 w-full rounded border border-black/15 p-3 outline-none focus:border-teal"
            placeholder="Short doctor note or summary"
          />

          {error ? <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={isSaving}
            className="mt-5 h-11 w-full rounded bg-teal font-semibold text-white hover:bg-[#1d625a] disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save record"}
          </button>
        </form>

        <section className="rounded-lg border border-black/10 bg-white">
          <div className="border-b border-black/10 p-5">
            <h2 className="font-semibold">My records</h2>
            <p className="mt-1 text-sm text-black/55">
              These are records owned by your account. Shared family records are separated below.
            </p>
          </div>

          <div className="divide-y divide-black/10">
            {records.length === 0 ? (
              <p className="p-5 text-sm text-black/55">No records yet.</p>
            ) : (
              records.map((record) => {
                const isOwner = record.patient_user_id === user?.id;
                return (
                  <article key={record.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{record.title}</h3>
                        <span className="rounded bg-mint px-2 py-1 text-xs font-medium text-teal">
                          {record.record_type.replaceAll("_", " ")}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-black/55">{record.record_date}</p>
                      {record.description ? (
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-black/65">{record.description}</p>
                      ) : null}
                    </div>

                    {isOwner ? (
                      <button
                        type="button"
                        onClick={() => handleDelete(record.id)}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded border border-black/10 text-black/55 hover:bg-red-50 hover:text-red-700"
                        aria-label="Delete record"
                      >
                        <Trash2 size={17} />
                      </button>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>

          <div className="border-y border-black/10 bg-[#fbfcfa] p-5">
            <h2 className="font-semibold">Shared with me</h2>
            <p className="mt-1 text-sm text-black/55">
              These records belong to your authorized family group. You can view them, but only the owner can edit or delete them.
            </p>
          </div>

          <div className="divide-y divide-black/10">
            {sharedRecords.length === 0 ? (
              <p className="p-5 text-sm text-black/55">No shared records available.</p>
            ) : (
              sharedRecords.map((record) => (
                <article key={record.id} className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{record.title}</h3>
                    <span className="rounded bg-mint px-2 py-1 text-xs font-medium text-teal">
                      {record.record_type.replaceAll("_", " ")}
                    </span>
                    <span className="rounded bg-[#fff1c9] px-2 py-1 text-xs font-medium text-[#956c12]">
                      {record.patient_display_name}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-black/55">Owner: {record.patient_display_name} · {record.record_date}</p>
                  {record.description ? (
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-black/65">{record.description}</p>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
