import { AnimatePresence, motion } from "framer-motion";
import { Camera, Cpu, ScanSearch, Thermometer, X, Zap } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useMission } from "../../context/MissionContext";
import { COMPONENT_INFO, COMPONENT_ORDER, type ComponentId } from "./constants";
import { ExplorerScene } from "./ExplorerScene";

const ICONS: Record<ComponentId, ReactNode> = {
  camera: <Camera className="h-5 w-5" />,
  thermal: <Thermometer className="h-5 w-5" />,
  aihub: <Cpu className="h-5 w-5" />,
  kicker: <Zap className="h-5 w-5" />,
};

const ease = [0.16, 1, 0.3, 1] as const;

export function HardwareExplorer() {
  const { explorerOpen, setExplorerOpen } = useMission();
  const [activeComponent, setActiveComponent] = useState<ComponentId | null>(null);

  useEffect(() => {
    if (explorerOpen) setActiveComponent(null);
  }, [explorerOpen]);

  useEffect(() => {
    if (!explorerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExplorerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [explorerOpen, setExplorerOpen]);

  const active = activeComponent ? COMPONENT_INFO[activeComponent] : null;

  return (
    <AnimatePresence>
      {explorerOpen && (
        <motion.div
          className="fixed inset-0 z-50 overflow-hidden bg-slate-950/85 backdrop-blur-2xl"
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.99 }}
          transition={{ duration: 0.4, ease }}
        >
          <div className="absolute inset-0">
            <ExplorerScene onSelect={setActiveComponent} />
          </div>

          <div className="pointer-events-none absolute inset-3 rounded-3xl border border-white/10" />
          <div className="corner-brackets absolute inset-3">
            <span className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-cyan-300/70" />
            <span className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-cyan-300/70" />
            <span className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-cyan-300/70" />
            <span className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-cyan-300/70" />
          </div>

          <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-start justify-between gap-4 p-6 md:p-8">
            <div>
              <p className="font-mono text-[10px] tracking-[0.5em] text-cyan-300/70">
                INTERACTIVE 3D HARDWARE EXPLORER
              </p>
              <h2 className="mt-1 text-xl font-black tracking-[0.2em] text-white md:text-3xl">
                SYSTEM ARCHITECTURE
              </h2>
            </div>
            <motion.button
              type="button"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setExplorerOpen(false)}
              className="pointer-events-auto flex items-center gap-2 rounded-full border border-red-400/60 bg-red-500/15 px-5 py-2.5 font-mono text-[11px] tracking-[0.2em] text-red-100 shadow-[0_0_24px_rgba(239,68,68,0.35)] transition hover:border-red-300 hover:shadow-[0_0_42px_rgba(239,68,68,0.6)]"
            >
              <X className="h-4 w-4" />
              EXIT 3D VIEW
            </motion.button>
          </header>

          <nav className="absolute left-6 top-28 z-10 hidden flex-col gap-2 lg:flex">
            {COMPONENT_ORDER.map((id) => {
              const item = COMPONENT_INFO[id];
              const selected = activeComponent === id;
              return (
                <motion.button
                  key={id}
                  type="button"
                  whileHover={{ scale: 1.04, x: 4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveComponent(id)}
                  className="glass-panel flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition"
                  style={
                    selected
                      ? {
                          borderColor: `${item.accent}99`,
                          boxShadow: `0 0 26px ${item.accent}44, inset 0 0 18px ${item.accent}22`,
                        }
                      : undefined
                  }
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: item.accent, boxShadow: `0 0 12px ${item.accent}` }}
                  />
                  <span className="font-mono text-[10px] tracking-[0.18em] text-slate-200">
                    {item.title.toUpperCase()}
                  </span>
                </motion.button>
              );
            })}
          </nav>

          <AnimatePresence mode="wait">
            {active && activeComponent ? (
              <motion.aside
                key={`panel-${activeComponent}`}
                initial={{ opacity: 0, x: 90, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 70, filter: "blur(10px)" }}
                transition={{ duration: 0.45, ease }}
                className="glass-panel absolute bottom-24 right-4 top-32 z-10 flex w-[calc(100%-2rem)] flex-col rounded-3xl p-6 md:right-8 md:top-28 md:w-[360px]"
                style={{ boxShadow: `0 0 46px ${active.accent}38, inset 0 0 30px ${active.accent}11` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
                      style={{
                        borderColor: `${active.accent}77`,
                        background: `${active.accent}1a`,
                        color: active.accent,
                        boxShadow: `0 0 18px ${active.accent}55`,
                      }}
                    >
                      {ICONS[activeComponent]}
                    </div>
                    <div>
                      <p
                        className="font-mono text-[9px] tracking-[0.35em]"
                        style={{ color: `${active.accent}cc` }}
                      >
                        {active.tag}
                      </p>
                      <h3 className="mt-0.5 text-base font-bold tracking-wide text-white">
                        {active.title}
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveComponent(null)}
                    className="rounded-full border border-white/15 p-1.5 text-slate-400 transition hover:border-white/40 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div
                  className="my-4 h-px w-full"
                  style={{
                    background: `linear-gradient(90deg, ${active.accent}, transparent)`,
                    boxShadow: `0 0 12px ${active.accent}`,
                  }}
                />

                <p className="text-sm leading-relaxed text-slate-300">{active.desc}</p>

                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  <span
                    className="rounded-full border px-2.5 py-1 font-mono text-[9px] tracking-[0.2em]"
                    style={{ borderColor: `${active.accent}55`, color: active.accent }}
                  >
                    STATUS · ONLINE
                  </span>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[9px] tracking-[0.2em] text-slate-400">
                    I2C · 0x33
                  </span>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[9px] tracking-[0.2em] text-slate-400">
                    GPIO · ARMED
                  </span>
                </div>
              </motion.aside>
            ) : (
              <motion.div
                key="panel-hint"
                initial={{ opacity: 0, x: 70 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 70 }}
                transition={{ duration: 0.4, ease }}
                className="glass-panel absolute bottom-24 right-4 top-32 z-10 flex w-[calc(100%-2rem)] flex-col items-start justify-center rounded-3xl p-6 md:right-8 md:top-28 md:w-[320px]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/40 bg-cyan-400/10 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.35)]">
                  <ScanSearch className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-bold tracking-[0.2em] text-white">
                  SELECT A COMPONENT
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  Hover any module on the rig to highlight it, then click to inspect its role in the
                  sorting pipeline.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center px-4">
            <div className="glass-panel flex flex-wrap items-center justify-center gap-x-6 gap-y-1 rounded-full px-6 py-2.5 font-mono text-[10px] tracking-[0.25em] text-cyan-100/80">
              <span>DRAG · ORBIT</span>
              <span>SCROLL · ZOOM</span>
              <span>CLICK COMPONENT · INSPECT</span>
              <span>ESC · EXIT</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
