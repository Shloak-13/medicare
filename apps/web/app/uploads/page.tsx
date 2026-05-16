"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, FileUp, HeartPulse, Trash2 } from "lucide-react";
import {
  deleteFile,
  FileUploadItem,
  getCurrentUser,
  getFileDownloadUrl,
  getFiles,
  uploadFile,
  UserRead
} from "@/lib/api";

export default function UploadsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserRead | null>(null);
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [sharedFiles, setSharedFiles] = useState<FileUploadItem[]>([]);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

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
        const [profile, ownFiles, sharedData] = await Promise.all([
          getCurrentUser(token),
          getFiles(token, "own"),
          getFiles(token, "shared")
        ]);
        setUser(profile);
        setFiles(ownFiles);
        setSharedFiles(sharedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load files");
      }
    }

    load();
  }, [router, token]);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    if (!token) {
      router.replace("/login");
      return;
    }

    const selected = event.target.files?.[0];
    if (!selected) {
      return;
    }

    setError("");
    setIsUploading(true);
    try {
      const uploaded = await uploadFile(token, selected);
      setFiles((current) => [uploaded, ...current]);
      event.target.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload file");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(fileId: string) {
    if (!token) {
      return;
    }

    try {
      await deleteFile(token, fileId);
      setFiles((current) => current.filter((file) => file.id !== fileId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete file");
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
              <p className="text-sm text-black/55">File uploads</p>
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
        <section className="rounded-lg border border-black/10 bg-white p-5">
          <div className="flex items-center gap-2">
            <FileUp size={20} className="text-teal" />
            <h2 className="font-semibold">Upload report</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-black/60">
            Upload PDF or image reports for your own account. Shared files are visible in a separate read-only section.
          </p>

          <label className="mt-5 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded border border-dashed border-black/20 bg-[#fbfcfa] p-5 text-center hover:bg-mint/40">
            <FileUp size={28} className="text-teal" />
            <span className="mt-3 text-sm font-medium">{isUploading ? "Uploading..." : "Choose PDF or image"}</span>
            <span className="mt-1 text-xs text-black/50">PDF, JPG, PNG, WEBP up to 10 MB</span>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={handleUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>

          {error ? <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        </section>

        <section className="rounded-lg border border-black/10 bg-white">
          <div className="border-b border-black/10 p-5">
            <h2 className="font-semibold">My files</h2>
            <p className="mt-1 text-sm text-black/55">These uploaded reports are owned by your account.</p>
          </div>

          <FileList files={files} canDelete onDelete={handleDelete} emptyText="No files uploaded yet." token={token} />

          <div className="border-y border-black/10 bg-[#fbfcfa] p-5">
            <h2 className="font-semibold">Shared with me</h2>
            <p className="mt-1 text-sm text-black/55">
              These files belong to your authorized family group.
            </p>
          </div>

          <FileList files={sharedFiles} emptyText="No shared files available." token={token} />
        </section>
      </section>
    </main>
  );
}

function FileList({
  files,
  canDelete = false,
  onDelete,
  emptyText,
  token
}: {
  files: FileUploadItem[];
  canDelete?: boolean;
  onDelete?: (fileId: string) => void;
  emptyText: string;
  token: string | null;
}) {
  if (files.length === 0) {
    return <p className="p-5 text-sm text-black/55">{emptyText}</p>;
  }

  return (
    <div className="divide-y divide-black/10">
      {files.map((file) => (
        <article key={file.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{file.original_filename}</h3>
              <span className="rounded bg-mint px-2 py-1 text-xs font-medium text-teal">
                {file.mime_type}
              </span>
              {!canDelete ? (
                <span className="rounded bg-[#fff1c9] px-2 py-1 text-xs font-medium text-[#956c12]">
                  {file.patient_display_name}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-black/55">
              Owner: {file.patient_display_name} · {formatBytes(file.byte_size)} · {new Date(file.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => downloadWithToken(file.id, token)}
              className="grid h-10 w-10 place-items-center rounded border border-black/10 text-black/55 hover:bg-black/5"
              aria-label="Download file"
            >
              <Download size={17} />
            </button>
            {canDelete ? (
              <button
                type="button"
                onClick={() => onDelete?.(file.id)}
                className="grid h-10 w-10 place-items-center rounded border border-black/10 text-black/55 hover:bg-red-50 hover:text-red-700"
                aria-label="Delete file"
              >
                <Trash2 size={17} />
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

async function downloadWithToken(fileId: string, token: string | null) {
  if (!token) {
    return;
  }

  const response = await fetch(getFileDownloadUrl(fileId), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    return;
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
