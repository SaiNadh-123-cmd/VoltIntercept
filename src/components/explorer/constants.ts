export type ComponentId = "camera" | "thermal" | "aihub" | "kicker";

export type ComponentInfo = {
  id: ComponentId;
  tag: string;
  title: string;
  desc: string;
  accent: string;
};

export const COMPONENT_INFO: Record<ComponentId, ComponentInfo> = {
  camera: {
    id: "camera",
    tag: "NODE // OPTICAL",
    title: "RGB Vision Sensor",
    desc: "Captures 60fps video to run YOLOv8 object detection on fast-moving waste streams, identifying battery shapes.",
    accent: "#38bdf8",
  },
  thermal: {
    id: "thermal",
    tag: "NODE // INFRARED",
    title: "MLX90640 Thermal Sensor",
    desc: "Scans for infrared heat anomalies. Detects temperature spikes >60°C indicating imminent thermal runaway.",
    accent: "#ef4444",
  },
  aihub: {
    id: "aihub",
    tag: "NODE // COMPUTE",
    title: "Raspberry Pi Edge Processor",
    desc: "The brain. Fuses RGB and Thermal data in real-time to make millisecond ejection decisions without cloud latency.",
    accent: "#10b981",
  },
  kicker: {
    id: "kicker",
    tag: "NODE // ACTUATION",
    title: "High-Torque Actuator",
    desc: "Receives GPIO signals from the Edge Hub to physically intercept and eject hazardous batteries into a fire-safe bin.",
    accent: "#f59e0b",
  },
};

export const COMPONENT_ORDER: ComponentId[] = ["camera", "thermal", "aihub", "kicker"];
