"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, HeartPulse, Pill, Trash2 } from "lucide-react";
import {
  createMedication,
  deleteMedication,
  getCurrentUser,
  getMedications,
  Medication,
  updateMedication,
  UserRead
} from "@/lib/api";

export default function MedicationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserRead | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [sharedMedications, setSharedMedications] = useState<Medication[]>([]);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("Once daily");
  const [mealTiming, setMealTiming] = useState("after_breakfast");
  const [route, setRoute] = useState("oral");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [remainingQuantity, setRemainingQuantity] = useState("30");
  const [instructions, setInstructions] = useState("");
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
          getMedications(token, "own"),
          getMedications(token, "shared")
        ]);
        setUser(profile);
        setMedications(ownData);
        setSharedMedications(sharedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load medications");
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
      const created = await createMedication(token, {
        name,
        dosage,
        frequency,
        meal_timing: mealTiming,
        route,
        start_date: startDate,
        remaining_quantity: remainingQuantity ? Number(remainingQuantity) : undefined,
        instructions
      });
      setMedications((current) => [created, ...current]);
      setName("");
      setDosage("");
      setFrequency("Once daily");
      setMealTiming("after_breakfast");
      setRoute("oral");
      setStartDate(new Date().toISOString().slice(0, 10));
      setRemainingQuantity("30");
      setInstructions("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save medication");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive(medication: Medication) {
    if (!token) {
      return;
    }

    try {
      const updated = await updateMedication(token, medication.id, { is_active: !medication.is_active });
      setMedications((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update medication");
    }
  }

  async function handleDelete(medicationId: string) {
    if (!token) {
      return;
    }

    try {
      await deleteMedication(token, medicationId);
      setMedications((current) => current.filter((medication) => medication.id !== medicationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete medication");
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
              <p className="text-sm text-black/55">Medication management</p>
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
            <Pill size={20} className="text-teal" />
            <h2 className="font-semibold">Add medicine</h2>
          </div>

          <label className="mt-5 block text-sm font-medium" htmlFor="name">
            Medicine name
          </label>
          <input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="mt-2 h-11 w-full rounded border border-black/15 px-3 outline-none focus:border-teal"
            placeholder="Metformin"
          />

          <label className="mt-4 block text-sm font-medium" htmlFor="dosage">
            Dosage
          </label>
          <input
            id="dosage"
            value={dosage}
            onChange={(event) => setDosage(event.target.value)}
            required
            className="mt-2 h-11 w-full rounded border border-black/15 px-3 outline-none focus:border-teal"
            placeholder="500 mg"
          />

          <label className="mt-4 block text-sm font-medium" htmlFor="frequency">
            Frequency
          </label>
          <select
            id="frequency"
            value={frequency}
            onChange={(event) => setFrequency(event.target.value)}
            required
            className="mt-2 h-11 w-full rounded border border-black/15 bg-white px-3 outline-none focus:border-teal"
          >
            <option value="Once daily">Once daily</option>
            <option value="Twice daily">Twice daily</option>
            <option value="Three times daily">Three times daily</option>
            <option value="Every morning">Every morning</option>
            <option value="Every night">Every night</option>
            <option value="Every other day">Every other day</option>
            <option value="Weekly">Weekly</option>
            <option value="As needed">As needed</option>
          </select>

          <label className="mt-4 block text-sm font-medium" htmlFor="meal-timing">
            Meal timing
          </label>
          <select
            id="meal-timing"
            value={mealTiming}
            onChange={(event) => setMealTiming(event.target.value)}
            className="mt-2 h-11 w-full rounded border border-black/15 bg-white px-3 outline-none focus:border-teal"
          >
            <option value="before_breakfast">Before breakfast</option>
            <option value="after_breakfast">After breakfast</option>
            <option value="before_lunch">Before lunch</option>
            <option value="after_lunch">After lunch</option>
            <option value="before_dinner">Before dinner</option>
            <option value="after_dinner">After dinner</option>
            <option value="with_food">With food</option>
            <option value="empty_stomach">Empty stomach</option>
            <option value="not_applicable">Not applicable</option>
          </select>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium" htmlFor="route">
                Route
              </label>
              <input
                id="route"
                value={route}
                onChange={(event) => setRoute(event.target.value)}
                className="mt-2 h-11 w-full rounded border border-black/15 px-3 outline-none focus:border-teal"
                placeholder="oral"
              />
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="remaining">
                Remaining
              </label>
              <input
                id="remaining"
                type="number"
                min="0"
                value={remainingQuantity}
                onChange={(event) => setRemainingQuantity(event.target.value)}
                className="mt-2 h-11 w-full rounded border border-black/15 px-3 outline-none focus:border-teal"
              />
            </div>
          </div>

          <label className="mt-4 block text-sm font-medium" htmlFor="start-date">
            Start date
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            required
            className="mt-2 h-11 w-full rounded border border-black/15 px-3 outline-none focus:border-teal"
          />

          <label className="mt-4 block text-sm font-medium" htmlFor="instructions">
            Instructions
          </label>
          <textarea
            id="instructions"
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            className="mt-2 min-h-24 w-full rounded border border-black/15 p-3 outline-none focus:border-teal"
            placeholder="Take after breakfast"
          />

          {error ? <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={isSaving}
            className="mt-5 h-11 w-full rounded bg-teal font-semibold text-white hover:bg-[#1d625a] disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save medicine"}
          </button>
        </form>

        <section className="rounded-lg border border-black/10 bg-white">
          <div className="border-b border-black/10 p-5">
            <h2 className="font-semibold">My medications</h2>
            <p className="mt-1 text-sm text-black/55">
              These medicines are owned by your account. Shared family medications are separated below.
            </p>
          </div>

          <div className="divide-y divide-black/10">
            {medications.length === 0 ? (
              <p className="p-5 text-sm text-black/55">No medications yet.</p>
            ) : (
              medications.map((medication) => {
                const isOwner = medication.patient_user_id === user?.id;
                return (
                  <article key={medication.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{medication.name}</h3>
                        <span className="rounded bg-mint px-2 py-1 text-xs font-medium text-teal">
                          {medication.dosage}
                        </span>
                        <span className={`rounded px-2 py-1 text-xs font-medium ${medication.is_active ? "bg-[#e7f7dd] text-[#3f7527]" : "bg-black/5 text-black/50"}`}>
                          {medication.is_active ? "active" : "inactive"}
                        </span>
                        {!isOwner ? (
                          <span className="rounded bg-[#fff1c9] px-2 py-1 text-xs font-medium text-[#956c12]">
                            shared
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-black/55">
                        {medication.frequency} · {formatMealTiming(medication.meal_timing)} · {medication.route ?? "route not set"} · started {medication.start_date}
                      </p>
                      {medication.remaining_quantity !== null ? (
                        <p className="mt-2 text-sm text-black/60">Remaining quantity: {medication.remaining_quantity}</p>
                      ) : null}
                      {medication.instructions ? (
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-black/65">{medication.instructions}</p>
                      ) : null}
                    </div>

                    {isOwner ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => toggleActive(medication)}
                          className="h-10 rounded border border-black/10 px-3 text-sm font-medium text-black/65 hover:bg-black/5"
                        >
                          {medication.is_active ? "Pause" : "Resume"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(medication.id)}
                          className="grid h-10 w-10 place-items-center rounded border border-black/10 text-black/55 hover:bg-red-50 hover:text-red-700"
                          aria-label="Delete medication"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>

          <div className="border-y border-black/10 bg-[#fbfcfa] p-5">
            <h2 className="font-semibold">Shared with me</h2>
            <p className="mt-1 text-sm text-black/55">
              These medications belong to your authorized family group. You can view them, but only the owner can edit or delete them.
            </p>
          </div>

          <div className="divide-y divide-black/10">
            {sharedMedications.length === 0 ? (
              <p className="p-5 text-sm text-black/55">No shared medications available.</p>
            ) : (
              sharedMedications.map((medication) => (
                <article key={medication.id} className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{medication.name}</h3>
                    <span className="rounded bg-mint px-2 py-1 text-xs font-medium text-teal">
                      {medication.dosage}
                    </span>
                    <span className="rounded bg-[#fff1c9] px-2 py-1 text-xs font-medium text-[#956c12]">
                      {medication.patient_display_name}
                    </span>
                    <span className={`rounded px-2 py-1 text-xs font-medium ${medication.is_active ? "bg-[#e7f7dd] text-[#3f7527]" : "bg-black/5 text-black/50"}`}>
                      {medication.is_active ? "active" : "inactive"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-black/55">
                    Owner: {medication.patient_display_name} · {medication.frequency} · {formatMealTiming(medication.meal_timing)}
                  </p>
                  {medication.remaining_quantity !== null ? (
                    <p className="mt-2 text-sm text-black/60">Remaining quantity: {medication.remaining_quantity}</p>
                  ) : null}
                  {medication.instructions ? (
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-black/65">{medication.instructions}</p>
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

function formatMealTiming(value: string | null): string {
  if (!value) {
    return "meal timing not set";
  }

  return value.replaceAll("_", " ");
}
