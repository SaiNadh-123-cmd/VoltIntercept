import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { useMission } from "../context/MissionContext";

export function EjectionOverlay() {
  const { isEjecting } = useMission();
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isEjecting) return;
    setCoords({ x: 0, y: 0 });
    const id = window.setInterval(() => {
      setCoords((prev) => ({
        x: prev.x + Math.floor(Math.random() * 37) + 4,
        y: prev.y + Math.floor(Math.random() * 12) + 1,
      }));
    }, 60);
    return () => window.clearInterval(id);
  }, [isEjecting]);

  return (
    <AnimatePresence>
      {isEjecting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md"
        >
          <div className="grid-noise-red pointer-events-none absolute inset-0 opacity-60" />
          <motion.div
            initial={{ scale: 0.92, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-[min(860px,92vw)] rounded-3xl border border-red-500/50 bg-slate-950/80 p-6 shadow-[0_0_60px_rgba(239,68,68,0.35)]"
          >
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] tracking-[0.4em] text-red-400">
                PNEUMATIC EJECTOR // DIGITAL TWIN
              </p>
              <p className="font-mono text-[10px] tracking-[0.2em] text-amber-300">
                CH-06 BAR
              </p>
            </div>

            <motion.p
              animate={{ opacity: [1, 0.25, 1] }}
              transition={{ duration: 0.7, repeat: Infinity }}
              className="mt-3 flex items-center justify-center gap-2 text-center font-mono text-sm font-black tracking-[0.2em] text-red-400"
            >
              <AlertTriangle className="h-4 w-4 text-amber-300" />
              <span>
                <span className="text-amber-300">⚠️ OVERRIDE ENGAGED:</span>{" "}
                ACTUATING PNEUMATIC EJECTOR...
              </span>
            </motion.p>

            <div className="relative mt-4 h-64 overflow-hidden rounded-2xl border border-white/10 bg-black/60">
              <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px bg-cyan-400/20" />
              <div className="pointer-events-none absolute left-0 top-1/2 h-px w-full bg-cyan-400/20" />
              <span className="absolute left-2 top-2 h-5 w-5 border-l-2 border-t-2 border-cyan-300/60" />
              <span className="absolute right-2 top-2 h-5 w-5 border-r-2 border-t-2 border-cyan-300/60" />
              <span className="absolute bottom-2 left-2 h-5 w-5 border-b-2 border-l-2 border-cyan-300/60" />
              <span className="absolute bottom-2 right-2 h-5 w-5 border-b-2 border-r-2 border-cyan-300/60" />

              <motion.div
                initial={{ left: "-20%" }}
                animate={{ left: "120%" }}
                transition={{ duration: 1, repeat: 2, ease: "easeInOut" }}
                className="absolute bottom-8 top-8 w-6 rounded-md bg-gradient-to-b from-yellow-300 via-amber-400 to-orange-600 shadow-[0_0_30px_rgba(245,158,11,0.9)]"
              />
              <motion.div
                initial={{ left: "-13%", opacity: 1, y: 0 }}
                animate={{
                  left: "121%",
                  y: [0, 0, 0, 52],
                  opacity: [1, 1, 1, 0],
                }}
                transition={{ duration: 1, repeat: 2, ease: "easeInOut" }}
                className="absolute top-[calc(50%-28px)] h-14 w-14 rounded-md border border-red-400 bg-red-600/70 shadow-[0_0_30px_rgba(239,68,68,0.9)]"
              />

              <div className="absolute bottom-2 left-3 font-mono text-[10px] tracking-[0.2em] text-cyan-300">
                X:{coords.x.toString().padStart(4, "0")} Y:
                {coords.y.toString().padStart(4, "0")}
              </div>
              <div className="absolute bottom-2 right-3 font-mono text-[10px] tracking-[0.2em] text-amber-300">
                6.0 BAR ● ARMED
              </div>
            </div>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-400 to-red-500"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.5, ease: "linear" }}
              />
            </div>
            <p className="mt-2 text-center font-mono text-[9px] tracking-[0.3em] text-slate-400">
              DIVERTING TO FIRE-SAFE SAND BIN
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
