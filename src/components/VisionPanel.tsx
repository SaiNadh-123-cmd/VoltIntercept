import { motion } from "framer-motion";
import { useMission } from "../context/MissionContext";
import { resolveProfile, VisionScanner, type AiScanResult } from "./VisionScanner";

export function VisionPanel() {
  const { recordInterception } = useMission();

  const onHazardDetected = (data: AiScanResult) => {
    if (!data.detected) return;
    const profile = resolveProfile(String(data.matchId ?? ""));
    recordInterception(profile, Number(data.confidence ?? 90));
  };

  return (
    <motion.section
      layout
      className="glass-panel relative flex min-h-[420px] flex-col overflow-hidden rounded-3xl p-5 shadow-[0_0_30px_rgba(34,211,238,0.12)]"
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.4em] text-cyan-300/70">
            NODE 01
          </p>
          <h2 className="text-lg font-semibold tracking-widest text-white">
            VISION CENTER
          </h2>
        </div>
        <div className="glass-panel flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[9px] tracking-[0.2em]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
          <span className="text-cyan-200">LIVE AI ENGINE</span>
        </div>
      </div>

      <VisionScanner onHazardDetected={onHazardDetected} />
    </motion.section>
  );
}
