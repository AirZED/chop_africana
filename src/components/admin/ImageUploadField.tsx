"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder: "menu" | "shop";
}

/**
 * Downscales and re-encodes large JPEGs before upload. PNGs (used for the transparent
 * product cutouts throughout this app) and other formats pass through untouched —
 * re-encoding as JPEG would flatten their transparency onto a solid background.
 */
async function compressImage(file: File, maxDimension = 1600, quality = 0.85): Promise<File> {
  if (file.type !== "image/jpeg") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  if (bitmap.width <= maxDimension && bitmap.height <= maxDimension) {
    bitmap.close();
    return file;
  }

  const scale = maxDimension / Math.max(bitmap.width, bitmap.height);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) return file;

  return new File([blob], file.name, { type: "image/jpeg" });
}

export default function ImageUploadField({ label, value, onChange, folder }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const compressed = await compressImage(file).catch(() => file);
      const form = new FormData();
      form.append("file", compressed);
      form.append("folder", folder);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-stone-600">{label}</span>
      <div className="flex items-center gap-4">
        <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-stone-300 bg-stone-50">
          {value ? (
            <Image src={value} alt="" fill sizes="80px" className="object-cover" />
          ) : (
            <span className="text-xs text-stone-400">No photo</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="tap-press rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
            >
              {uploading ? "Uploading…" : value ? "Replace photo" : "Upload photo"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="tap-press rounded-lg px-2 py-1.5 text-sm font-medium text-stone-400 hover:text-red-600"
              >
                Remove
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </div>
    </div>
  );
}
