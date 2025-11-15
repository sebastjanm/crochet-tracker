export type ProjectStatus = 'idea' | 'in-progress' | 'completed' | 'maybe-someday';

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  images: string[];
  defaultImageIndex?: number; // Index of the default image in the images array
  patternPdf?: string;
  inspirationUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  yarnUsed?: string[];
}

// Yarn weight standard (Craft Yarn Council)
export type YarnWeightNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
// 0: Lace, 1: Fingering, 2: Sport, 3: DK, 4: Worsted, 5: Bulky, 6: Super Bulky, 7: Jumbo

export interface GaugeInfo {
  stitches: number; // e.g., 23
  rows: number; // e.g., 33
  sizeCm: string; // e.g., "10 x 10"
  tool?: string; // e.g., "3.5mm hook"
  pattern?: string; // e.g., "single crochet", "stockinette"
  source?: 'manufacturer' | 'userSwatch' | 'pattern';
  notes?: string;
}

export interface YarnDetails {
  // ===== PRODUCT IDENTITY =====
  brand?: string; // e.g., "Alize"
  line?: string; // Product line, e.g., "Angora Gold"
  sku?: string; // Product code, e.g., "25290-8054"

  // ===== COLOR =====
  colorName?: string; // e.g., "brown-beige", "Opečno-smetana"
  colorCode?: string; // e.g., "8054"
  colorFamily?: string; // e.g., "brown", "warm" (for filtering)

  // ===== COMPOSITION =====
  fiber: string; // REQUIRED - e.g., "80% Acrylic, 20% Wool"
  composition?: {
    [fiberName: string]: number; // e.g., { "acrylic": 80, "wool": 20 }
  };

  // ===== WEIGHT CATEGORY =====
  weightCategory: string; // REQUIRED - e.g., "Fingering - Sock", "DK"
  weightNumber?: YarnWeightNumber; // Standard 0-7 system

  // ===== MEASUREMENTS (per ball/skein) =====
  ballWeightG: number; // REQUIRED - Weight in grams, e.g., 100
  ballWeightOz?: number; // Weight in ounces, e.g., 3.53
  lengthM: number; // REQUIRED - Length in meters, e.g., 550
  lengthYd?: number; // Length in yards, e.g., 601

  // ===== TOOL RECOMMENDATIONS =====
  hookSizeMm?: string; // e.g., "2-4" or "3.5"
  hookSizeUs?: string; // e.g., "B-1 / G-6" or "E/4"
  needleSizeMm?: string; // e.g., "3-6"
  needleSizeUs?: string; // e.g., "2.5-10" or "US 4"

  // ===== GAUGE =====
  gauge?: GaugeInfo; // Manufacturer's recommended gauge
  myGauge?: GaugeInfo; // User's actual swatch gauge

  // ===== CARE & QUALITY =====
  careSymbols?: string[]; // e.g., ["handWash", "noBleach", "noIron", "noTumbleDry"]
  careText?: string; // Free-form care instructions
  certifications?: string[]; // e.g., ["Oeko-Tex Standard 100"]
  certificateDetails?: string; // e.g., "14.HTR.37463 HOHENSTEIN HTTI"

  // ===== CHARACTERISTICS =====
  halo?: boolean; // Fuzzy/angora effect
  selfStriping?: boolean; // Color gradients
  variegated?: boolean; // Multicolor
  texture?: string; // e.g., "soft", "rustic", "smooth"
  sheen?: string; // e.g., "matte", "glossy", "metallic"
  recommendedFor?: string[]; // e.g., ["shawls", "lightweight sweaters", "lace patterns"]

  // ===== PURCHASE INFO =====
  store?: string; // e.g., "Svet Metraže"
  purchaseDate?: Date;
  purchasePrice?: number; // Price per unit
  currency?: string; // e.g., "EUR", "USD"
  originalUrl?: string; // Link to product page

  // ===== STORAGE =====
  storageLocation?: string; // e.g., "Box 2 - warm colors"
  storageBox?: string; // e.g., "Box 2"
  storageArea?: string; // e.g., "Craft room"
}

