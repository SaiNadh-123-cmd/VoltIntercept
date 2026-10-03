import { AnimatePresence, motion } from "framer-motion";
import { Activity, Boxes, Flame, Radar } from "lucide-react";
import { useMission } from "../context/MissionContext";
import { CenterPanel } from "./CenterPanel";
import { TelemetryPanel } from "./TelemetryPanel";
import { VisionPanel } from "./VisionPanel";

export function HUD() {
  const { phase, alertMode, setExplorerOpen, setSimulatorOpen } = useMission();

  return (
    <AnimatePresence>
      {phase === "hud" && (
        <motion.div
          className="relative z-20 flex h-full min-h-screen flex-col px-4 py-5 md:px-8"
          initial={{ opacity: 0, scale: 0.86, y: 48 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] tracking-[0.5em] text-cyan-300/70">SENTINEL 3D</p>
              <h1 className="text-xl font-black tracking-[0.22em] text-white md:text-3xl">
                CYBER-PHYSICAL AI SORTER HUD
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSimulatorOpen(true)}
                className="impact-glow-btn flex items-center gap-2.5 rounded-full border border-red-400/60 bg-red-500/10 px-5 py-2.5 font-mono text-[11px] tracking-[0.2em] text-red-100 transition hover:border-red-300 hover:bg-red-500/20"
              >
                <Flame className="h-4 w-4 text-red-300" />
                LAUNCH IMPACT SIMULATOR
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setExplorerOpen(true)}
                className="glow-btn flex items-center gap-2.5 rounded-full border border-cyan-300/60 bg-cyan-400/10 px-5 py-2.5 font-mono text-[11px] tracking-[0.2em] text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-400/20"
              >
                <Boxes className="h-4 w-4 text-cyan-300" />
                VIEW 3D HARDWARE ARCHITECTURE
              </motion.button>
              <div className="glass-panel flex items-center gap-3 rounded-full px-4 py-2 font-mono text-[11px] tracking-widest">
                <Radar className={`h-4 w-4 ${alertMode ? "text-red-400" : "text-emerald-300"}`} />
                <span className={alertMode ? "text-red-300" : "text-emerald-200"}>
                  {alertMode ? "ALERT MODE // HAZARD LOCK" : "SIMULATION NOMINAL"}
                </span>
                <Activity className="h-4 w-4 text-cyan-300" />
              </div>
            </div>
          </header>

          <div className="grid flex-1 gap-4 lg:grid-cols-[1.35fr_0.9fr_0.95fr]">
            <VisionPanel />
            <CenterPanel />
            <TelemetryPanel />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
