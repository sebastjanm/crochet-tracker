import type { ImageSource } from 'expo-image';

export type ProjectStatus = 'to-do' | 'in-progress' | 'on-hold' | 'completed' | 'frogged';

// Image can be a URL string or a local require() asset
export type ProjectImage = string | ImageSource;

// Helper to convert ProjectImage to ImageSource for expo-image
export function getImageSource(image: ProjectImage): ImageSource {
  if (typeof image === 'string') {
    return { uri: image };
  }
  return image;
}

export type ProjectType =
  | 'blanket'
  | 'amigurumi'
  | 'garment'
  | 'accessory'
  | 'home-decor'
  | 'toy'
  | 'leg-warmer'
  | 'other';

export interface WorkProgressEntry {
  id: string;
  date: Date; // Auto-set, not displayed in UI
  notes: string; // Combined work notes (what was done + what's next)
}

export interface InspirationSource {
  id: string;
  url?: string; // Optional URL
  patternSource?: string; // Pattern source text
  images?: string[]; // Extra inspiration images
  description?: string; // Multiline description
}

export interface Project {
  id: string;
  title: string;
  description?: string; // Brief project summary (what is this project about?)
  status: ProjectStatus;
  images: ProjectImage[];
  defaultImageIndex?: number; // Index of the default image in the images array
  patternPdf?: string;
  patternUrl?: string; // Pattern URL (e.g., Ravelry, blog post)
  patternImages?: string[]; // Photos of written patterns
  inspirationUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  notes?: string; // Additional notes/reminders
  yarnUsed?: string[];

  // Phase 1: Basic metadata additions
  projectType?: ProjectType;
  startDate?: Date;
  completedDate?: Date; // Auto-set when status becomes 'completed'

  // Phase 2: Materials
  yarnUsedIds?: string[]; // Array of inventory item IDs (yarn category)
  hookUsedIds?: string[]; // Array of inventory item IDs (hook category)

  // Phase 3: Work progress and inspiration
  workProgress?: WorkProgressEntry[]; // Array of work entries
  inspirationSources?: InspirationSource[]; // Array of inspiration sources
}

// ===== YARN DATA MODEL (EU / Metric) =====

export interface YarnCompany {
  id?: number;
  name: string;
  permalink?: string;
}

export type YarnWeightName =
  | 'Lace'
  | 'Light Fingering'
  | 'Fingering'
  | 'Sport'
  | 'DK'
  | 'Worsted'
  | 'Aran'
  | 'Bulky'
  | 'Super Bulky'
  | 'Jumbo';

export interface YarnWeight {
  id?: number;
  name: YarnWeightName;
  ply?: number; // UK/EU ply: 2, 3, 4, 8, 10, 12
}

export interface YarnFiber {
  fiberType: string; // e.g., "Acrylic", "Wool", "Cotton"
  percentage: number; // e.g., 80
}

export interface YarnDetails {
  // ===== PRODUCT IDENTITY =====
  brand: YarnCompany;
  line?: string; // Product line, e.g., "Angora Gold Batik"
  sku?: string; // Product code, e.g., "25290-8057"
  permalink?: string; // URL slug for lookups

  // ===== COLOR =====
  colorName?: string; // e.g., "opečno-smetana"
  colorCode?: string; // e.g., "8057"
  colorFamily?: string; // e.g., "brown", "warm" (for filtering)

  // ===== COMPOSITION =====
  fibers: YarnFiber[]; // Array of fiber types with percentages

  // ===== WEIGHT =====
  weight: YarnWeight;

  // ===== MEASUREMENTS (metric, per ball/skein) =====
  grams: number; // Weight in grams, e.g., 100
  meters: number; // Length in meters, e.g., 550

  // ===== GAUGE (per 10cm) =====
  gaugeStitches?: number; // e.g., 28
  gaugeRows?: number; // e.g., 36

  // ===== TOOL RECOMMENDATIONS (mm) =====
  needleSizeMin?: number; // e.g., 3
  needleSizeMax?: number; // e.g., 6
  hookSizeMin?: number; // e.g., 2
  hookSizeMax?: number; // e.g., 4

  // ===== PROPERTIES =====
  texture?: string; // e.g., "soft", "rustic", "smooth"
  machineWashable?: boolean;

  // ===== PURCHASE INFO =====
  store?: string; // e.g., "Svet Metraže"
  purchaseDate?: Date;
  purchasePrice?: number; // Price per unit
  currency?: string; // e.g., "EUR"

  // ===== STORAGE =====
  storageLocation?: string; // e.g., "Box 2 - warm colors"
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
  name: string;
  description?: string;
  images?: ProjectImage[];
  quantity: number;
  unit?: 'piece' | 'skein' | 'ball' | 'meter' | 'gram' | 'set';

  // Category-specific details
  yarnDetails?: YarnDetails;
  hookDetails?: HookDetails;
  otherDetails?: OtherDetails;

  // Location & Organization
  location?: string;
  tags?: string[];

  // Project Association
  usedInProjects?: string[];

  // Common fields
  notes?: string;
  dateAdded: Date;
  lastUpdated: Date;

  // Barcode
  barcode?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  currency?: string; // Default currency for purchases (EUR, USD, etc.)
  isPro?: boolean; // Pro subscription status
}
