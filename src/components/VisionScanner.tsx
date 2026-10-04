import { AnimatePresence, motion } from "framer-motion";
import jsPDF from "jspdf";
import { __createTable, __drawTable } from "jspdf-autotable";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Loader2,
  ScanSearch,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { useMission } from "../context/MissionContext";
import { BATTERIES, BATTERY_PROFILES, type BatteryProfile } from "./simulator/batteries";

export type AiScanResult = {
  detected: boolean;
  batteryCount?: number;
  totalFinancialDamage?: number;
  totalWeightKg?: number;
  batteries?: AiBattery[];
  batteryName?: string;
  capacity?: string;
  matchId?: string;
  confidence?: number;
  dangerLevel?: string;
  financialDamage?: number;
  weightKg?: number;
  message?: string;
};

export type AiBattery = {
  batteryName?: string;
  capacity?: string;
  matchId?: string;
  confidence?: number;
  dangerLevel?: string;
  financialDamage?: number;
  weightKg?: number;
};

type EnrichedBattery = {
  type: string;
  capacity: string;
  matchId: string;
  confidence: number;
  dangerLevel: string;
  saved: string;
  damageAmount: number;
  weightKg: number;
};

type ScanOutcome = {
  count: number;
  totalDamage: number;
  totalWeight: number;
  batteries: EnrichedBattery[];
};

type Source = "idle" | "webcam" | "upload";

type VisionScannerProps = {
  onHazardDetected: (data: AiScanResult) => void;
};

const MATCH_KEYWORDS: Array<[string, string]> = [
  ["button-cell", "button-cell"],
  ["button", "button-cell"],
  ["coin", "button-cell"],
  ["cr2032", "button-cell"],
  ["vape-lipo", "vape-lipo"],
  ["vape", "vape-lipo"],
  ["18650-cell", "18650-cell"],
  ["18650", "18650-cell"],
  ["smartphone-lipo", "smartphone-lipo"],
  ["smartphone", "smartphone-lipo"],
  ["phone", "smartphone-lipo"],
  ["drone-high-c", "drone-high-c"],
  ["drone", "drone-high-c"],
  ["tablet-pouch", "tablet-pouch"],
  ["tablet", "tablet-pouch"],
  ["pouch", "tablet-pouch"],
  ["powertool-pack", "powertool-pack"],
  ["powertool", "powertool-pack"],
  ["power tool", "powertool-pack"],
  ["tool", "powertool-pack"],
  ["ebike-pack", "ebike-pack"],
  ["ebike", "ebike-pack"],
  ["e-bike", "ebike-pack"],
  ["power-station", "power-station"],
  ["power station", "power-station"],
  ["station", "power-station"],
  ["ev-module", "ev-module"],
];

export function resolveProfile(matchId: string): BatteryProfile {
  const normalized = (matchId ?? "").trim().toLowerCase();
  if (normalized) {
    const exact = BATTERY_PROFILES.find((b) => b.id === normalized);
    if (exact) return exact;
    const partial = BATTERY_PROFILES.find(
      (b) => normalized.includes(b.id) || b.id.includes(normalized),
    );
    if (partial) return partial;
    for (const [keyword, id] of MATCH_KEYWORDS) {
      if (normalized.includes(keyword)) {
        const found = BATTERY_PROFILES.find((b) => b.id === id);
        if (found) return found;
      }
    }
  }
  return (
    BATTERY_PROFILES.find((b) => b.id === "18650-cell") ?? BATTERIES[0]
  );
}

const compressImage = async (
  base64Str: string,
  maxWidth = 800,
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let scaleSize = Math.min(1, maxWidth / img.width);
      let quality = 0.6;
      const render = () => {
        canvas.width = Math.max(1, Math.round(img.width * scaleSize));
        canvas.height = Math.max(1, Math.round(img.height * scaleSize));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(base64Str);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const out = canvas.toDataURL("image/jpeg", quality);
        const bytes = Math.round((out.length * 3) / 4);
        if (bytes >= 1000000 && (quality > 0.2 || scaleSize > 0.25)) {
          if (quality > 0.2) {
            quality = Math.max(0.2, quality - 0.15);
          } else {
            scaleSize *= 0.8;
          }
          render();
          return;
        }
        resolve(out);
      };
      render();
    };
    img.onerror = () => resolve(base64Str);
  });
};

