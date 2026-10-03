import { GoogleGenerativeAI } from "@google/generative-ai";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  KeyRound,
  Loader2,
  ScanSearch,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Webcam from "react-webcam";
import { useMission } from "../context/MissionContext";
import { BATTERIES, type BatteryProfile } from "./simulator/batteries";

type DetectionResult = {
  detected: boolean;
  type: string;
  capacity: string;
  matchId: string;
  confidence: number;
};

type Source = "idle" | "webcam" | "upload";

const MATCH_KEYWORDS: Array<[string, string]> = [
  ["cr2032", "cr2032"],
  ["button", "cr2032"],
  ["coin", "cr2032"],
  ["vape", "vape-lipo"],
  ["18650", "18650-cell"],
  ["smartphone", "smartphone"],
  ["phone", "smartphone"],
  ["drone", "drone-lipo"],
  ["tablet", "tablet-pouch"],
  ["pouch", "tablet-pouch"],
  ["power tool", "power-tool"],
  ["tool", "power-tool"],
  ["ebike", "ebike-pack"],
  ["e-bike", "ebike-pack"],
  ["power station", "power-station"],
  ["station", "power-station"],
  ["ev", "ev-module"],
];

function buildPrompt(ids: string) {
  return `You are an industrial safety AI. Look at this image. Is there a battery present? If yes, classify the specific type (e.g., Button Cell, 18650, Smartphone, E-Bike). Estimate its mAh capacity. Finally, output a JSON object strictly in this format: { "detected": true/false, "type": "Battery Name", "capacity": "XXXX mAh", "matchId": "[match with one of the 10 IDs from our database: ${ids}]", "confidence": 95 }.`;
}

function parseDetection(raw: string): DetectionResult | null {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    return {
      detected: Boolean(parsed.detected),
      type: String(parsed.type ?? "Unknown"),
      capacity: String(parsed.capacity ?? "—"),
      matchId: String(parsed.matchId ?? ""),
      confidence: Number(parsed.confidence ?? 0),
    };
  } catch {
    return null;
  }
}

