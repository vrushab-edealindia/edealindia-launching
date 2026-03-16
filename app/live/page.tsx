"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const LOGO_PATH = "/logo/edealindia.webp";

type Registration = {
  id: string;
  name: string;
  phoneNumber: string;
  imageUrl: string;
  location: string;
  createdAt?: string;
};

export default function LiveRegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [connected, setConnected] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      eventSource = new EventSource("/api/registrations/stream");

      eventSource.onopen = () => setConnected(true);
      eventSource.onerror = () => {
        setConnected(false);
        eventSource?.close();
        reconnectTimeout = setTimeout(connect, 3000);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as Registration;
          setRegistrations((prev) => [data, ...prev].slice(0, 100));
        } catch {
          // ignore heartbeat or invalid JSON
        }
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      eventSource?.close();
    };
  }, []);

  return (
    <div className="min-h-screen premium-bg text-white">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-8 sm:px-8">
        <header className="mb-6 flex items-center justify-between sm:mb-8">
          <Link
            href="/"
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
          </Link>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                connected
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-amber-500/20 text-amber-300"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  connected ? "animate-pulse bg-emerald-400" : "bg-amber-400"
                }`}
              />
              {connected ? "Live" : "Reconnecting…"}
            </span>
            <Link
              href="/form"
              className="rounded-lg border border-[rgba(212,175,55,0.4)] bg-white/5 px-4 py-2 text-sm font-medium text-[#d4af37] transition hover:bg-white/10"
            >
              Register
            </Link>
          </div>
        </header>

        <div className="flex-1">
          <div className="premium-glass rounded-2xl border border-[rgba(212,175,55,0.25)] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_48px_rgba(0,0,0,0.4)] sm:p-8">
            <h1 className="flex items-center gap-3 text-xl font-bold tracking-tight text-white sm:text-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,162,39,0.4)] bg-[rgba(201,162,39,0.08)] px-3 py-1 text-xs font-medium text-[#c9a227]">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
                </svg>
                Real-time
              </span>
              Just registered
            </h1>
            <p className="mt-2 text-sm text-white/60">
              New registrations appear here as they happen. Keep this page open to watch the list update.
            </p>

            <div className="mt-6 space-y-3">
              {registrations.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 py-12 text-center">
                  <p className="text-white/50">Waiting for registrations…</p>
                  <p className="mt-1 text-xs text-white/40">New entries will show up here in real time.</p>
                </div>
              ) : (
                registrations.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-[rgba(212,175,55,0.2)] hover:bg-white/8"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-[rgba(212,175,55,0.25)]">
                      {r.imageUrl ? (
                        <Image
                          src={r.imageUrl}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                          sizes="56px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-white/10 text-lg font-bold text-white/50">
                          {r.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">{r.name}</p>
                      <p className="truncate text-sm text-white/65">{r.phoneNumber}</p>
                      {r.location && (
                        <p className="mt-0.5 truncate text-xs text-white/45">{r.location}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs font-medium text-[#c9a227]/80">New</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
