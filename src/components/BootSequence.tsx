import { AnimatePresence, motion } from "framer-motion";
import { Cpu, Loader2, RadioTower, TerminalSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { useMission } from "../context/MissionContext";

const LINES = [
  { text: "Scanning for MLX90640 Thermal Array...", result: "[FAILED]", delay: 700 },
  { text: "Scanning for Hardware Actuator...", result: "[FAILED]", delay: 1500 },
  { text: "I2C bus handshake timeout @ 0x33", result: "[WARN]", delay: 2200 },
  { text: "Fallback simulation kernel available", result: "[READY]", delay: 2900 },
];

export function BootSequence() {
  const { phase, setPhase } = useMission();
  const [visibleCount, setVisibleCount] = useState(0);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (phase !== "boot") return;
    const timers = LINES.map((line, index) =>
      window.setTimeout(() => {
        setVisibleCount(index + 1);
        setTyped("");
      }, line.delay),
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [phase]);

  useEffect(() => {
    if (phase !== "boot" || visibleCount === 0) return;
    const full = LINES[visibleCount - 1].text;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(full.slice(0, i));
      if (i >= full.length) window.clearInterval(id);
    }, 16);
    return () => window.clearInterval(id);
  }, [phase, visibleCount]);

  return (
    <AnimatePresence>
      {(phase === "boot" || phase === "waiting") && (
        <motion.div
          key="boot-overlay"
          className="fixed inset-0 z-40 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.18,
            filter: "blur(22px)",
            rotate: -6,
            transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
          }}
        >
          <motion.div
            className="glass-panel relative w-full max-w-3xl overflow-hidden rounded-3xl p-8 shadow-[0_0_80px_rgba(34,211,238,0.18)] md:p-12"
            initial={{ y: 40, scale: 0.92, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 16 }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_55%)]" />
            <div className="relative">
              <p className="font-mono text-[11px] tracking-[0.45em] text-cyan-300/80">SENTINEL OS // REV 3.0</p>
              <h1 className="mt-3 text-3xl font-black tracking-[0.18em] text-white md:text-5xl">
                SYSTEM INITIALIZATION
              </h1>
              <p className="mt-3 max-w-xl text-sm text-slate-400">
                Cyber-physical sorter kernel booting. Thermal array, RGB isolator, and pneumatic kicker must
                authenticate before live sort.
              </p>

              <div className="mt-8 space-y-3 rounded-2xl border border-white/10 bg-black/50 p-5 font-mono text-sm">
                {LINES.slice(0, visibleCount).map((line, index) => {
                  const isLast = index === visibleCount - 1;
                  const label = isLast ? typed : line.text;
                  const showResult = !isLast || typed.length === line.text.length;
                  const failed = line.result.includes("FAIL") || line.result.includes("WARN");
                  return (
                    <div key={line.text} className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-cyan-100/90">
                        <TerminalSquare className="mr-2 inline h-4 w-4 text-cyan-400" />
                        {label}
                        {isLast && typed.length < line.text.length && (
                          <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-cyan-300" />
                        )}
                      </span>
                      {showResult && (
                        <span className={failed ? "text-red-400" : "text-emerald-400"}>{line.result}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPhase("waiting")}
                  className="group rounded-2xl border border-cyan-300/40 bg-cyan-500/10 px-5 py-6 text-left shadow-[0_0_24px_rgba(34,211,238,0.18)] transition hover:shadow-[0_0_40px_rgba(34,211,238,0.4)]"
                >
                  <RadioTower className="h-6 w-6 text-cyan-300" />
                  <p className="mt-3 text-sm font-semibold tracking-wide text-white">Connect Hardware Sensors</p>
                  <p className="mt-1 text-xs text-slate-400">Requires physical rig</p>
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPhase("hud")}
                  className="rounded-2xl border border-emerald-400/50 bg-emerald-500/10 px-5 py-6 text-left shadow-[0_0_24px_rgba(16,185,129,0.25)] transition hover:shadow-[0_0_44px_rgba(16,185,129,0.55)]"
                >
                  <Cpu className="h-6 w-6 text-emerald-300" />
                  <p className="mt-3 text-sm font-semibold tracking-wide text-white">Bypass to Software Simulation</p>
                  <p className="mt-1 text-xs text-slate-400">Launch holographic HUD</p>
                </motion.button>
              </div>

              <AnimatePresence>
                {phase === "waiting" && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-6 flex items-center gap-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 font-mono text-sm text-cyan-200"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Waiting for I2C connection...
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