export interface HookDetails {
  // ===== PRODUCT IDENTITY =====
  brand?: string; // e.g., "Clover"
  model?: string; // e.g., "Amour"
  line?: string; // Product line
  sku?: string; // Product code
  barcode?: string;

  // ===== SIZE INFORMATION =====
  size?: string; // e.g., "3.5 mm", "E/4"
  sizeMm?: number; // Size in mm, e.g., 3.5
  sizeUs?: string; // US size, e.g., "E/4"
  sizeUk?: string; // UK size, e.g., "9"

  // ===== PHYSICAL PROPERTIES =====
  lengthCm?: number; // Total length in cm
  lengthIn?: number; // Total length in inches
  handleType?: 'ergonomic' | 'inline' | 'tapered' | 'standard';
  material?: 'aluminum' | 'steel' | 'plastic' | 'bamboo' | 'wood' | 'resin' | 'carbonFiber' | 'other';
  handleMaterial?: string; // e.g., "synthetic rubber", "silicone"

  // ===== FEATURES =====
  colorCoded?: boolean;
  nonSlip?: boolean;
  lightWeight?: boolean;
  flexible?: boolean;

  // ===== TECHNICAL DETAILS =====
  shaftType?: 'inline' | 'tapered';
  thumbRest?: boolean;

  // ===== ORIGIN & QUALITY =====
  country?: string;
  warranty?: string;
  certifications?: string[];

  // ===== PURCHASE INFO =====
  store?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  currency?: string;
  originalUrl?: string;

  // ===== STORAGE =====
  storageLocation?: string;

  // ===== COMPATIBILITY =====
  recommendedYarnWeights?: string[]; // e.g., ["Fingering", "Sport", "DK"]
  bestFor?: string[]; // e.g., ["lace work", "fine details", "amigurumi"]
}

export interface OtherDetails {
  // ===== PRODUCT IDENTITY =====
  type?:
    | 'stitchMarker'
    | 'scissors'
    | 'needle'
    | 'tapestryNeedle'
    | 'yarnNeedle'
    | 'gauge'
    | 'rowCounter'
    | 'storage'
    | 'measuringTape'
    | 'stitchHolder'
    | 'patternBook'
    | 'organizer'
    | 'blockingPins'
    | 'pompomMaker'
    | 'other';
  brand?: string;
  model?: string;
  sku?: string;

  // ===== SPECIFICATIONS =====
  material?: string;
  size?: string;
  dimensions?: string;
  color?: string;
  setSize?: number; // For items that come in sets
  weight?: string;

  // ===== FEATURES =====
  features?: string[]; // e.g., ["locking mechanism", "color coded", "lightweight"]
  compatibleWith?: string[]; // e.g., ["knitting needles", "crochet hooks"]

  // ===== PURCHASE INFO =====
  store?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  currency?: string;
  originalUrl?: string;

  // ===== STORAGE =====
  storageLocation?: string;

  // ===== SPECIFIC USE =====
  bestFor?: string[]; // e.g., ["marking pattern repeats", "tracking increases"]
}

export interface InventoryItem {
  id: string;
  category: 'yarn' | 'hook' | 'other';
  name: string; // Quick access name for display (denormalized from detail objects)
  description: string;
  images: string[]; // Array for multiple images
  quantity: number;
  unit?: 'piece' | 'skein' | 'ball' | 'meter' | 'gram' | 'set';

  // Category-specific details (name is now at root level)
  yarnDetails?: YarnDetails;
  hookDetails?: HookDetails;
  otherDetails?: OtherDetails;

  // Location & Organization
  location?: string; // Quick access location (denormalized from detail objects)
  tags?: string[]; // For filtering and searching

  // Project Association
  usedInProjects?: string[]; // Project IDs
  reserved?: boolean; // If reserved for a specific project
  reservedForProject?: string;

  // Common fields
  notes?: string;
  dateAdded: Date;
  lastUpdated: Date;
  lastUsed?: Date;

  // Barcode/QR Code
  barcode?: string;
  upcData?: {
    title?: string;
    brand?: string;
    description?: string;
    images?: string[];
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  currency?: string; // Default currency for purchases (EUR, USD, etc.)
}
