import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen premium-bg text-white">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-12">
        <a
          href="https://edealindia.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-8 flex items-center gap-3"
        >
          <Image
            src="/logo/edealindia.webp"
            alt="EdealIndia"
            width={160}
            height={56}
            className="h-12 w-auto object-contain"
            priority
          />
        </a>
        <h1 className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Edi with EdealIndia
        </h1>
        <p className="mt-3 text-center text-white/70">
          Register for the lucky draw or open the spin.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/form"
            className="premium-gold rounded-xl px-8 py-4 text-center font-bold tracking-wide text-[#0f0d1a] shadow-[0_4px_20px_rgba(212,175,55,0.25)] transition hover:opacity-95 hover:shadow-[0_6px_28px_rgba(212,175,55,0.3)]"
          >
            Register (form)
          </Link>
          <Link
            href="/spin"
            className="rounded-xl border-2 border-[rgba(212,175,55,0.5)] bg-white/5 px-8 py-4 text-center font-bold tracking-wide text-[#d4af37] transition hover:bg-white/10"
          >
            Lucky draw (spin)
          </Link>
        </div>
      </div>
    </div>
  );
}
