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

export interface YarnDetails {
  // Basic Information
  name?: string; // Full product name (e.g., "Alize Angora Gold Batik")
  brand?: string; // Brand name (e.g., "Alize")

  // Color Information
  color?: string; // Color name with code (e.g., "8057 Opečno-smetana")
  color_code?: string; // Color code only (e.g., "8057")

  // Material & Specifications
  fiber?: string; // Fiber composition (e.g., "80% akril / 20% volna")
  weight_category?: string; // Yarn weight (e.g., "Fingering", "DK", "Worsted")

  // Measurements per ball/skein
  ball_weight?: number; // Weight per ball in grams (e.g., 100)
  length?: number; // Length per ball in meters (e.g., 280)

  // Tool Recommendations
  hook_size?: string; // Recommended hook/needle size (e.g., "3 - 3.5 mm")

  // Storage & Purchase
  storage?: string; // Storage location (e.g., "Škatla 2 – tople barve")
  store?: string; // Where purchased (e.g., "Svet Metraže")
  purchase_date?: Date; // When purchased
  purchase_price?: number; // Purchase price (currency determined by user profile settings)

  // Calculated fields (computed from quantity * per-ball values)
  total_length?: number; // Total meters (length * quantity)
  total_weight?: number; // Total grams (ball_weight * quantity)
}

export interface HookDetails {
  // Basic Information
  name: string; // Product name/title (e.g., "Clover Amour Hook")
  brand?: string;
  model?: string;
  sku?: string;
  barcode?: string;

  // Size Information
  size: string; // e.g., "3.5 mm", "G/6"
  sizeMetric?: number; // size in mm
  sizeUS?: string; // US letter/number size
  sizeUK?: string; // UK size
  
  // Physical Properties
  length?: number; // total length in cm
  handleType?: 'ergonomic' | 'inline' | 'tapered' | 'standard';
  material?: 'aluminum' | 'steel' | 'plastic' | 'bamboo' | 'wood' | 'resin' | 'other';
  handleMaterial?: string; // e.g., "synthetic rubber", "silicone"
  
  // Features
  colorCoded?: boolean;
  nonSlip?: boolean;
  lightWeight?: boolean;
  flexible?: boolean;
  
  // Technical Details
  shaftType?: 'inline' | 'tapered';
  thumbRest?: boolean;
  
  // Origin & Quality
  country?: string;
  warranty?: string;
  
  // Purchase Information
  purchaseDate?: Date;
  purchasePrice?: number;
  purchaseLocation?: string;
}

export interface OtherDetails {
  // For other accessories like stitch markers, scissors, storage, etc.
  name: string; // Product name/title (e.g., "Stitch Markers Set")
  type?: 'stitch-marker' | 'scissors' | 'needle' | 'gauge' | 'row-counter' | 'storage' | 'other';
  brand?: string;
  material?: string;
  size?: string;
  color?: string;
  setSize?: number; // for items that come in sets
  purchasePrice?: number;
  purchaseLocation?: string;
}

export interface InventoryItem {
  id: string;
  category: 'yarn' | 'hook' | 'other';
  description: string;
  images: string[]; // Array for multiple images
  quantity: number;
  minQuantity?: number; // For low stock alerts
  unit?: 'piece' | 'skein' | 'ball' | 'meter' | 'gram' | 'set';

  // Category-specific details (each has required name field)
  yarnDetails?: YarnDetails;   // name is required
  hookDetails?: HookDetails;   // name is required
  otherDetails?: OtherDetails; // name is required
  
  // Location & Organization
  location?: string; // Where it's stored
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
}