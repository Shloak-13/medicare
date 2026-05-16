"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, HeartPulse, LineChart as LineChartIcon, Trash2 } from "lucide-react";
import {
  createHealthMeasurement,
  deleteHealthMeasurement,
  getCurrentUser,
  getHealthMeasurements,
  HealthMeasurement,
  UserRead
} from "@/lib/api";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const measurementOptions = [
  { type: "blood_pressure_systolic", label: "Blood pressure systolic", unit: "mmHg" },
  { type: "blood_pressure_diastolic", label: "Blood pressure diastolic", unit: "mmHg" },
  { type: "heart_rate", label: "Heart rate", unit: "bpm" },
  { type: "blood_glucose", label: "Blood glucose", unit: "mg/dL" },
  { type: "weight", label: "Weight", unit: "kg" },
  { type: "temperature", label: "Temperature", unit: "C" },
  { type: "spo2", label: "SpO2", unit: "%" },
  { type: "cholesterol_total", label: "Total cholesterol", unit: "mg/dL" },
  { type: "hemoglobin", label: "Hemoglobin", unit: "g/dL" }
];

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserRead | null>(null);
  const [measurements, setMeasurements] = useState<HealthMeasurement[]>([]);
  const [sharedMeasurements, setSharedMeasurements] = useState<HealthMeasurement[]>([]);
  const [measurementType, setMeasurementType] = useState("heart_rate");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("bpm");
  const [measuredAt, setMeasuredAt] = useState(toDateTimeLocal(new Date()));
  const [notes, setNotes] = useState("");
  const [chartType, setChartType] = useState("heart_rate");
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
          getHealthMeasurements(token, "own"),
          getHealthMeasurements(token, "shared")
        ]);
        setUser(profile);
        setMeasurements(ownData);
        setSharedMeasurements(sharedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load analytics");
      }
    }

    load();
  }, [router, token]);

  function updateMeasurementType(nextType: string) {
    setMeasurementType(nextType);
    const option = measurementOptions.find((item) => item.type === nextType);
    if (option) {
      setUnit(option.unit);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      router.replace("/login");
      return;
    }

    setError("");
    setIsSaving(true);
    try {
      const created = await createHealthMeasurement(token, {
        measurement_type: measurementType,
        value: Number(value),
        unit,
        measured_at: new Date(measuredAt).toISOString(),
        notes
      });
      setMeasurements((current) => [created, ...current]);
      setValue("");
      setMeasuredAt(toDateTimeLocal(new Date()));
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save measurement");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(measurementId: string) {
    if (!token) {
      return;
    }

    try {
      await deleteHealthMeasurement(token, measurementId);
      setMeasurements((current) => current.filter((measurement) => measurement.id !== measurementId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete measurement");
    }
  }

  const chartData = measurements
    .filter((measurement) => measurement.measurement_type === chartType)
    .slice()
    .reverse()
    .map((measurement) => ({
      date: new Date(measurement.measured_at).toLocaleDateString(),
      value: Number(measurement.value)
    }));

  const latestByType = measurementOptions
    .map((option) => ({
      option,
      latest: measurements.find((measurement) => measurement.measurement_type === option.type)
    }))
    .filter((item) => item.latest);

  return (
    <main className="min-h-screen bg-[#f6f8f5]">
      <header className="border-b border-black/10 bg-white px-5 py-4 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded bg-mint text-teal">
              <HeartPulse size={22} />
            </div>
            <div>
              <p className="text-sm text-black/55">Health analytics</p>
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

      <section className="grid gap-6 px-5 py-6 md:px-8 xl:grid-cols-[420px_1fr]">
        <form onSubmit={handleSubmit} className="rounded-lg border border-black/10 bg-white p-5">
          <div className="flex items-center gap-2">
            <LineChartIcon size={20} className="text-teal" />
            <h2 className="font-semibold">Add measurement</h2>
          </div>

          <label className="mt-5 block text-sm font-medium" htmlFor="measurement-type">
            Measurement
          </label>
          <select
            id="measurement-type"
            value={measurementType}
            onChange={(event) => updateMeasurementType(event.target.value)}
            className="mt-2 h-11 w-full rounded border border-black/15 bg-white px-3 outline-none focus:border-teal"
          >
            {measurementOptions.map((item) => (
              <option key={item.type} value={item.type}>
                {item.label}
              </option>
            ))}
          </select>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium" htmlFor="value">
                Value
              </label>
              <input
                id="value"
                type="number"
                step="0.001"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                required
                className="mt-2 h-11 w-full rounded border border-black/15 px-3 outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="unit">
                Unit
              </label>
              <input
                id="unit"
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
                required
                className="mt-2 h-11 w-full rounded border border-black/15 px-3 outline-none focus:border-teal"
              />
            </div>
          </div>

          <label className="mt-4 block text-sm font-medium" htmlFor="measured-at">
            Date and time
          </label>
          <input
            id="measured-at"
            type="datetime-local"
            value={measuredAt}
            onChange={(event) => setMeasuredAt(event.target.value)}
            required
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
          />

          {error ? <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={isSaving}
            className="mt-5 h-11 w-full rounded bg-teal font-semibold text-white hover:bg-[#1d625a] disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save measurement"}
          </button>
        </form>

        <section className="space-y-6">
          <section className="rounded-lg border border-black/10 bg-white p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-semibold">Trend chart</h2>
                <p className="mt-1 text-sm text-black/55">Charts use your own measurements.</p>
              </div>
              <select
                value={chartType}
                onChange={(event) => setChartType(event.target.value)}
                className="h-10 rounded border border-black/15 bg-white px-3 text-sm"
              >
                {measurementOptions.map((item) => (
                  <option key={item.type} value={item.type}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 h-72">
              {chartData.length === 0 ? (
                <div className="grid h-full place-items-center rounded border border-dashed border-black/15 text-sm text-black/55">
                  No chart data for this measurement yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#24756b" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {latestByType.length === 0 ? (
              <div className="rounded-lg border border-black/10 bg-white p-5 text-sm text-black/55">
                No latest readings yet.
              </div>
            ) : (
              latestByType.slice(0, 6).map(({ option, latest }) => (
                <div key={option.type} className="rounded-lg border border-black/10 bg-white p-5">
                  <p className="text-sm text-black/55">{option.label}</p>
                  <p className="mt-3 text-2xl font-semibold">
                    {latest?.value} {latest?.unit}
                  </p>
                </div>
              ))
            )}
          </section>

          <section className="rounded-lg border border-black/10 bg-white">
            <div className="border-b border-black/10 p-5">
              <h2 className="font-semibold">My measurements</h2>
            </div>
            <MeasurementList measurements={measurements} canDelete onDelete={handleDelete} emptyText="No measurements yet." />

            <div className="border-y border-black/10 bg-[#fbfcfa] p-5">
              <h2 className="font-semibold">Shared with me</h2>
              <p className="mt-1 text-sm text-black/55">These readings belong to your authorized family group.</p>
            </div>
            <MeasurementList measurements={sharedMeasurements} emptyText="No shared measurements available." />
          </section>
        </section>
      </section>
    </main>
  );
}

function MeasurementList({
  measurements,
  canDelete = false,
  onDelete,
  emptyText
}: {
  measurements: HealthMeasurement[];
  canDelete?: boolean;
  onDelete?: (measurementId: string) => void;
  emptyText: string;
}) {
  if (measurements.length === 0) {
    return <p className="p-5 text-sm text-black/55">{emptyText}</p>;
  }

  return (
    <div className="divide-y divide-black/10">
      {measurements.map((measurement) => (
        <article key={measurement.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{measurement.measurement_type.replaceAll("_", " ")}</h3>
              <span className="rounded bg-mint px-2 py-1 text-xs font-medium text-teal">
                {measurement.value} {measurement.unit}
              </span>
              {!canDelete ? (
                <span className="rounded bg-[#fff1c9] px-2 py-1 text-xs font-medium text-[#956c12]">
                  {measurement.patient_display_name}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-black/55">
              Owner: {measurement.patient_display_name} · {new Date(measurement.measured_at).toLocaleString()}
            </p>
            {measurement.notes ? (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-black/65">{measurement.notes}</p>
            ) : null}
          </div>
          {canDelete ? (
            <button
              type="button"
              onClick={() => onDelete?.(measurement.id)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded border border-black/10 text-black/55 hover:bg-red-50 hover:text-red-700"
              aria-label="Delete measurement"
            >
              <Trash2 size={17} />
            </button>
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
