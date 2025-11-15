# Data Models

This document describes all TypeScript interfaces and types used in the application. All types are defined in `types/index.ts`.

## Core Entities

### Project

Represents a crochet project at any stage of completion.

```typescript
interface Project {
  // Identification
  id: string;                           // Unique identifier (timestamp-based)

  // Basic Information
  title: string;                        // Project name
  description: string;                  // Project description
  status: ProjectStatus;                // Current status

  // Media
  images: string[];                     // Array of image URIs
  defaultImageIndex?: number;           // Index of the cover image

  // Resources
  patternPdf?: string;                 // URI to pattern PDF
  inspirationUrl?: string;             // Web link for inspiration

  // Tracking
  createdAt: Date;                     // Creation timestamp
  updatedAt: Date;                     // Last modification timestamp

  // Additional Details
  notes?: string;                      // Freeform notes
  yarnUsed?: string[];                 // Array of inventory item IDs
}
```

**ProjectStatus Type**
```typescript
type ProjectStatus =
  | 'idea'           // Planning stage
  | 'in-progress'    // Actively working on it
  | 'completed'      // Finished
  | 'maybe-someday'; // Future consideration
```

---

### InventoryItem

Represents any item in the user's crochet inventory (yarn, hooks, notions, etc.).

```typescript
interface InventoryItem {
  // Identification
  id: string;                           // Unique identifier
  category: 'yarn' | 'hook' | 'notion' | 'other';

  // Basic Information
  title: string;                        // Item name
  description: string;                  // Item description
  images: string[];                     // Array of image URIs

  // Quantity Management
  quantity: number;                     // Current quantity
  unit?: 'piece' | 'skein' | 'ball' | 'meter' | 'gram' | 'set';

  // Category-Specific Details
  yarnDetails?: YarnDetails;            // For yarn items
  hookDetails?: HookDetails;            // For hook items
  notionDetails?: NotionDetails;        // For notion items

  // Organization
  location?: string;                    // Physical storage location
  tags?: string[];                      // Searchable tags

  // Project Association
  usedInProjects?: string[];            // Project IDs using this item
  reserved?: boolean;                   // Reserved for a specific project
  reservedForProject?: string;          // Project ID if reserved

  // Metadata
  notes?: string;                       // Additional notes
  dateAdded: Date;                      // When added to inventory
  lastUpdated: Date;                    // Last modification
  lastUsed?: Date;                      // Last time used in a project

  // Barcode Support
  barcode?: string;                     // Scanned barcode/UPC
  upcData?: {                          // Data from UPC lookup
    title?: string;
    brand?: string;
    description?: string;
    images?: string[];
  };
}
```

---

## Detailed Type Definitions

### YarnDetails

Comprehensive yarn information for inventory items.

```typescript
interface YarnDetails {
  // Basic Information
  brand?: string;                       // Manufacturer name
  productName?: string;                 // Product line name
  sku?: string;                         // Stock keeping unit
  barcode?: string;                     // Product barcode

  // Composition & Material
  composition?: string;                 // e.g., "80% acrylic, 20% wool"
  fiberType?: 'natural' | 'synthetic' | 'blend';

  // Weight & Measurements
  weight?: number;                      // Weight in grams
  length?: number;                      // Length in meters
  yarnWeight?: YarnWeightCategory;      // Standard weight category
  ply?: number;                         // Number of plies

  // Tool Recommendations
  needleSize?: string;                  // e.g., "2.0-5.0 mm"
  crochetHookSize?: string;            // e.g., "1.0-4.0 mm"

  // Color Information
  colorName?: string;                   // Name of the color
  colorCode?: string;                   // Manufacturer color code
  dyelot?: string;                      // Dye lot number
  colorFamily?: string;                 // e.g., "blue", "green", "neutral"

  // Technical Specifications
  gauge?: string;                       // e.g., "10x10cm = 28sts x 36rows"
  texture?: TextureType;                // Yarn texture
  twist?: 'low' | 'medium' | 'high';   // Yarn twist level

  // Care Instructions
  washingInstructions?: string[];       // Care instruction list
  machineWashable?: boolean;            // Machine wash safe
  temperature?: string;                 // Wash temperature (e.g., "30°C")

  // Origin & Certification
  country?: string;                     // Country of origin
  certificate?: string;                 // e.g., "Oeko-Tex Standard 100"
  organic?: boolean;                    // Organic certification
  sustainable?: boolean;                // Sustainable practices

  // Purchase Information
  purchaseDate?: Date;                  // When purchased
  purchasePrice?: number;               // Price paid
  purchaseLocation?: string;            // Store or website
  supplier?: string;                    // Supplier name
}
```

**YarnWeightCategory Type**
```typescript
type YarnWeightCategory =
  | 'lace'          // 0-1 weight
  | 'fingering'     // 1-2 weight
  | 'sport'         // 2-3 weight
  | 'dk'            // 3-4 weight (Double Knit)
  | 'worsted'       // 4-5 weight
  | 'bulky'         // 5-6 weight
  | 'super-bulky';  // 6+ weight
```

