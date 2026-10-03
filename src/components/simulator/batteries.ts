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
  financialDamageMah: number;
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
    shredderImpact: "Localized smolder in dry paper. Requires 15-min conveyor emergency stop.",
    financialDamage: "₹8,500",
    financialDamageMah: 8500,
    scale: 1,
    shape: "coin",
    color: "#9fb0c7",
    prevention:
      "The RGB sensor locks the coin's reflective rim geometry at 60fps while the MLX90640 catches micro heat bleed from a damaged cell. The pneumatic kicker ejects it before the crusher jaw ever closes.",
  },
  {
    id: "vape-lipo",
    name: "Disposable Vape LiPo",
    capacity: "400 mAh",
    capacityMah: 400,
    shredderImpact:
      "Sudden flame jet. Requires 1-hour line shutdown and manual extinguisher deployment.",
    financialDamage: "₹45,000",
    financialDamageMah: 45000,
    scale: 2,
    shape: "vape",
    color: "#3b4a63",
    prevention:
      "Pouch geometry is flagged by YOLOv8 contour analysis on the RGB stream, and the thermal array picks up the sudden temperature spike of a venting LiPo. Ejected 40ms before crush contact.",
  },
  {
    id: "18650-cell",
    name: "18650 Cell (Flashlights/Vapes)",
    capacity: "3,000 mAh",
    capacityMah: 3000,
    shredderImpact:
      "Violent casing rupture. Damages rubber conveyor belt requiring localized patching.",
    financialDamage: "₹1,20,000",
    financialDamageMah: 120000,
    scale: 3,
    shape: "cell",
    color: "#46586e",
    prevention:
      "The cylindrical steel profile is matched against the hazard library in real-time. Any IR spike above 60°C from a punctured cell triggers instant pneumatic ejection off the conveyor.",
  },
  {
    id: "smartphone",
    name: "Smartphone Battery",
    capacity: "4,000 mAh",
    capacityMah: 4000,
    shredderImpact:
      "Intense sustained fire. Triggers localized foam suppression system.",
    financialDamage: "₹2,50,000",
    financialDamageMah: 250000,
    scale: 4,
    shape: "phone",
    color: "#232b36",
    prevention:
      "The flat slab silhouette with camera cutout is isolated on the RGB feed, while thermal runaway's rapid heat bloom is detected up to 2 seconds before crusher impact.",
  },
  {
    id: "drone-lipo",
    name: "Drone High-C LiPo",
    capacity: "5,000 mAh",
    capacityMah: 5000,
    shredderImpact:
      "Rapid fireball. Destroys optical sorting lenses above the belt.",
    financialDamage: "₹4,00,000",
    financialDamageMah: 400000,
    scale: 5,
    shape: "drone",
    color: "#2a2f38",
    prevention:
      "High-discharge packs run warm even when healthy, so the thermal array baselines their surface heat and ejects any pack exceeding safe thresholds mid-conveyor.",
  },
  {
    id: "tablet-pouch",
    name: "Tablet Pouch Cell",
    capacity: "8,000 mAh",
    capacityMah: 8000,
    shredderImpact:
      "Heavy toxic smoke. Requires half-day facility evacuation and ventilation.",
    financialDamage: "₹6,50,000",
    financialDamageMah: 650000,
    scale: 6,
    shape: "tablet",
    color: "#3a4150",
    prevention:
      "Swelling distorts the pouch silhouette in the RGB frame long before rupture. Dual-sensor fusion classifies the distortion and ejects the item to the fire-safe bin.",
  },
  {
    id: "power-tool",
    name: "Power Tool Pack (20V)",
    capacity: "9,000 mAh",
    capacityMah: 9000,
    shredderImpact:
      "Multi-cell chain reaction. Melts primary shredder throat components.",
    financialDamage: "₹12,00,000",
    financialDamageMah: 1200000,
    scale: 7,
    shape: "tool",
    color: "#4a4231",
    prevention:
      "Multi-cell packs show distinct thermal gradients across cells. The MLX90640's 32x24 pixel map spots the weakest cell and ejects the whole pack before the chain reaction starts.",
  },
  {
    id: "ebike-pack",
    name: "E-Bike Battery Pack",
    capacity: "20,000 mAh",
    capacityMah: 20000,
    shredderImpact:
      "Major facility fire. Triggers main sprinklers, ruining 50+ tons of recycled cardboard stock.",
    financialDamage: "₹35,00,000",
    financialDamageMah: 3500000,
    scale: 8,
    shape: "ebike",
    color: "#1f2530",
    prevention:
      "Large-format packs are pre-scanned at the conveyor head. RGB confirms the casing, thermal confirms cell health, and the kicker routes the pack to the fire-safe bin.",
  },
  {
    id: "power-station",
    name: "Portable Power Station",
    capacity: "60,000 mAh",
    capacityMah: 60000,
    shredderImpact:
      "Structural metal deformation. Primary shredder motor complete destruction.",
    financialDamage: "₹80,00,000",
    financialDamageMah: 8000000,
    scale: 9,
    shape: "station",
    color: "#2c313a",
    prevention:
      "With catastrophic energy density, the system never lets it reach the shredder. Dual-sensor verification diverts it at the intake with zero cloud latency.",
  },
  {
    id: "ev-module",
    name: "EV Battery Module",
    capacity: "150,000+ mAh",
    capacityMah: 150000,
    shredderImpact:
      "Catastrophic facility-wide explosion. Multi-day chemical fire, total asset loss.",
    financialDamage: "₹4,50,00,000+",
    financialDamageMah: 45000000,
    scale: 10,
    shape: "ev",
    color: "#33222a",
    prevention:
      "The highest hazard class: fused RGB + thermal data verifies module integrity at the intake gate. Any anomaly means immediate diversion, keeping the crusher clear.",
  },
];

export const BATTERY_PROFILES = BATTERIES;
