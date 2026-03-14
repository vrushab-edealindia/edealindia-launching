"use client";

import Image from "next/image";
import { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";

type Person = {
  id: number | string;
  name: string;
  phoneNumber: string;
  photo: string;
};

const LUCKY_WINNERS_COUNT = 10;
const CARD_HEIGHT = 88;
const VISIBLE_ROWS = 3;
const REEL_HEIGHT = CARD_HEIGHT * VISIBLE_ROWS;
const NUM_COPIES = 40;

const randBetween = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(randBetween(min, max + 1));

const FAST_SPIN_MS = 12000;
const SLOW_SPIN_MS = 8000;
const CREEP_MS = 5000;
const CREEP2_MS = 3000;
const NUDGE_MS = 4000;

const LOGO_PATH = "/logo/edealindia.webp";

type SpinPhase = "idle" | "fast" | "slowing" | "creep" | "creep2" | "nudge" | "stopped";

const GOLDEN_CONFETTI = ["#c9a227", "#d4af37", "#b8860b", "#daa520", "#c5a028"];

function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${(i * 13 + 5) % 100}%`,
            top: `${(i * 11 + 3) % 100}%`,
            width: 4,
            height: 4,
            background: GOLDEN_CONFETTI[i % GOLDEN_CONFETTI.length],
            opacity: 0.5 + (i % 3) * 0.15,
            animation: `confettiFloat ${4 + (i % 3)}s ease-in-out infinite`,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function SpinPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [people, setPeople] = useState<Person[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [winners, setWinners] = useState<(Person | null)[]>(() => Array(LUCKY_WINNERS_COUNT).fill(null));
  const [currentSlot, setCurrentSlot] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinPhase, setSpinPhase] = useState<SpinPhase>("idle");
  const [translateY, setTranslateY] = useState(0);
  const spinRef = useRef<number | null>(null);
  const [logoError, setLogoError] = useState(false);

  const fetchParticipants = useCallback(() => {
    setParticipantsLoading(true);
    fetch("/api/participants", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          setAuthenticated(false);
          return [];
        }
        return res.ok ? res.json() : [];
      })
      .then((list: { id: string; name: string; phoneNumber: string; imageUrl?: string }[]) => {
        if (Array.isArray(list)) {
          setPeople(
            list.map((p, i) => ({
              id: p.id || String(i),
              name: p.name,
              phoneNumber: p.phoneNumber,
              photo: p.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id || i}`,
            }))
          );
        }
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setParticipantsLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/auth/session", { credentials: "include" })
      .then((res) => {
        if (res.ok) {
          setAuthenticated(true);
          return;
        }
        setAuthenticated(false);
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (authenticated) fetchParticipants();
  }, [authenticated, fetchParticipants]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoginError((data as { error?: string }).error || "Login failed");
        return;
      }
      setAuthenticated(true);
      setLoginEmail("");
      setLoginPassword("");
    } catch {
      setLoginError("Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setAuthenticated(false);
    setPeople([]);
    setWinners(Array(LUCKY_WINNERS_COUNT).fill(null));
    setCurrentSlot(0);
  };

  const wonIds = winners.filter((w): w is Person => w != null).map((w) => w.id);
  const availablePeople = people.filter((p) => !wonIds.includes(p.id));
  const SPIN_LIST = availablePeople.length > 0 ? Array.from({ length: NUM_COPIES }, () => [...availablePeople]).flat() : [];

  const allDone = currentSlot >= LUCKY_WINNERS_COUNT;
  const filledCount = winners.filter(Boolean).length;
  const lastWinner = filledCount > 0 ? winners[filledCount - 1] : null;
  const showBigWinner = !isSpinning && lastWinner != null;

  const spin = useCallback(() => {
    if (isSpinning || allDone || availablePeople.length === 0) return;
    const available = availablePeople;
    const randomIndexInAvailable = Math.floor(Math.random() * available.length);
    const chosen = available[randomIndexInAvailable];
    const spinList = Array.from({ length: NUM_COPIES }, () => [...available]).flat();
    const winnerItemIndex = (NUM_COPIES - 1) * available.length + randomIndexInAvailable;
    const winnerStartIndex = (NUM_COPIES - 1) * available.length;
    const phase1EndIndex = randInt(Math.floor(winnerStartIndex * 0.35), Math.floor(winnerStartIndex * 0.5));
    const y1 = -phase1EndIndex * CARD_HEIGHT;
    const itemsBeforeWinner = randInt(2, 4);
    const y2 = -(winnerItemIndex - itemsBeforeWinner) * CARD_HEIGHT;
    const y3 = -(winnerItemIndex - 1) * CARD_HEIGHT;
    const centerY = -(winnerItemIndex - 1) * CARD_HEIGHT;
    const actualWinner = chosen;

    setIsSpinning(true);
    setSpinPhase("fast");
    setTranslateY(0);

    const T_FAST_END = FAST_SPIN_MS;
    const T_SLOW_END = T_FAST_END + SLOW_SPIN_MS;
    const T_CREEP_END = T_SLOW_END + CREEP_MS;
    const T_CREEP2_END = T_CREEP_END + CREEP2_MS;

    const startTime = performance.now();
    const easeOut4 = (t: number) => 1 - Math.pow(1 - t, 4);
    const easeOut5 = (t: number) => 1 - Math.pow(1 - t, 5);

    const animate = (now: number) => {
      const elapsed = now - startTime;

      if (elapsed < T_FAST_END) setSpinPhase("fast");
      else if (elapsed < T_SLOW_END) setSpinPhase("slowing");
      else if (elapsed < T_CREEP_END) setSpinPhase("creep");
      else if (elapsed < T_CREEP2_END) setSpinPhase("creep2");
      else setSpinPhase("stopped");

      if (elapsed < T_FAST_END) {
        setTranslateY(y1 * (elapsed / FAST_SPIN_MS));
      } else if (elapsed < T_SLOW_END) {
        const t = (elapsed - T_FAST_END) / SLOW_SPIN_MS;
        setTranslateY(y1 + (y2 - y1) * easeOut4(t));
      } else if (elapsed < T_CREEP_END) {
        const t = (elapsed - T_SLOW_END) / CREEP_MS;
        setTranslateY(y2 + (y3 - y2) * easeOut5(t));
      } else if (elapsed < T_CREEP2_END) {
        const t = (elapsed - T_CREEP_END) / CREEP2_MS;
        setTranslateY(y3 + (centerY - y3) * easeOut5(t));
      } else {
        setTranslateY(centerY);
        setWinners((prev) => { const next = [...prev]; next[currentSlot] = actualWinner; return next; });
        setCurrentSlot((s) => s + 1);
        setIsSpinning(false);
        setSpinPhase("idle");
        spinRef.current = null;
        return;
      }
      spinRef.current = requestAnimationFrame(animate);
    };
    spinRef.current = requestAnimationFrame(animate);
  }, [isSpinning, allDone, currentSlot, winners, availablePeople]);

  if (!authChecked) {
    return (
      <div className="premium-bg flex min-h-screen items-center justify-center text-white">
        <p className="text-white/60">Loading…</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="premium-bg flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <a
          href="https://edealindia.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-8"
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
            <span className="text-xl font-bold text-white sm:text-2xl">EdealIndia</span>
          )}
        </a>
        <div className="premium-glass w-full max-w-sm rounded-2xl border border-[rgba(212,175,55,0.25)] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_48px_rgba(0,0,0,0.4)]">
          <h1 className="text-center text-lg font-bold text-white">Admin login</h1>
          <p className="mt-1 text-center text-sm text-white/60">Sign in to access the lucky draw</p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-medium uppercase tracking-wider text-white/60">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@edealindia.in"
                required
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-[#c9a227]/60 focus:outline-none focus:ring-2 focus:ring-[#c9a227]/30"
                autoComplete="email"
                disabled={loginLoading}
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-xs font-medium uppercase tracking-wider text-white/60">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-[#c9a227]/60 focus:outline-none focus:ring-2 focus:ring-[#c9a227]/30"
                autoComplete="current-password"
                disabled={loginLoading}
              />
            </div>
            {loginError && (
              <p className="text-sm text-red-300">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={loginLoading}
              className="premium-gold w-full rounded-xl py-3 font-bold tracking-wide text-[#0f0d1a] shadow-[0_4px_20px_rgba(212,175,55,0.25)] disabled:opacity-50"
            >
              {loginLoading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen premium-bg text-white">
      <Confetti />

      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col px-5 py-6 sm:px-8 sm:py-8">
        <header className="mb-6 flex shrink-0 items-center justify-between gap-4 sm:mb-8">
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
                className="h-10 w-auto object-contain object-left sm:h-12"
                onError={() => setLogoError(true)}
                priority
              />
            ) : (
              <span className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                EdealIndia
              </span>
            )}
          </a>
          <div className="flex items-center gap-2">
            <Link
              href="/form"
              className="rounded-lg border border-[rgba(212,175,55,0.4)] bg-white/5 px-4 py-2 text-sm font-medium text-[#d4af37] transition hover:bg-white/10"
            >
              Add entry
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="mb-6 flex flex-1 flex-col items-center justify-center sm:mb-8">
          {participantsLoading ? (
            <p className="text-white/60">Loading participants…</p>
          ) : people.length === 0 ? (
            <div className="premium-glass w-full max-w-md rounded-2xl border border-[rgba(212,175,55,0.25)] p-8 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(201,162,39,0.3)] bg-[rgba(201,162,39,0.06)] px-3 py-1 text-xs font-medium text-[#c9a227]/90">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
                </svg>
                AI-powered draw
              </span>
              <p className="mt-4 text-white/80">No participants in the database yet.</p>
              <p className="mt-2 text-sm text-white/55">Entries from the registration form will appear here. Our AI will then fairly select the winners.</p>
              <Link
                href="/form"
                className="premium-gold mt-6 inline-block rounded-xl px-6 py-3 font-bold tracking-wide text-[#0f0d1a]"
              >
                Open registration form
              </Link>
            </div>
          ) : showBigWinner ? (
            <div className="premium-glass w-full max-w-sm rounded-2xl border border-[rgba(212,175,55,0.35)] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_48px_rgba(0,0,0,0.4)]">
              <div className="mb-2 flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(201,162,39,0.4)] bg-[rgba(201,162,39,0.08)] px-3 py-1 text-xs font-medium text-[#c9a227]">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
                  </svg>
                  AI selected
                </span>
              </div>
              <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#c9a227]">
                Lucky Winner
              </p>
              <div className="mt-6 flex flex-col items-center">
                <Image
                  src={lastWinner!.photo}
                  alt=""
                  className="h-28 w-28 rounded-full object-cover ring-[3px] ring-[rgba(212,175,55,0.5)] shadow-xl"
                  width={112}
                  height={112}
                  unoptimized
                />
                <p className="mt-6 text-2xl font-bold tracking-tight text-white">{lastWinner!.name}</p>
                <p className="mt-2 text-sm text-white/70">{lastWinner!.phoneNumber}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-3 flex justify-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,162,39,0.4)] bg-[rgba(201,162,39,0.08)] px-4 py-1.5 text-xs font-medium tracking-wide text-[#c9a227]">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
                  </svg>
                  {isSpinning ? "AI selecting winner…" : "AI-powered fair selection"}
                </span>
              </div>
              <div className="mb-1.5 flex justify-center">
                <div
                  className="h-0 w-0 border-l-10 border-r-10 border-t-14 border-l-transparent border-r-transparent border-t-[#c9a227] drop-shadow-[0_0_12px_rgba(201,162,39,0.5)]"
                  aria-hidden
                />
              </div>
              <div className="mb-4 flex justify-center">
                {!logoError ? (
                  <Image
                    src={LOGO_PATH}
                    alt="EdealIndia"
                    width={120}
                    height={42}
                    className="h-9 w-auto object-contain opacity-90"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <span className="text-lg font-bold tracking-tight text-white/90">EdealIndia</span>
                )}
              </div>
              <div
                className="relative w-full max-w-md rounded-[20px] p-[3px] shadow-[0_0_0_1px_rgba(212,175,55,0.2),0_0_40px_rgba(212,175,55,0.08),0_24px_60px_rgba(0,0,0,0.5)]"
                style={{
                  background: "linear-gradient(145deg, rgba(212,175,55,0.35) 0%, rgba(184,134,11,0.2) 50%, rgba(212,175,55,0.25) 100%)",
                }}
              >
                <div
                  className="relative overflow-hidden rounded-[17px] bg-[#0c0a14] shadow-[inset_0_0_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]"
                  style={{
                    height: REEL_HEIGHT,
                    backgroundImage: "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(201,162,39,0.06) 0%, transparent 55%), linear-gradient(rgba(201,162,39,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,39,0.02) 1px, transparent 1px)",
                    backgroundSize: "100% 100%, 24px 24px, 24px 24px",
                  }}
                >
                  <div
                    className="flex flex-col"
                    style={{
                      transform: `translateY(${translateY}px)`,
                      transition: isSpinning ? "none" : "transform 0.2s ease-out",
                    }}
                  >
                    {SPIN_LIST.map((person, i) => (
                      <div
                        key={`${person.id}-${i}`}
                        className="flex shrink-0 items-center gap-4 px-6 pr-14"
                        style={{ height: CARD_HEIGHT, minHeight: CARD_HEIGHT }}
                      >
                        <Image
                          src={person.photo}
                          alt=""
                          width={48}
                          height={48}
                          className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white/20"
                          unoptimized
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold tracking-wide text-white/95">
                            {person.name}
                          </p>
                          <p className="truncate text-xs text-white/65">
                            {person.phoneNumber}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b from-[#0c0a14] via-[#0c0a14]/80 to-transparent" aria-hidden />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-[#0c0a14] via-[#0c0a14]/80 to-transparent" aria-hidden />
                  <div
                    className={`pointer-events-none absolute inset-x-4 rounded-xl border transition-colors duration-300 ${
                      spinPhase === "creep" || spinPhase === "creep2" || spinPhase === "nudge"
                        ? "border-[#c9a227]/60 bg-[rgba(201,162,39,0.12)] shadow-[0_0_20px_rgba(201,162,39,0.15)]"
                        : "border-[rgba(212,175,55,0.3)] bg-[rgba(212,175,55,0.06)]"
                    }`}
                    style={{ top: CARD_HEIGHT + 4, height: CARD_HEIGHT - 8 }}
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center text-[#c9a227]"
                    aria-hidden
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-[0_0_10px_rgba(201,162,39,0.6)]" aria-hidden>
                      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                    </svg>
                  </div>
                </div>
              </div>
            </>
          )}

          {people.length > 0 && (
            <>
              <button
                type="button"
                onClick={spin}
                disabled={isSpinning || allDone || availablePeople.length === 0}
                className="premium-gold mt-6 w-full max-w-md rounded-xl py-4 text-base font-bold tracking-wide text-[#0f0d1a] shadow-[0_4px_20px_rgba(212,175,55,0.25)] transition hover:opacity-95 hover:shadow-[0_6px_28px_rgba(212,175,55,0.3)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
              >
                {allDone ? "Complete" : isSpinning ? "AI selecting…" : "START DRAW"}
              </button>
              <p className="mt-3 flex items-center justify-center gap-2 text-xs font-medium tracking-widest text-white/50 uppercase">
                <svg className="h-3.5 w-3.5 text-[#c9a227]/70" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
                </svg>
                Powered by AI · Fair selection
              </p>
            </>
          )}
        </div>

        <div className="shrink-0">
          <h2 className="mb-4 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/50 sm:justify-start">
            <svg className="h-3.5 w-3.5 text-[#c9a227]/60" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
            </svg>
            Previous Winners
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
            {Array.from({ length: LUCKY_WINNERS_COUNT }, (_, i) => {
              const rank = LUCKY_WINNERS_COUNT - i;
              const person = winners[i];
              return (
                <div
                  key={rank}
                  className="premium-glass flex flex-col items-center rounded-xl border border-white/8 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
                >
                  {person ? (
                    <>
                      <Image
                        src={person.photo}
                        alt=""
                        className="h-14 w-14 rounded-full object-cover ring-2 ring-[rgba(212,175,55,0.25)]"
                        width={56}
                        height={56}
                        unoptimized
                      />
                      <p className="mt-3 w-full truncate text-center text-sm font-semibold text-white">
                        {person.name}
                      </p>
                      <p className="mt-1 w-full truncate text-center text-xs text-white/55">
                        {person.phoneNumber}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="h-14 w-14 rounded-full bg-white/6 ring-1 ring-white/8" />
                      <p className="mt-3 text-center text-xs text-white/35">—</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