**TextureType**
```typescript
type TextureType =
  | 'smooth'
  | 'fuzzy'
  | 'boucle'
  | 'chenille'
  | 'tweed'
  | 'other';
```

---

### HookDetails

Information specific to crochet hooks.

```typescript
interface HookDetails {
  // Basic Information
  brand?: string;                       // Manufacturer
  model?: string;                       // Model name/number
  sku?: string;                         // Stock keeping unit
  barcode?: string;                     // Product barcode

  // Size Information
  size: string;                         // Primary size (e.g., "3.5 mm", "G/6")
  sizeMetric?: number;                  // Size in millimeters
  sizeUS?: string;                      // US letter/number (e.g., "E/4")
  sizeUK?: string;                      // UK size

  // Physical Properties
  length?: number;                      // Total length in cm
  handleType?: HandleType;              // Handle style
  material?: HookMaterial;              // Hook material
  handleMaterial?: string;              // Handle material (e.g., "silicone")

  // Features
  colorCoded?: boolean;                 // Size color coding
  nonSlip?: boolean;                    // Non-slip grip
  lightWeight?: boolean;                // Lightweight construction
  flexible?: boolean;                   // Flexible shaft

  // Technical Details
  shaftType?: 'inline' | 'tapered';    // Shaft style
  thumbRest?: boolean;                  // Thumb rest feature

  // Origin & Quality
  country?: string;                     // Country of manufacture
  warranty?: string;                    // Warranty information

  // Purchase Information
  purchaseDate?: Date;                  // When purchased
  purchasePrice?: number;               // Price paid
  purchaseLocation?: string;            // Where purchased
}
```

**HandleType**
```typescript
type HandleType =
  | 'ergonomic'     // Ergonomic grip
  | 'inline'        // Inline handle
  | 'tapered'       // Tapered handle
  | 'standard';     // Standard handle
```

**HookMaterial**
```typescript
type HookMaterial =
  | 'aluminum'
  | 'steel'
  | 'plastic'
  | 'bamboo'
  | 'wood'
  | 'resin'
  | 'other';
```

---

### NotionDetails

Information for other crochet accessories and tools.

```typescript
interface NotionDetails {
  type?: NotionType;                    // Type of notion
  brand?: string;                       // Manufacturer
  material?: string;                    // Material composition
  size?: string;                        // Size specification
  color?: string;                       // Color
  setSize?: number;                     // Number of items in set
}
```

**NotionType**
```typescript
type NotionType =
  | 'stitch-marker'    // Stitch markers
  | 'scissors'         // Scissors/snips
  | 'needle'           // Yarn needles
  | 'gauge'            // Gauge measuring tools
  | 'row-counter'      // Row counters
  | 'other';           // Other accessories
```

---

### User

Represents an authenticated user.

```typescript
interface User {
  id: string;                           // Unique user identifier
  name: string;                         // User's display name
  email: string;                        // Email address
  avatar?: string;                      // Avatar image URI
}
```

---

## Data Relationships

### Project ↔ Inventory Relationship

Projects can reference inventory items through the `yarnUsed` field:

```typescript
// Project references inventory
project.yarnUsed = ['inventory-item-id-1', 'inventory-item-id-2'];

// Inventory tracks which projects use it
inventoryItem.usedInProjects = ['project-id-1', 'project-id-2'];

// Inventory can be reserved for a project
inventoryItem.reserved = true;
inventoryItem.reservedForProject = 'project-id-1';
```

### Data Validation Rules

1. **IDs**: Generated using `Date.now().toString()` for uniqueness
2. **Dates**: All dates stored as Date objects, serialized for AsyncStorage
3. **Arrays**: Empty arrays `[]` used as default for list fields
4. **Optional Fields**: Most detailed fields are optional for flexibility
5. **Required Fields**:
   - Project: `id`, `title`, `description`, `status`, `images`, `createdAt`, `updatedAt`
   - InventoryItem: `id`, `category`, `title`, `description`, `images`, `quantity`, `dateAdded`, `lastUpdated`
   - User: `id`, `name`, `email`

---

## Usage Examples

### Creating a Project

```typescript
const newProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
  title: "Baby Blanket",
  description: "Soft pink baby blanket with granny squares",
  status: "in-progress",
  images: [imageUri1, imageUri2],
  defaultImageIndex: 0,
  yarnUsed: ["yarn-id-1", "yarn-id-2"],
  notes: "Using 4.0mm hook",
};

const project = await addProject(newProject);
```

### Creating Yarn Inventory

```typescript
const yarnItem: Omit<InventoryItem, 'id' | 'dateAdded' | 'lastUpdated'> = {
  category: "yarn",
  title: "Bernat Softee Baby Yarn",
  description: "Pink, 100g ball",
  images: [imageUri],
  quantity: 5,
  unit: "ball",
  yarnDetails: {
    brand: "Bernat",
    productName: "Softee Baby",
    colorName: "Pink",
    weight: 100,
    length: 140,
    yarnWeight: "dk",
    composition: "100% acrylic",
    fiberType: "synthetic",
    machineWashable: true,
  },
  location: "Craft Room - Shelf A",
  tags: ["baby", "soft", "pink"],
};

const item = await addInventoryItem(yarnItem);
```
