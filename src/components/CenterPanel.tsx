import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { AlertOctagon, Hexagon } from "lucide-react";
import { useMission } from "../context/MissionContext";

export function CenterPanel() {
  const { eject, incidentReport } = useMission();
  const controls = useAnimation();

  const onEject = () => {
    void controls.start({
      x: [0, -9, 9, -7, 7, -4, 4, 0],
      rotate: [0, -2, 2, -1.5, 1.5, 0],
      transition: { duration: 0.5, ease: "easeInOut" },
    });
    eject();
  };

  const downloadReport = () => {
    if (!incidentReport) return;

    const reportContent = `
========================================
VOLTINTERCEPT - INDUSTRIAL HAZARD REPORT
========================================
Date: ${new Date().toLocaleString()}
Status: ${incidentReport.count > 0 ? "HAZARD DETECTED" : "CLEAR"}
Total Batteries: ${incidentReport.count}
Total Weight: ${incidentReport.totalWeight.toFixed(2)} kg
Estimated Financial Damage Prevented: ₹${incidentReport.totalDamage.toLocaleString("en-IN")}

DETAILED BREAKDOWN:
${incidentReport.batteries
  .map(
    (b, i) =>
      `[${i + 1}] ${b.type} | Danger:${b.dangerLevel} | Capacity: ${b.capacity} | Weight:${b.weightKg}kg`,
  )
  .join("\n")}
========================================
SYSTEM: EDGE VISION PIPELINE
========================================
  `.trim();

    const blob = new Blob([reportContent], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `VoltIntercept_Report_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.section
      className="glass-panel relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-3xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.12)]"
      initial={{ opacity: 0, y: 36, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.75, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
    >
      <div>
        <p className="font-mono text-[10px] tracking-[0.4em] text-red-300/80">NODE 02</p>
        <h2 className="mt-1 text-lg font-semibold tracking-widest text-white">3D EXPLAINER</h2>
        <p className="mt-5 text-sm leading-relaxed text-slate-300">
          The AI isolates the battery shape via RGB, cross-references with thermal anomalies, and triggers the
          physical pneumatic kicker.
        </p>
        <ul className="mt-5 space-y-2 font-mono text-[11px] tracking-wide text-cyan-100/80">
          <li className="flex gap-2">
            <Hexagon className="mt-0.5 h-3.5 w-3.5 text-cyan-300" />
            RGB isolator locks contour geometry
          </li>
          <li className="flex gap-2">
            <Hexagon className="mt-0.5 h-3.5 w-3.5 text-emerald-300" />
            MLX90640 thermal map fusion
          </li>
          <li className="flex gap-2">
            <Hexagon className="mt-0.5 h-3.5 w-3.5 text-red-400" />
            Pneumatic kicker armed at 6 bar
          </li>
        </ul>
      </div>

      <motion.button
        type="button"
        animate={controls}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        onClick={onEject}
        className="mt-8 flex items-center justify-center gap-3 rounded-2xl border border-red-500/70 bg-red-600/20 px-6 py-8 text-center text-lg font-black tracking-[0.18em] text-red-100 shadow-[0_0_28px_rgba(239,68,68,0.45)] transition hover:shadow-[0_0_55px_rgba(239,68,68,0.8)]"
      >
        <AlertOctagon className="h-7 w-7" />
        MANUAL OVERRIDE EJECT
      </motion.button>

      <AnimatePresence>
        {incidentReport && incidentReport.count > 0 && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={downloadReport}
            className="mt-4 w-full rounded-md border border-blue-500/50 bg-blue-600/20 px-4 py-3 font-mono uppercase tracking-widest text-blue-400 transition-all hover:bg-blue-600/40 hover:text-white"
          >
            📄 Download Incident Report
          </motion.button>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
