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
  brand?: string;
  productName?: string;
  sku?: string;
  barcode?: string;
  
  // Composition & Material
  composition?: string; // e.g., "80% acrylic, 20% wool"
  fiberType?: 'natural' | 'synthetic' | 'blend';
  
  // Weight & Measurements
  weight?: number; // in grams
  length?: number; // in meters
  yarnWeight?: 'lace' | 'fingering' | 'sport' | 'dk' | 'worsted' | 'bulky' | 'super-bulky';
  ply?: number;
  
  // Tool Recommendations
  needleSize?: string; // e.g., "2.0-5.0" mm
  crochetHookSize?: string; // e.g., "1.0-4.0" mm
  
  // Color Information
  colorName?: string;
  colorCode?: string;
  dyelot?: string;
  colorFamily?: string; // e.g., "blue", "green", "neutral"
  
  // Technical Specifications
  gauge?: string; // e.g., "10 x 10 cm = 28 stitches x 36 rows"
  texture?: 'smooth' | 'fuzzy' | 'boucle' | 'chenille' | 'tweed' | 'other';
  twist?: 'low' | 'medium' | 'high';
  
  // Care Instructions
  washingInstructions?: string[];
  machineWashable?: boolean;
  temperature?: string; // e.g., "30°C"
  
  // Origin & Certification
  country?: string; // country of origin
  certificate?: string; // e.g., "Oeko-Tex Standard 100"
  organic?: boolean;
  sustainable?: boolean;
  
  // Purchase Information
  purchaseDate?: Date;
  purchasePrice?: number;
  purchaseLocation?: string;
  supplier?: string;
}

export interface HookDetails {
  // Basic Information
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

export interface NotionDetails {
  // For other accessories like stitch markers, scissors, etc.
  type?: 'stitch-marker' | 'scissors' | 'needle' | 'gauge' | 'row-counter' | 'other';
  brand?: string;
  material?: string;
  size?: string;
  color?: string;
  setSize?: number; // for items that come in sets
}

export interface InventoryItem {
  id: string;
  category: 'yarn' | 'hook' | 'notion' | 'other';
  title: string;
  description: string;
  images: string[]; // Array for multiple images
  quantity: number;
  minQuantity?: number; // For low stock alerts
  unit?: 'piece' | 'skein' | 'ball' | 'meter' | 'gram' | 'set';
  
  // Category-specific details
  yarnDetails?: YarnDetails;
  hookDetails?: HookDetails;
  notionDetails?: NotionDetails;
  
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