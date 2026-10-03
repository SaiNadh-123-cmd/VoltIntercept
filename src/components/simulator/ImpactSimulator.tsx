import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronLeft,
  Database,
  Flame,
  Gauge,
  ShieldCheck,
  Thermometer,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useMission } from "../../context/MissionContext";
import { BATTERIES } from "./batteries";
import { SimulatorScene, type SimulatorPhase } from "./SimulatorScene";

const ease = [0.16, 1, 0.3, 1] as const;

export function ImpactSimulator() {
  const { simulatorOpen, setSimulatorOpen } = useMission();
  const [selectedId, setSelectedId] = useState(BATTERIES[0].id);
  const [phase, setPhase] = useState<SimulatorPhase>("idle");
  const [trigger, setTrigger] = useState(0);
  const [explodedScale, setExplodedScale] = useState(1);

  const battery = BATTERIES.find((b) => b.id === selectedId) ?? BATTERIES[0];

  useEffect(() => {
    if (simulatorOpen) setPhase("idle");
  }, [simulatorOpen]);

  useEffect(() => {
    if (!simulatorOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSimulatorOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [simulatorOpen, setSimulatorOpen]);

  const simulate = useCallback(() => {
    if (phase !== "idle") return;
    setPhase("crushing");
    window.setTimeout(() => {
      setExplodedScale(battery.scale);
      setPhase("exploded");
      setTrigger((t) => t + 1);
    }, 750);
  }, [phase, battery.scale]);

  const handleExplosionComplete = useCallback(() => {
    setPhase("idle");
  }, []);

  const particleYield = Math.round(100 * Math.pow(battery.scale, 2.7)).toLocaleString();
  const blastRadius = (battery.scale * 0.7).toFixed(1);
  const peakTemp = 60 + battery.scale * 42;

  const statusText =
    phase === "idle" ? "CRUSHER ARMED" : phase === "crushing" ? "CRUSHING..." : "THERMAL RUNAWAY";

  return (
    <AnimatePresence>
      {simulatorOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-slate-950/90 backdrop-blur-xl md:flex-row"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.99 }}
          transition={{ duration: 0.4, ease }}
        >
          <div
            className={`relative h-[52%] w-full shrink-0 md:h-full md:w-[60%] ${
              phase === "exploded" ? "shake-once" : ""
            }`}
          >
            <SimulatorScene
              battery={phase === "exploded" ? null : battery}
              phase={phase}
              explosionTrigger={trigger}
              explodedScale={explodedScale}
              onExplosionComplete={handleExplosionComplete}
            />

            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSimulatorOpen(false)}
              className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full border border-cyan-300/60 bg-slate-950/60 px-4 py-2.5 font-mono text-[11px] tracking-[0.2em] text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.35)] backdrop-blur-md transition hover:border-cyan-200 hover:shadow-[0_0_40px_rgba(34,211,238,0.6)]"
            >
              <ChevronLeft className="h-4 w-4" />
              RETURN TO MISSION CONTROL
            </motion.button>

            <AnimatePresence>
              {phase !== "idle" && (
                <motion.div
                  key={phase}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center px-4"
                >
                  <div
                    className={`glass-panel flex items-center gap-2.5 rounded-full px-6 py-2.5 font-mono text-[11px] tracking-[0.3em] ${
                      phase === "crushing"
                        ? "border-amber-400/50 text-amber-300"
                        : "border-red-400/60 text-red-300"
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    {phase === "crushing" ? "CRUSHING" : "DETONATED // THERMAL EVENT"}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pointer-events-none absolute bottom-4 left-4 z-10 hidden font-mono text-[9px] tracking-[0.25em] text-cyan-200/60 md:block">
              DRAG · ORBIT &nbsp;/&nbsp; SCROLL · ZOOM
            </div>
          </div>

          <aside className="relative h-[48%] w-full md:h-full md:w-[40%]">
            <div className="glass-panel relative flex h-full flex-col overflow-hidden border-l border-white/10 p-5">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.14),transparent_55%)]" />

              <div className="relative">
                <p className="font-mono text-[10px] tracking-[0.5em] text-red-300/80">
                  SENTINEL 3D // HAZARD LAB
                </p>
                <h2 className="mt-1 text-xl font-black tracking-[0.2em] text-white">
                  IMPACT SIMULATOR
                </h2>
                <p className="mt-1 text-[11px] text-slate-400">
                  Shredder crush physics &amp; thermal runaway visualizer
                </p>
              </div>

              <div className="relative mt-4 flex items-center justify-between">
                <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.35em] text-slate-300">
                  <Database className="h-3.5 w-3.5 text-red-300" />
                  BATTERY DATABASE
                </p>
                <span className="font-mono text-[10px] tracking-widest text-slate-500">
                  {BATTERIES.length} PROFILES
                </span>
              </div>

              <div className="sim-scroll relative mt-2 flex-1 min-h-0 overflow-y-auto pr-1">
                <div className="space-y-2 pb-2">
                  {BATTERIES.map((b) => {
                    const selected = b.id === battery.id;
                    return (
                      <motion.button
                        key={b.id}
                        type="button"
                        whileHover={{ scale: 1.02, x: 3 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedId(b.id)}
                        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                          selected
                            ? "border-red-400/70 bg-red-500/10 shadow-[0_0_22px_rgba(239,68,68,0.25)]"
                            : "border-white/10 bg-white/[0.03] hover:border-red-400/40 hover:bg-red-500/5"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border font-mono text-xs font-bold ${
                            selected
                              ? "border-red-400/60 bg-red-500/20 text-red-200"
                              : "border-white/10 bg-black/40 text-slate-400"
                          }`}
                        >
                          {b.scale}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold tracking-wide text-slate-100">
                            {b.name}
                          </span>
                          <span className="mt-0.5 block font-mono text-[10px] text-slate-400">
                            {b.capacity}
                          </span>
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className="relative mt-3 border-t border-white/10 pt-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={battery.id}
                    initial={{ opacity: 0, x: 60, filter: "blur(6px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, x: -60, filter: "blur(6px)" }}
                    transition={{ duration: 0.35, ease }}
                  >
                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="font-mono text-[9px] tracking-[0.35em] text-red-300/80">
                        IMPACT DATA
                      </p>
                      <h3 className="mt-1.5 text-base font-bold tracking-wide text-white">
                        {battery.name}
                      </h3>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                          <p className="font-mono text-[8px] tracking-[0.25em] text-slate-400">
                            CAPACITY
                          </p>
                          <p className="mt-1 font-mono text-sm font-bold text-cyan-200">
                            {battery.capacity}
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                          <p className="font-mono text-[8px] tracking-[0.25em] text-slate-400">
                            HAZARD CLASS
                          </p>
                          <p className="mt-1 font-mono text-sm font-bold text-red-300">
                            {battery.scale}/10
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-[13px] leading-relaxed text-slate-300">
                        <span className="font-bold text-red-300">SHREDDER IMPACT: </span>
                        {battery.impact}
                      </p>
                      <div className="mt-3 flex gap-1">
                        {Array.from({ length: 10 }, (_, i) => (
                          <span
                            key={i}
                            className={`h-2 flex-1 rounded-sm ${
                              i < battery.scale
                                ? "bg-gradient-to-t from-red-600 to-orange-400 shadow-[0_0_8px_rgba(239,68,68,0.7)]"
                                : "bg-white/10"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[8px] tracking-[0.15em] text-slate-400">
                        <div>
                          <p>PARTICLE YIELD</p>
                          <p className="mt-0.5 text-orange-300">{particleYield}</p>
                        </div>
                        <div>
                          <p>BLAST RADIUS</p>
                          <p className="mt-0.5 text-orange-300">{blastRadius} m</p>
                        </div>
                        <div>
                          <p>PEAK TEMP</p>
                          <p className="mt-0.5 text-orange-300">{peakTemp}°C</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4">
                      <p className="flex items-center gap-2 font-mono text-[9px] tracking-[0.35em] text-emerald-300/90">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        HOW THERMASORT AI PREVENTS THIS
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-300">
                        {battery.prevention}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[9px] tracking-[0.2em] text-emerald-200/70">
                        <span className="flex items-center gap-1">
                          <Video className="h-3 w-3" /> RGB 60FPS
                        </span>
                        <span className="flex items-center gap-1">
                          <Thermometer className="h-3 w-3" /> MLX90640 IR
                        </span>
                        <span className="flex items-center gap-1">
                          <Gauge className="h-3 w-3" /> &lt;40MS EJECT
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="mt-3 flex items-center justify-between font-mono text-[10px] tracking-[0.25em]">
                  <span className="text-slate-400">CRUSH STATUS</span>
                  <span
                    className={
                      phase === "idle" ? "text-emerald-300" : "animate-pulse text-red-400"
                    }
                  >
                    {statusText}
                  </span>
                </div>

                <motion.button
                  type="button"
                  whileHover={phase === "idle" ? { scale: 1.03 } : undefined}
                  whileTap={phase === "idle" ? { scale: 0.97 } : undefined}
                  onClick={() => void simulate()}
                  disabled={phase !== "idle"}
                  className="crush-btn mt-3 flex w-full items-center justify-center gap-3 rounded-2xl border border-red-500/80 bg-red-600/25 px-6 py-5 text-sm font-black tracking-[0.2em] text-red-50 shadow-[0_0_35px_rgba(239,68,68,0.5)] transition disabled:opacity-40"
                >
                  <Flame className="h-6 w-6" />
                  SIMULATE SHREDDER CRUSH (WARNING)
                </motion.button>
              </div>
            </div>
          </aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
