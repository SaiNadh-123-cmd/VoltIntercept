export type BatteryShape =
  | "coin"
  | "vape"
  | "cell"
  | "phone"
  | "drone"
  | "tablet"
  | "tool"
  | "ebike"
  | "station"
  | "ev";

export type BatteryProfile = {
  id: string;
  name: string;
  capacity: string;
  capacityMah: number;
  shredderImpact: string;
  financialDamage: string;
  scale: number;
  shape: BatteryShape;
  color: string;
  prevention: string;
};

export const BATTERIES: BatteryProfile[] = [
  {
    id: "cr2032",
    name: "Button Cell (CR2032 Li-ion)",
    capacity: "220 mAh",
    capacityMah: 220,
    shredderImpact: "Small sparks, localized ignition.",
    financialDamage: "₹1,50,000",
    scale: 1,
    shape: "coin",
    color: "#9fb0c7",
    prevention:
      "The RGB sensor locks the coin's reflective rim geometry at 60fps while the MLX90640 catches micro heat bleed from a damaged cell. The pneumatic kicker ejects it before the crusher jaw ever closes.",
  },
  {
    id: "vape",
    name: "Disposable Vape LiPo",
    capacity: "400 mAh",
    capacityMah: 400,
    shredderImpact: "Toxic smoke, sudden flame jet.",
    financialDamage: "₹2,50,000",
    scale: 2,
    shape: "vape",
    color: "#3b4a63",
    prevention:
      "Pouch geometry is flagged by YOLOv8 contour analysis on the RGB stream, and the thermal array picks up the sudden temperature spike of a venting LiPo. Ejected 40ms before crush contact.",
  },
  {
    id: "18650",
    name: "18650 Cell (Flashlights/Vapes)",
    capacity: "3,000 mAh",
    capacityMah: 3000,
    shredderImpact: "Rocket-like venting, sharp explosion.",
    financialDamage: "₹4,25,000",
    scale: 3,
    shape: "cell",
    color: "#46586e",
    prevention:
      "The cylindrical steel profile is matched against the hazard library in real-time. Any IR spike above 60°C from a punctured cell triggers instant pneumatic ejection off the conveyor.",
  },
  {
    id: "phone",
    name: "Smartphone Battery",
    capacity: "4,000 mAh",
    capacityMah: 4000,
    shredderImpact: "Intense sustained fire, rapid thermal runaway.",
    financialDamage: "₹7,50,000",
    scale: 4,
    shape: "phone",
    color: "#232b36",
    prevention:
      "The flat slab silhouette with camera cutout is isolated on the RGB feed, while thermal runaway's rapid heat bloom is detected up to 2 seconds before crusher impact.",
  },
  {
    id: "drone",
    name: "Drone High-C LiPo",
    capacity: "5,000 mAh",
    capacityMah: 5000,
    shredderImpact: "Violent instantaneous fireball due to high discharge rate.",
    financialDamage: "₹14,00,000",
    scale: 5,
    shape: "drone",
    color: "#2a2f38",
    prevention:
      "High-discharge packs run warm even when healthy, so the thermal array baselines their surface heat and ejects any pack exceeding safe thresholds mid-conveyor.",
  },
  {
    id: "tablet",
    name: "Tablet Pouch Cell",
    capacity: "8,000 mAh",
    capacityMah: 8000,
    shredderImpact: "Massive swelling, bursts into heavy toxic smoke and flames.",
    financialDamage: "₹28,00,000",
    scale: 6,
    shape: "tablet",
    color: "#3a4150",
    prevention:
      "Swelling distorts the pouch silhouette in the RGB frame long before rupture. Dual-sensor fusion classifies the distortion and ejects the item to the fire-safe bin.",
  },
  {
    id: "tool",
    name: "Power Tool Pack (20V)",
    capacity: "9,000 mAh",
    capacityMah: 9000,
    shredderImpact: "Multi-cell chain reaction, plastic shrapnel.",
    financialDamage: "₹52,00,000",
    scale: 7,
    shape: "tool",
    color: "#4a4231",
    prevention:
      "Multi-cell packs show distinct thermal gradients across cells. The MLX90640's 32x24 pixel map spots the weakest cell and ejects the whole pack before the chain reaction starts.",
  },
  {
    id: "ebike",
    name: "E-Bike Battery Pack",
    capacity: "20,000 mAh",
    capacityMah: 20000,
    shredderImpact: "Major facility fire, requires floor evacuation.",
    financialDamage: "₹1,35,00,000",
    scale: 8,
    shape: "ebike",
    color: "#1f2530",
    prevention:
      "Large-format packs are pre-scanned at the conveyor head. RGB confirms the casing, thermal confirms cell health, and the kicker routes the pack to the fire-safe bin.",
  },
  {
    id: "station",
    name: "Portable Power Station",
    capacity: "60,000 mAh",
    capacityMah: 60000,
    shredderImpact: "Catastrophic structural fire, burns for hours.",
    financialDamage: "₹4,10,00,000",
    scale: 9,
    shape: "station",
    color: "#2c313a",
    prevention:
      "With catastrophic energy density, the system never lets it reach the shredder. Dual-sensor verification diverts it at the intake with zero cloud latency.",
  },
  {
    id: "ev",
    name: "EV Battery Module",
    capacity: "150,000+ mAh",
    capacityMah: 150000,
    shredderImpact: "Complete shredder destruction, multi-day chemical fire.",
    financialDamage: "₹9,50,00,000",
    scale: 10,
    shape: "ev",
    color: "#33222a",
    prevention:
      "The highest hazard class: fused RGB + thermal data verifies module integrity at the intake gate. Any anomaly means immediate diversion, keeping the crusher clear.",
  },
];