function resolveProfile(matchId: string): BatteryProfile | null {
  const normalized = matchId.trim().toLowerCase();
  if (!normalized) return null;
  const exact = BATTERIES.find((b) => b.id === normalized);
  if (exact) return exact;
  const partial = BATTERIES.find(
    (b) => normalized.includes(b.id) || b.id.includes(normalized),
  );
  if (partial) return partial;
  for (const [keyword, id] of MATCH_KEYWORDS) {
    if (normalized.includes(keyword)) {
      const found = BATTERIES.find((b) => b.id === id);
      if (found) return found;
    }
  }
  return null;
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

export function VisionScanner() {
  const { setAlertMode, recordInterception, ejectFlash } = useMission();
  const [apiKey, setApiKey] = useState(
    () => import.meta.env.VITE_GEMINI_API_KEY ?? "",
  );
  const [source, setSource] = useState<Source>("idle");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [matchedProfile, setMatchedProfile] = useState<BatteryProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [nextItem, setNextItem] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const webcamRef = useRef<Webcam>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const prevFlash = useRef(ejectFlash);

  const ids = useMemo(() => BATTERIES.map((b) => b.id).join(", "), []);

  useEffect(() => {
    if (prevFlash.current && !ejectFlash) {
      setNextItem(true);
      const timer = window.setTimeout(() => setNextItem(false), 1400);
      prevFlash.current = ejectFlash;
      return () => window.clearTimeout(timer);
    }
    prevFlash.current = ejectFlash;
  }, [ejectFlash]);

  const runGemini = useCallback(
    async (dataUrl: string) => {
      const key = apiKey.trim();
      if (!key) {
        setError("Paste a Gemini API key first.");
        return;
      }
      setScanning(true);
      setError(null);
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                { text: buildPrompt(ids) },
                {
                  inlineData: { mimeType: "image/jpeg", data: base64 },
                },
              ],
            },
          ],
        });
        const text = result.response.text();
        const parsed = parseDetection(text);
        if (!parsed) {
          setError("AI response could not be parsed as JSON.");
          return;
        }
        setDetection(parsed);
        if (parsed.detected) {
          const profile = resolveProfile(parsed.matchId);
          setMatchedProfile(profile);
          setFlash(true);
          setAlertMode(true);
          if (profile) recordInterception(profile, parsed.confidence);
          window.setTimeout(() => {
            setFlash(false);
            setAlertMode(false);
          }, 2200);
        } else {
          setMatchedProfile(null);
        }
        setScanCount((c) => c + 1);
      } catch (err) {
        console.error(err);
        setError("Gemini request failed. Check the API key and network.");
      } finally {
        setScanning(false);
      }
    },
    [apiKey, ids, recordInterception, setAlertMode],
  );

  const captureFrame = (): string | null => {
    if (source === "webcam" && webcamRef.current) {
      return webcamRef.current.getScreenshot();
    }
    if (source === "upload") {
      return imageSrc;
    }
    return null;
  };

  const onScan = () => {
    const frame = captureFrame();
    if (!frame) {
      setError("Start the device camera or upload an image first.");
      return;
    }
    void runGemini(frame);
  };

  const enableCamera = () => {
    setSource("webcam");
    setImageSrc(null);
    setDetection(null);
    setMatchedProfile(null);
  };

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(String(reader.result));
      setSource("upload");
      setDetection(null);
      setMatchedProfile(null);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black">
        {source === "webcam" ? (
          <Webcam
            ref={webcamRef}
            mirrored
            screenshotFormat="image/jpeg"
            screenshotQuality={0.85}
            videoConstraints={{
              width: 1280,
              height: 720,
              facingMode: "environment",
            }}
            className="absolute inset-0 h-full w-full object-cover"
            onUserMediaError={() => {
              setError("Camera access denied.");
              setSource("idle");
            }}
          />
        ) : source === "upload" && imageSrc ? (
          <img
            src={imageSrc}
            alt="Uploaded sample"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="thermal-sample absolute inset-0">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12">
              <div className="relative h-28 w-14 rounded-md border border-yellow-200/40 bg-gradient-to-b from-yellow-100/20 via-orange-400/25 to-red-600/30 shadow-[0_0_30px_rgba(245,158,11,0.35)]">
                <div className="absolute -top-2 left-1/2 h-2 w-5 -translate-x-1/2 rounded-t-sm bg-slate-200/70" />
                <div className="absolute inset-x-2 top-3 space-y-1.5">
                  <div className="h-1 rounded-full bg-cyan-300/70" />
                  <div className="h-1 rounded-full bg-cyan-300/50" />
                  <div className="h-1 rounded-full bg-amber-300/60" />
                  <div className="h-1 rounded-full bg-red-400/70" />
                </div>
                <div className="absolute inset-x-0 bottom-1.5 text-center font-mono text-[7px] tracking-[0.2em] text-red-200/90">
                  Li-ION // 18650
                </div>
              </div>
            </div>
            <p className="absolute inset-x-0 bottom-4 text-center font-mono text-[10px] tracking-[0.3em] text-cyan-200/70">
              DEFAULT SAMPLE // STANDBY
            </p>
          </div>
        )}

        <div className="scan-laser" />
        <CornerBrackets />

        <AnimatePresence>
          {flash && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 border-2 border-red-500 shadow-[inset_0_0_60px_rgba(239,68,68,0.55)]"
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {scanning && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-x-0 top-3 flex justify-center"
            >
              <div className="glass-panel flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-[10px] tracking-[0.25em] text-cyan-200">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                GEMINI AI SCANNING FRAME
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {detection?.detected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-none absolute left-[7%] top-[10%] w-[64%] rounded-xl border border-red-400/70 bg-slate-950/70 p-3 backdrop-blur-md shadow-[0_0_30px_rgba(239,68,68,0.5)]"
            >
              <p className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.25em] text-red-300">
                <AlertTriangle className="h-3 w-3" />
                CRITICAL HAZARD DETECTED
              </p>
              <p className="mt-1 text-sm font-bold text-white">
                {detection.type}
              </p>
              <p className="font-mono text-[10px] text-cyan-200">
                {detection.capacity}
              </p>
              <p className="mt-1 font-mono text-[9px] tracking-wide text-slate-400">
                MATCH: {detection.matchId.toUpperCase()} · CONF{" "}
                {Math.round(detection.confidence)}%
              </p>
              {matchedProfile && (
                <p className="mt-1 font-mono text-[10px] font-bold text-emerald-300">
                  {matchedProfile.financialDamage} INTERCEPTED
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {nextItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-x-0 top-3 text-center font-mono text-[10px] tracking-[0.3em] text-cyan-200/80"
            >
              SCANNING NEXT ITEM...
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {ejectFlash && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center bg-emerald-500/10"
            >
              <div className="glass-panel flex items-center gap-3 rounded-2xl border border-emerald-400/70 px-6 py-4 shadow-[0_0_40px_rgba(16,185,129,0.6)]">
                <CheckCircle2 className="h-6 w-6 text-emerald-300" />
                <div>
                  <p className="font-mono text-sm font-bold tracking-[0.25em] text-emerald-200">
                    HAZARD EJECTED
                  </p>
                  <p className="font-mono text-[9px] tracking-[0.2em] text-emerald-200/70">
                    DIVERTED TO FIRE-SAFE BIN
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={enableCamera}
          className={`flex items-center gap-2 rounded-full border px-3 py-2 font-mono text-[10px] tracking-wider transition ${
            source === "webcam"
              ? "border-cyan-300 bg-cyan-400/20 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.45)]"
              : "border-white/15 text-slate-300 hover:border-cyan-300/50"
          }`}
        >
          <Camera className="h-3.5 w-3.5" />
          DEVICE CAMERA
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => fileRef.current?.click()}
          className={`flex items-center gap-2 rounded-full border px-3 py-2 font-mono text-[10px] tracking-wider transition ${
            source === "upload"
              ? "border-emerald-300 bg-emerald-400/15 text-emerald-100 shadow-[0_0_18px_rgba(16,185,129,0.4)]"
              : "border-white/15 text-slate-300 hover:border-emerald-300/50"
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          UPLOAD IMAGE
        </motion.button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onFile}
          className="hidden"
        />

        <div className="relative min-w-[150px] flex-1">
          <KeyRound className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="Paste Gemini API key"
            className="w-full rounded-full border border-white/15 bg-black/50 py-2 pl-9 pr-3 font-mono text-[11px] text-slate-200 placeholder:text-slate-500 focus:border-cyan-300/60 focus:outline-none"
          />
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onScan}
          disabled={scanning}
          className="glow-btn flex items-center gap-2 rounded-full border border-cyan-300/60 bg-cyan-400/15 px-5 py-2 font-mono text-[11px] tracking-[0.2em] text-cyan-100 transition disabled:opacity-50"
        >
          {scanning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ScanSearch className="h-4 w-4" />
          )}
          {scanning ? "SCANNING..." : "SCAN LIVE VIDEO STREAM"}
        </motion.button>
      </div>

      <div className="min-h-[18px] font-mono text-[10px] tracking-[0.15em]">
        {error ? (
          <span className="text-red-400">{error}</span>
        ) : detection ? (
          detection.detected ? (
            <span className="flex items-center gap-1.5 text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              AI INTERCEPTION COMPLETE — THREAT CLASSIFIED &amp; LOGGED
            </span>
          ) : (
            <span className="text-slate-400">
              NO BATTERY DETECTED — STREAM CLEAR
            </span>
          )
        ) : (
          <span className="text-slate-500">
            SYSTEM READY — {scanCount} SCANS LOGGED
          </span>
        )}
      </div>
    </div>
  );
}
