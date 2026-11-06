"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Container, Button } from "./ui";
import Reveal from "./Reveal";
import { terminalFocus } from "../data/content";

/* ---------- Timing (ms) ---------- */
const TYPE_MIN = 55;
const TYPE_JITTER = 65;
const ENTER_DELAY = 220;
const OUT_DELAY = 140;
const HOLD_BEFORE_CLEAR = 4000;
const FALLBACK_INTRO = 12000; // jaga-jaga kalau animationend tidak pernah terpicu
const TYPO_EVERY = 2; // typo muncul tiap kunjungan ke-2, ke-4, dst. pada putaran 1

/* ---------- Warna ---------- */
const OK = "text-[#73d9a4]"; // hijau
const ERR = "text-[#ff6e7a]"; // merah
const CYAN = "text-[#7dcfff]"; // cyan
const AMB = "text-[#f7c76b]"; // kuning
const LAV = "text-[#d9c7ff]"; // lavender
const DIM = "text-[#827c99]"; // redup

/* ---------- Tipe & data ---------- */
type Seg = { t: string; c?: string };
type Row =
  | { k: "cmd"; text: string }
  | { k: "out"; segs: Seg[] }
  | { k: "blank" };
type Step = {
  cmd: string;
  out: Seg[][];
  typo?: string; // versi salah ketik dari cmd
  lineDelay?: number; // jeda antar baris output
};

const t = (text: string, c?: string): Seg => ({ t: text, c });

const whoami: Step = {
  cmd: "whoami",
  out: [
    [t("Rasena", "font-bold text-white"), t(" - network & linux enthusiast")],
  ],
};

const focus: Step = {
  cmd: "cat focus.txt",
  typo: "cta focus.txt",
  out: terminalFocus.map((line) => [t(line, LAV)]),
};

const ipBr: Step = {
  cmd: "ip -br a",
  out: [
    [t("lo", CYAN), t("      "), t("UNKNOWN", DIM), t("   "), t("127.0.0.1/8")],
    [
      t("eth0", CYAN),
      t("    "),
      t("UP", OK),
      t("        "),
      t("192.168.10.2/24"),
    ],
  ],
};

const ping: Step = {
  cmd: "ping -c 3 1.1.1.1",
  lineDelay: 700,
  out: [
    [
      t("64 bytes from "),
      t("1.1.1.1", CYAN),
      t(": icmp_seq=1 ttl=57 time="),
      t("12.4 ms", OK),
    ],
    [
      t("64 bytes from "),
      t("1.1.1.1", CYAN),
      t(": icmp_seq=2 ttl=57 time="),
      t("11.9 ms", OK),
    ],
    [
      t("64 bytes from "),
      t("1.1.1.1", CYAN),
      t(": icmp_seq=3 ttl=57 time="),
      t("12.1 ms", OK),
    ],
    [t("3 packets transmitted, 3 received, "), t("0% packet loss", OK)],
  ],
};

const ss: Step = {
  cmd: "ss -tuln",
  out: [
    [t("Netid  State   Local Address:Port", DIM)],
    [t("tcp", CYAN), t("    "), t("LISTEN", OK), t("  "), t("0.0.0.0:22")],
    [t("tcp", CYAN), t("    "), t("LISTEN", OK), t("  "), t("0.0.0.0:80")],
    [t("tcp", CYAN), t("    "), t("LISTEN", OK), t("  "), t("0.0.0.0:443")],
  ],
};

const nginx: Step = {
  cmd: "systemctl is-active nginx",
  out: [[t("active", OK)]],
};

const hire: Step = {
  cmd: "./hire-me.sh",
  out: [[t("Status:", AMB), t(" open to opportunities "), t("✓", OK)]],
};

// Tiap putaran: clear -> whoami -> command lain
const rounds: Step[][] = [
  [whoami, focus], // 1: identitas (sama dengan intro)
  [whoami, ipBr, ping], // 2: networking
  [whoami, ss, nginx], // 3: server
  [whoami, hire], // 4: status
];

const errRow = (typo: string): Row => ({
  k: "out",
  segs: [t(`bash: ${typo.split(" ")[0]}: command not found`, ERR)],
});

function stepRows(step: Step, withTypo: boolean): Row[] {
  const rows: Row[] = [];
  if (withTypo && step.typo) {
    rows.push({ k: "cmd", text: step.typo }, errRow(step.typo));
  }
  rows.push({ k: "cmd", text: step.cmd });
  step.out.forEach((segs) => rows.push({ k: "out", segs }));
  rows.push({ k: "blank" });
  return rows;
}

const roundRows = (round: Step[], withTypo: boolean): Row[] =>
  round.flatMap((s) => stepRows(s, withTypo));