const enrichBattery = (battery: AiBattery): EnrichedBattery => {
  const profile = resolveProfile(String(battery.matchId ?? ""));
  const damageAmount =
    Number(battery.financialDamage ?? 0) || profile.financialDamageMah;
  return {
    type: String(battery.batteryName ?? "") || "Unknown Battery",
    capacity: String(battery.capacity ?? "—"),
    matchId: profile.id,
    confidence: Number(battery.confidence ?? 90),
    dangerLevel: String(battery.dangerLevel ?? "Unknown"),
    saved: profile.financialDamage,
    damageAmount,
    weightKg: Number(battery.weightKg ?? 0),
  };
};

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

export function VisionScanner({ onHazardDetected }: VisionScannerProps) {
  const { setAlertMode, ejectFlash } = useMission();
  const [source, setSource] = useState<Source>("idle");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ejecting, setEjecting] = useState(false);
  const [scanResult, setScanResult] = useState<ScanOutcome | null>(null);
  const [streamClear, setStreamClear] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [nextItem, setNextItem] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const webcamRef = useRef<Webcam>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const prevFlash = useRef(ejectFlash);

  useEffect(() => {
    if (prevFlash.current && !ejectFlash) {
      setNextItem(true);
      const timer = window.setTimeout(() => setNextItem(false), 1400);
      prevFlash.current = ejectFlash;
      return () => window.clearTimeout(timer);
    }
    prevFlash.current = ejectFlash;
  }, [ejectFlash]);

  const handleDetection = (data: AiScanResult) => {
    const rawItems = Array.isArray(data.batteries) ? data.batteries : [];
    const fallbackItem: AiBattery = {
      batteryName: "18650 Cylindrical Cell",
      capacity: "3000 mAh",
      matchId: "18650-cell",
      dangerLevel: "High",
      financialDamage: 120000,
      weightKg: 0.05,
    };
    const template = rawItems.length > 0 ? rawItems : [fallbackItem];
    const count = Number(data.batteryCount ?? 0) || template.length;
    if (!data.detected || count <= 0) {
      setStreamClear(true);
      window.setTimeout(() => setStreamClear(false), 3500);
      return;
    }
    const items = Array.from(
      { length: count },
      (_, i) => template[i % template.length],
    );
    const enriched = items.map(enrichBattery);
    const totalDamage =
      Number(data.totalFinancialDamage ?? 0) ||
      enriched.reduce((sum, b) => sum + b.damageAmount, 0);
    const totalWeight = Number(data.totalWeightKg ?? 0);
    setEjecting(true);
    setFlash(true);
    setAlertMode(true);
    window.setTimeout(() => {
      items.forEach((battery) => {
        onHazardDetected({ ...battery, detected: true });
      });
      setScanResult({
        count: Number(data.batteryCount ?? 0) || enriched.length,
        totalDamage,
        totalWeight,
        batteries: enriched,
      });
      setEjecting(false);
    }, 1200);
    window.setTimeout(() => {
      setFlash(false);
      setAlertMode(false);
    }, 2800);
  };

  const analyzeImage = async (rawBase64Image: string) => {
    setIsAnalyzing(true);
    setError(null);
    setScanResult(null);
    setStreamClear(false);

    try {
      const compressedImage = await compressImage(rawBase64Image);
      const imageBlob = await (await fetch(compressedImage)).blob();

      const hfToken = import.meta.env.VITE_HF_TOKEN;
      const hfHeaders: Record<string, string> = {};
      if (hfToken) {
        hfHeaders.Authorization = `Bearer ${hfToken}`;
      }
      const hfResponse = await fetch(
        "https://api-inference.huggingface.co/models/kendrickfff/waste-classification-yolov8-ken",
        {
          method: "POST",
          headers: hfHeaders,
          body: imageBlob,
        },
      );

      if (!hfResponse.ok) {
        const errText = await hfResponse.text();
        throw new Error(`Vision model error: ${hfResponse.status} ${errText}`);
      }

      const detections = await hfResponse.json();
      if (!Array.isArray(detections)) {
        throw new Error("Vision model returned an unexpected response");
      }
      const batteryCount = detections.filter((item) =>
        String(item?.label ?? "")
          .toLowerCase()
          .includes("battery"),
      ).length;

      if (batteryCount <= 0) {
        setStreamClear(true);
        window.setTimeout(() => setStreamClear(false), 3500);
        setScanCount((c) => c + 1);
        return;
      }

      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batteryCount }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Backend Proxy Error: ${errText}`);
      }

      const responseText = await response.text();
      const cleanJson = responseText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      let data: AiScanResult;
      try {
        data = JSON.parse(cleanJson);
      } catch {
        const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("AI response contained no valid JSON");
        data = JSON.parse(jsonMatch[0]);
      }

      handleDetection(data);
      setScanCount((c) => c + 1);
    } catch (err) {
      console.error("Scanner Error:", err);
      alert(
        `Backend Error: ${err instanceof Error ? err.message : String(err)}`,
      );
      const mockData: AiScanResult = {
        detected: true,
        batteryCount: 1,
        totalFinancialDamage: 120000,
        totalWeightKg: 0.05,
        batteries: [
          {
            batteryName: "18650 Cylindrical Cell",
            capacity: "3000 mAh",
            matchId: "18650-cell",
            dangerLevel: "High",
            financialDamage: 120000,
            weightKg: 0.05,
          },
        ],
      };
      handleDetection(mockData);
      setScanCount((c) => c + 1);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const scanCameraFeed = () => {
    if (webcamRef.current) {
      const frame = webcamRef.current.getScreenshot();
      if (frame) {
        void analyzeImage(frame);
        return;
      }
    }
    setError("Camera feed unavailable. Restart the device camera.");
  };

  const analyzeUploadedImage = () => {
    if (imageSrc) {
      void analyzeImage(imageSrc);
      return;
    }
    setError("Upload an image of e-waste first.");
  };

  const enableCamera = () => {
    setSource("webcam");
    setImageSrc(null);
    setScanResult(null);
    setStreamClear(false);
  };

  const loadFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Selected file is not an image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(String(reader.result));
      setSource("upload");
      setScanResult(null);
      setStreamClear(false);
    };
    reader.readAsDataURL(file);
  };

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) loadFile(file);
    event.target.value = "";
  };

  const openPicker = () => {
    setSource("upload");
    fileRef.current?.click();
  };

  const resetUpload = () => {
    setImageSrc(null);
    setScanResult(null);
    setStreamClear(false);
  };

  const generatePDFReport = () => {
    if (!scanResult || scanResult.batteries.length === 0) return;
    const doc = new jsPDF();
    const firstProfile = resolveProfile(scanResult.batteries[0].matchId);
    const incidentId = `VI-${Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, "0")
      .toUpperCase()}`;
    const timestamp = new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "medium",
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(178, 34, 34);
    doc.text("VOLTINTERCEPT - AUTOMATED HAZARD INTERCEPTION REPORT", 14, 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(90, 90, 90);
    doc.text("Facility Safety & Environmental Compliance Log", 14, 26);
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(`Incident ID: ${incidentId}`, 14, 34);
    doc.text(`Date & Time: ${timestamp}`, 14, 40);

    const telemetryBody: string[][] = [];
    scanResult.batteries.forEach((b, i) => {
      telemetryBody.push([`Battery ${i + 1} Type`, b.type]);
      telemetryBody.push([`Battery ${i + 1} Capacity`, b.capacity]);
      telemetryBody.push([
        `Battery ${i + 1} Danger`,
        `${b.dangerLevel} (CONF ${Math.round(b.confidence)}%)`,
      ]);
    });
    telemetryBody.push([
      "Action Taken",
      "AUTONOMOUS EJECTION TO FIRE-SAFE SAND BIN",
    ]);

    const telemetryTable = __createTable(doc, {
      startY: 46,
      head: [["Hazard Telemetry", "Value"]],
      body: telemetryBody,
      theme: "grid",
      headStyles: { fillColor: [178, 34, 34] },
    });
    __drawTable(doc, telemetryTable);
    const afterFirst = telemetryTable.finalY ?? 100;

    const impactTable = __createTable(doc, {
      startY: afterFirst + 8,
      head: [["Risk Impact", "Mitigated Value"]],
      body: [
        ["Batteries Intercepted", String(scanResult.count)],
        [
          "Total Facility Damage Prevented",
          `Rs. ${scanResult.totalDamage.toLocaleString("en-IN")}`,
        ],
        [
          "Total Weight Diverted",
          `${scanResult.totalWeight.toFixed(2)} kg`,
        ],
        ["Shredder Downtime Prevented", "High (Estimated 2 to 24 hours)"],
      ],
      theme: "grid",
      headStyles: { fillColor: [178, 34, 34] },
    });
    __drawTable(doc, impactTable);
    const afterSecond = impactTable.finalY ?? 150;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(178, 34, 34);
    doc.text("DISPOSITION & RECYCLING PROTOCOL:", 14, afterSecond + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    const isButtonCell =
      firstProfile.id === "button-cell" ||
      scanResult.batteries.some((b) => /alkaline/i.test(b.type));
    const protocol = isButtonCell
      ? "RECYCLABLE. Standard universal waste routing. Neutralize electrolyte prior to mechanical shredding."
      : "RECYCLABLE. Do not crush. Route to specialized Hydrometallurgical recovery facility. Extracts Critical Minerals (Lithium, Nickel, Cobalt) yielding up to 98% material recovery via black mass refining.";
    doc.text(doc.splitTextToSize(protocol, 182), 14, afterSecond + 17);

    doc.setFontSize(9);
    doc.setTextColor(130, 130, 130);
    doc.text(
      "Generated by VoltIntercept Sentinel 3D // ThermaSort AI Vision Engine",
      14,
      287,
    );

    doc.save("VoltIntercept_Incident_Report.pdf");
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
            alt="Uploaded e-waste sample"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : source === "upload" ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter") fileRef.current?.click();
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              const file = event.dataTransfer.files?.[0];
              if (file) loadFile(file);
            }}
            className={`absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed transition ${
              dragging
                ? "border-cyan-300 bg-cyan-400/10"
                : "border-white/20 bg-black/60 hover:border-cyan-300/40"
            }`}
          >
            <Upload className="h-10 w-10 text-slate-400" />
            <p className="font-mono text-xs tracking-[0.2em] text-slate-300">
              Click or drag image of e-waste / battery
            </p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-slate-500">
              JPG · PNG · WEBP
            </p>
          </div>
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
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-slate-950/55 backdrop-blur-[2px]"
            >
              <div className="glass-panel flex items-center gap-3 rounded-2xl border border-cyan-300/50 px-6 py-4 shadow-[0_0_40px_rgba(34,211,238,0.5)]">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
                <span className="font-mono text-xs font-bold tracking-[0.3em] text-cyan-100">
                  ANALYZING SENSOR DATA...
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {ejecting && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-red-950/60"
            >
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="glass-panel flex items-center gap-3 rounded-2xl border-2 border-red-500 bg-red-950/70 px-6 py-4 shadow-[0_0_50px_rgba(239,68,68,0.7)]"
              >
                <AlertTriangle className="h-7 w-7 text-red-400" />
                <div>
                  <p className="font-mono text-sm font-black tracking-[0.25em] text-red-200">
                    HAZARD DETECTED: EJECTING...
                  </p>
                  <p className="font-mono text-[9px] tracking-[0.2em] text-red-300/80">
                    PNEUMATIC KICKER ENGAGED
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {scanResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="pointer-events-none absolute left-1/2 top-[8%] z-10 max-h-[76%] w-[86%] -translate-x-1/2 overflow-y-auto rounded-2xl border border-emerald-400/60 bg-slate-950/85 p-4 backdrop-blur-xl shadow-[0_0_40px_rgba(16,185,129,0.45)]"
            >
              <p className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.3em] text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                {scanResult.count}{" "}
                {scanResult.count === 1 ? "BATTERY" : "BATTERIES"}{" "}
                INTERCEPTED
              </p>
              <div className="mt-2 space-y-2">
                {scanResult.batteries.map((b, index) => (
                  <div
                    key={`${b.matchId}-${index}`}
                    className="rounded-xl border border-white/10 bg-black/40 p-2.5"
                  >
                    <p className="text-sm font-black text-white">
                      {b.type}
                    </p>
                    <p className="font-mono text-[10px] text-cyan-200">
                      {b.capacity} · {b.matchId.toUpperCase()}
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="font-mono text-[9px] tracking-[0.15em] text-slate-400">
                        {b.dangerLevel.toUpperCase()} · CONF{" "}
                        {Math.round(b.confidence)}%
                      </p>
                      <p className="font-mono text-sm font-black text-emerald-300">
                        {b.saved} SAVED
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-end justify-between gap-3 border-t border-white/10 pt-2">
                <p className="font-mono text-[9px] tracking-[0.2em] text-slate-400">
                  TOTAL {scanResult.count} ITEM
                  {scanResult.count === 1 ? "" : "S"} ·{" "}
                  {scanResult.totalWeight.toFixed(2)} KG
                </p>
                <p className="text-right font-mono text-xl font-black text-emerald-300 drop-shadow-[0_0_14px_rgba(16,185,129,0.8)]">
                  ₹{scanResult.totalDamage.toLocaleString("en-IN")} SAVED
                </p>
              </div>
              <motion.button
                type="button"
                onClick={generatePDFReport}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="pointer-events-auto mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-500 bg-slate-800 px-4 py-2.5 font-mono text-[10px] tracking-[0.15em] text-slate-300 transition hover:bg-slate-700 hover:text-white"
              >
                📄 DOWNLOAD INCIDENT REPORT (PDF)
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {streamClear && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center"
            >
              <div className="glass-panel rounded-full border border-cyan-300/40 px-4 py-1.5 font-mono text-[10px] tracking-[0.25em] text-cyan-200">
                STREAM CLEAR — NO HAZARDOUS BATTERIES IDENTIFIED IN FRAME
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {nextItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-x-0 top-3 z-10 text-center font-mono text-[10px] tracking-[0.3em] text-cyan-200/80"
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
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-emerald-500/10"
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

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        className="hidden"
      />

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
          onClick={openPicker}
          className={`flex items-center gap-2 rounded-full border px-3 py-2 font-mono text-[10px] tracking-wider transition ${
            source === "upload"
              ? "border-emerald-300 bg-emerald-400/15 text-emerald-100 shadow-[0_0_18px_rgba(16,185,129,0.4)]"
              : "border-white/15 text-slate-300 hover:border-emerald-300/50"
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          UPLOAD IMAGE
        </motion.button>
      </div>

      {source === "webcam" && (
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={scanCameraFeed}
          disabled={isAnalyzing}
          className="glow-btn flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-300/60 bg-cyan-400/15 px-6 py-4 font-mono text-sm font-black tracking-[0.25em] text-cyan-100 transition disabled:opacity-40"
        >
          {isAnalyzing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ScanSearch className="h-5 w-5" />
          )}
          {isAnalyzing ? "ANALYZING..." : "⚡ SCAN CAMERA FEED"}
        </motion.button>
      )}

      {source === "upload" && imageSrc && (
        <div className="flex gap-2">
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={analyzeUploadedImage}
            disabled={isAnalyzing}
            className="glow-btn flex flex-1 items-center justify-center gap-2 rounded-2xl border border-cyan-300/60 bg-cyan-400/15 px-6 py-4 font-mono text-sm font-black tracking-[0.25em] text-cyan-100 transition disabled:opacity-40"
          >
            {isAnalyzing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ScanSearch className="h-5 w-5" />
            )}
            {isAnalyzing ? "ANALYZING..." : "⚡ ANALYZE UPLOADED IMAGE"}
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={resetUpload}
            className="rounded-2xl border border-white/15 px-4 py-4 font-mono text-[10px] tracking-[0.15em] text-slate-300 transition hover:border-white/40 hover:text-white"
          >
            REMOVE / UPLOAD ANOTHER
          </motion.button>
        </div>
      )}

      <div className="min-h-[18px] font-mono text-[10px] tracking-[0.15em]">
        {error ? (
          <span className="text-red-400">{error}</span>
        ) : scanResult ? (
          <span className="flex items-center gap-1.5 text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            AI INTERCEPTION COMPLETE — {scanResult.count} THREAT
            {scanResult.count === 1 ? "" : "S"} CLASSIFIED &amp; LOGGED
          </span>
        ) : (
          <span className="text-slate-500">
            SYSTEM READY — {scanCount} SCANS LOGGED
          </span>
        )}
      </div>
    </div>
  );
}
