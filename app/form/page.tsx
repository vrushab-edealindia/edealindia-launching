"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef } from "react";

const LOGO_PATH = "/logo/edealindia.webp";

export default function FormPage() {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [logoError, setLogoError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setMessage({ type: "error", text: "Please choose an image file (e.g. JPG, PNG)." });
        return;
      }
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
      setMessage(null);
    } else {
      setImageFile(null);
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const phone = phoneNumber.trim().replace(/\s+/g, "");
    if (!name.trim()) {
      setMessage({ type: "error", text: "Please enter your name." });
      return;
    }
    if (!phone) {
      setMessage({ type: "error", text: "Please enter your phone number." });
      return;
    }
    if (!imageFile) {
      setMessage({ type: "error", text: "Please add your photo." });
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Image upload failed");
      }
      const data = (await uploadRes.json()) as { url?: string };
      const imageUrl = data?.url ?? "";
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phoneNumber: phone,
          imageUrl,
          location: location.trim(),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((body as { error?: string }).error || "Something went wrong");
      }
      setMessage({
        type: "success",
        text: "You’re registered successfully. Only one entry per number is allowed.",
      });
      setName("");
      setPhoneNumber("");
      setLocation("");
      setImageFile(null);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Registration failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen premium-bg text-white">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col px-5 py-8 sm:px-8">
        <header className="mb-8 flex items-center justify-between">
          <a
            href="https://edealindia.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3"
          >
            {!logoError ? (
              <Image
                src={LOGO_PATH}
                alt="EdealIndia"
                width={140}
                height={48}
                className="h-10 w-auto object-contain sm:h-12"
                onError={() => setLogoError(true)}
                priority
              />
            ) : (
              <span className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                EdealIndia
              </span>
            )}
          </a>
          <Link
            href="/spin"
            className="rounded-lg border border-[rgba(212,175,55,0.4)] bg-white/5 px-4 py-2 text-sm font-medium text-[#d4af37] transition hover:bg-white/10"
          >
            Lucky draw
          </Link>
        </header>

        <div className="flex flex-1 flex-col justify-center">
          <div className="premium-glass w-full rounded-2xl border border-[rgba(212,175,55,0.25)] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_48px_rgba(0,0,0,0.4)] sm:p-8">
            <h1 className="text-center text-xl font-bold tracking-tight text-white sm:text-2xl">
              Register for the draw
            </h1>
            <p className="mt-2 text-center text-sm text-white/70">
              One entry per phone number. Name, phone, and photo are required.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-white/60">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-[#c9a227]/60 focus:outline-none focus:ring-2 focus:ring-[#c9a227]/30"
                  autoComplete="name"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-white/60">
                  Phone number <span className="text-[#c9a227]">(unique)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-[#c9a227]/60 focus:outline-none focus:ring-2 focus:ring-[#c9a227]/30"
                  autoComplete="tel"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/60">
                  Photo <span className="text-[#c9a227]">*</span>
                </label>
                <div className="mt-2 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={onFileChange}
                    className="hidden"
                    id="photo"
                    required
                  />
                  <label
                    htmlFor="photo"
                    className="cursor-pointer rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white/90 transition hover:bg-white/10"
                  >
                    Take photo
                  </label>
                  {preview && (
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[rgba(212,175,55,0.35)]">
                      <Image
                        src={preview}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="location" className="block text-xs font-semibold uppercase tracking-wider text-white/60">
                  Location (optional)
                </label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City or area"
                  className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-[#c9a227]/60 focus:outline-none focus:ring-2 focus:ring-[#c9a227]/30"
                  autoComplete="address-level2"
                  disabled={loading}
                />
              </div>

              {message && (
                <p
                  className={`rounded-xl px-4 py-3 text-sm ${
                    message.type === "success"
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "bg-red-500/20 text-red-200"
                  }`}
                >
                  {message.text}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="premium-gold w-full rounded-xl py-4 text-base font-bold tracking-wide text-[#0f0d1a] shadow-[0_4px_20px_rgba(212,175,55,0.25)] transition hover:opacity-95 hover:shadow-[0_6px_28px_rgba(212,175,55,0.3)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
              >
                {loading ? "Submitting…" : "Submit"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