// State akhir intro = titik awal loop (supaya transisinya mulus)
const introRows = roundRows(rounds[0], false);
// Layar "hantu" tak terlihat, dipakai untuk mengunci tinggi kartu
const ghostScreens = rounds.map((r) => roundRows(r, true));

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* ---------- Komponen kecil ---------- */
function Prompt() {
  return (
    <>
      <span className="font-bold text-mint">rasena@lab</span>
      <span className="text-white">:</span>
      <span className="font-bold text-accent">~</span>
      <span className="text-white">$</span>
    </>
  );
}

function Cursor() {
  return (
    <span className="inline-block h-3.5 w-[7px] animate-blink bg-accent align-middle" />
  );
}

// Pewarnaan command: perintah, flag, argumen
function CmdText({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((w, i) => {
        const cls =
          i === 0
            ? `${w.startsWith("./") ? OK : AMB} font-semibold`
            : w.startsWith("-")
              ? CYAN
              : LAV;
        return (
          <span key={i}>
            {i > 0 && " "}
            <span className={cls}>{w}</span>
          </span>
        );
      })}
    </>
  );
}

function RowView({ row }: { row: Row }) {
  if (row.k === "blank")
    return (
      <div>
        <br />
      </div>
    );
  if (row.k === "cmd")
    return (
      <div className="whitespace-pre-wrap break-words">
        <Prompt /> <CmdText text={row.text} />
      </div>
    );
  return (
    <div className="whitespace-pre-wrap break-words">
      {row.segs.map((s, i) => (
        <span key={i} className={s.c}>
          {s.t}
        </span>
      ))}
    </div>
  );
}

