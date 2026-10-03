import { AnimatePresence, motion } from "framer-motion";
import { Camera, Crosshair, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMission } from "../context/MissionContext";

export function VisionPanel() {
  const { visionMode, setVisionMode, mediaReady, setMediaReady, setAlertMode, alertMode } = useMission();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [cross, setCross] = useState({ x: 50, y: 50 });

  useEffect(() => {
    setMediaReady(true);
  }, [setMediaReady]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const enableCamera = async () => {
    stopCamera();
    setObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setVisionMode("camera");
    setMediaReady(false);
    setLocked(false);
    setAlertMode(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setMediaReady(true);
    } catch {
      setVisionMode("idle");
    }
  };

  const onUpload = (file: File) => {
    stopCamera();
    setObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setVisionMode("upload");
    setMediaReady(true);
    setLocked(false);
    setAlertMode(false);
  };

  useEffect(() => {
    if (!mediaReady) return;
    const lock = window.setTimeout(() => {
      setLocked(true);
      setAlertMode(true);
    }, 900);
    return () => window.clearTimeout(lock);
  }, [mediaReady, setAlertMode]);

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
          <p className="font-mono text-[10px] tracking-[0.4em] text-cyan-300/70">NODE 01</p>
          <h2 className="text-lg font-semibold tracking-widest text-white">VISION CENTER</h2>
        </div>
        <div className="flex gap-2">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            onClick={() => void enableCamera()}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] tracking-wider transition ${
              visionMode === "camera"
                ? "border-cyan-300 bg-cyan-400/20 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.45)]"
                : "border-white/15 text-slate-300 hover:border-cyan-300/50"
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            USE DEVICE CAMERA
          </motion.button>
          <label>
            <motion.span
              whileHover={{ scale: 1.05 }}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] tracking-wider transition ${
                visionMode === "upload"
                  ? "border-emerald-300 bg-emerald-400/15 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                  : "border-white/15 text-slate-300 hover:border-emerald-300/50"
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              UPLOAD SAMPLE
            </motion.span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUpload(file);
              }}
            />
          </label>
        </div>
      </div>

      <div
        className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setCross({
            x: ((event.clientX - rect.left) / rect.width) * 100,
            y: ((event.clientY - rect.top) / rect.height) * 100,
          });
        }}
      >
        {visionMode === "camera" && (
          <video ref={videoRef} muted playsInline className="absolute inset-0 h-full w-full object-cover" />
        )}
        {visionMode === "upload" && objectUrl && (
          <img src={objectUrl} alt="Uploaded thermal sample" className="absolute inset-0 h-full w-full object-cover" />
        )}
        {visionMode === "idle" && (
          <div className="thermal-sample absolute inset-0">
            <div className="absolute inset-0 opacity-40 mix-blend-screen">
              <div className="absolute left-[48%] top-[42%] h-24 w-12 -rotate-12 rounded-sm bg-gradient-to-b from-yellow-200 via-orange-500 to-red-700 blur-[1px]" />
            </div>
            <p className="absolute inset-x-0 bottom-4 text-center font-mono text-[10px] tracking-[0.3em] text-cyan-200/70">
              {locked ? "OPTICAL LOCK ENGAGED" : "AWAITING OPTICAL INPUT"}
            </p>
          </div>
        )}

        <div className="scan-laser" />
        <CornerBrackets />
        <div
          className="pointer-events-none absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${cross.x}%`, top: `${cross.y}%` }}
        >
          <Crosshair className="h-8 w-8 text-cyan-200 drop-shadow-[0_0_8px_#22d3ee]" />
        </div>

        <AnimatePresence>
          {locked && (
            <motion.div
              initial={{ opacity: 0, scale: 1.2 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute left-[38%] top-[34%] h-[32%] w-[24%] border-2 border-red-500 shadow-[0_0_24px_rgba(239,68,68,0.7)]"
            >
              <div className="absolute -top-8 left-0 whitespace-nowrap bg-red-600/90 px-2 py-1 font-mono text-[10px] tracking-wider text-white">
                HAZARD DETECTED: Li-Ion Cell
              </div>
              <div className="absolute -bottom-7 left-0 font-mono text-[10px] tracking-wide text-red-300">
                Thermal Profile: Critical
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {alertMode && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-red-600/10 via-transparent to-red-700/20" />
        )}
      </div>
    </motion.section>
  );
}

function CornerBrackets() {
  const arm = "absolute h-7 w-7 border-cyan-300";
  return (
    <div className="corner-brackets absolute inset-3">
      <span className={`${arm} left-0 top-0 border-l-2 border-t-2`} />
      <span className={`${arm} right-0 top-0 border-r-2 border-t-2`} />
      <span className={`${arm} bottom-0 left-0 border-b-2 border-l-2`} />
      <span className={`${arm} bottom-0 right-0 border-b-2 border-r-2`} />
    </div>
  );
}