// Baris terminal fase intro (animasi diatur di globals.css)
function Line({
  i,
  children,
  onAnimationEnd,
}: {
  i: number;
  children?: ReactNode;
  onAnimationEnd?: (e: React.AnimationEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      className="term-line"
      style={{ "--i": i } as CSSProperties}
      onAnimationEnd={onAnimationEnd}
    >
      {children}
    </div>
  );
}

/* ---------- Terminal ---------- */
function Terminal() {
  const [splashDone, setSplashDone] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [looping, setLooping] = useState(false);
  const [rows, setRows] = useState<Row[]>(introRows);
  const [typing, setTyping] = useState("");
  const [busy, setBusy] = useState(false); // true = command sedang "dieksekusi", prompt disembunyikan

  // 1. Tunggu splash selesai (kalau ada)
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.splash !== "on") {
      setSplashDone(true);
      return;
    }
    const onDone = () => setSplashDone(true);
    window.addEventListener("splash:done", onDone, { once: true });
    return () => window.removeEventListener("splash:done", onDone);
  }, []);

  // 2. Fallback kalau animationend tidak terpicu
  useEffect(() => {
    if (!splashDone || introDone) return;
    const timer = setTimeout(() => setIntroDone(true), FALLBACK_INTRO);
    return () => clearTimeout(timer);
  }, [splashDone, introDone]);

  // 3. Loop baru jalan setelah splash selesai DAN animasi intro tuntas
  useEffect(() => {
    if (!splashDone || !introDone) return;
    // reduced-motion: biarkan statis, tanpa loop
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let alive = true;
    setRows(introRows);
    setLooping(true);

    const add = (row: Row) => setRows((r) => [...r, row]);

    // Ketik command huruf per huruf. commit=false untuk "clear" (langsung dihapus layar)
    const runCmd = async (text: string, commit = true) => {
      for (let i = 1; i <= text.length; i++) {
        if (!alive) return false;
        setTyping(text.slice(0, i));
        await sleep(TYPE_MIN + Math.random() * TYPE_JITTER);
      }
      await sleep(ENTER_DELAY);
      if (!alive) return false;
      setTyping("");
      if (commit) {
        add({ k: "cmd", text });
        setBusy(true);
      }
      return true;
    };

    const runStep = async (step: Step, withTypo: boolean) => {
      if (withTypo && step.typo) {
        if (!(await runCmd(step.typo))) return false;
        await sleep(OUT_DELAY);
        add(errRow(step.typo));
        setBusy(false);
        await sleep(700); // "sadar" salah ketik
        if (!alive) return false;
      }
      if (!(await runCmd(step.cmd))) return false;
      for (const segs of step.out) {
        await sleep(step.lineDelay ?? OUT_DELAY);
        if (!alive) return false;
        add({ k: "out", segs });
      }
      await sleep(200);
      if (!alive) return false;
      add({ k: "blank" });
      setBusy(false);
      await sleep(450);
      return alive;
    };

    const run = async () => {
      let idx = 1; // putaran 1 sudah tampil sebagai intro
      let r0Visits = 0;
      await sleep(HOLD_BEFORE_CLEAR);

      while (alive) {
        if (!(await runCmd("clear", false))) return;
        await sleep(150);
        if (!alive) return;
        setRows([]);
        await sleep(400);

        let withTypo = false;
        if (idx === 0) {
          r0Visits += 1;
          withTypo = r0Visits % TYPO_EVERY === 0;
        }

        for (const step of rounds[idx]) {
          if (!(await runStep(step, withTypo))) return;
        }

        await sleep(HOLD_BEFORE_CLEAR);
        idx = (idx + 1) % rounds.length;
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [splashDone, introDone]);

  return (
    <div
      aria-label="Ilustrasi terminal Linux"
      className="overflow-hidden rounded-[18px] border border-[#38304f] bg-[#0d0d16] shadow-[0_30px_90px_#0008] md:max-w-none md:rotate-1 max-w-[580px]"
    >
      <div className="flex h-11 items-center gap-[7px] border-b border-line bg-[#171522] px-3.5">
        <span className="h-[9px] w-[9px] rounded-full bg-[#ff6e7a]" />
        <span className="h-[9px] w-[9px] rounded-full bg-[#f7c76b]" />
        <span className="h-[9px] w-[9px] rounded-full bg-[#73d9a4]" />
        <span className="ml-auto text-[11px] text-[#827c99]">
          rasena@lab: ~
        </span>
      </div>

      <div className="grid px-3.5 py-[18px] font-mono text-[11px] leading-loose text-[#c8c3da] sm:px-[22px] sm:pb-7 sm:pt-6 sm:text-[13px]">
        {/* Layar tak terlihat: semua putaran ditumpuk di sel yang sama,
            sehingga tinggi kartu = putaran terpanjang dan tidak pernah loncat */}
        {ghostScreens.map((screen, gi) => (
          <div
            key={gi}
            aria-hidden="true"
            className="invisible min-w-0"
            style={{ gridArea: "1 / 1" }}
          >
            {screen.map((row, i) => (
              <RowView key={i} row={row} />
            ))}
            <div>
              <Prompt /> <Cursor />
            </div>
          </div>
        ))}

        <div className="min-w-0" style={{ gridArea: "1 / 1" }}>
          {!looping ? (
            // Fase intro: animasi CSS bawaan
            <>
              {introRows.map((row, i) => (
                <Line key={i} i={i}>
                  <RowView row={row} />
                </Line>
              ))}
              <Line
                i={introRows.length}
                onAnimationEnd={(e) => {
                  if (e.target === e.currentTarget) setIntroDone(true);
                }}
              >
                <Prompt /> <Cursor />
              </Line>
            </>
          ) : (
            // Fase loop: terminal "hidup"
            <>
              {rows.map((row, i) => (
                <RowView key={i} row={row} />
              ))}
              {!busy && (
                <div className="whitespace-pre-wrap break-words">
                  <Prompt /> <CmdText text={typing} />
                  <Cursor />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Hero ---------- */
export default function Hero() {
  return (
    <Container
      as="section"
      id="home"
      className="grid items-center gap-[38px] pb-11 pt-[58px] sm:pb-[78px] sm:pt-[70px] md:grid-cols-[1.25fr_.75fr] md:gap-[54px] md:pt-[100px]"
    >
      <div>
        <Reveal>
          <div className="inline-flex items-center gap-[9px] rounded-full border border-[#b58aff50] bg-[#b58aff12] px-3 py-[7px] text-xs font-bold uppercase tracking-[0.08em] text-[#d9c7ff]">
            <span className="h-[7px] w-[7px] animate-pulse rounded-full bg-mint shadow-[0_0_12px_#7ce3bd88]" />
            Open to learning & opportunities
          </div>
        </Reveal>

        <Reveal delay={120}>
          <h1 className="mb-5 mt-6 text-[clamp(42px,6vw,70px)] font-bold leading-[1.06] tracking-[-0.055em]">
            {/* Terbaca oleh Google & screen reader, tidak terlihat di layar */}
            <span className="sr-only">Rasena, Network Engineer: </span>
            Building reliable
            <br />
            <em className="not-italic text-accent">networks & systems.</em>
          </h1>
        </Reveal>

        <Reveal delay={260}>
          <p className="max-w-[630px] text-base text-muted sm:text-lg">
            Halo, saya <strong>Rasena</strong> - Calon Network Engineer dan
            Linux System Administrator. Saya sedang membangun fondasi
            networking, Linux server, deployment, dan automation melalui
            hands-on lab serta proyek mandiri.
          </p>
        </Reveal>

        <Reveal delay={400}>
          <div className="mt-[30px] flex flex-wrap gap-3">
            <Button primary href="#portfolio">
              Lihat proyek <span>↗</span>
            </Button>
            <Button href="#contact">Hubungi saya</Button>
          </div>
        </Reveal>

        <Reveal delay={520}>
          <p className="mt-6 text-[13px] text-muted">
            📍 Bekasi, Indonesia <span className="px-2 text-[#514a67]">/</span>{" "}
            Fokus: Networking · Linux · Infrastructure
          </p>
        </Reveal>
      </div>

      <Reveal variant="right" delay={300}>
        <Terminal />
      </Reveal>
    </Container>
  );
}
