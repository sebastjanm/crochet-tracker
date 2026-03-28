import type { Project, InventoryItem, User } from '@/types';
import type { ImageSource } from 'expo-image';

// Project images from assets/projects
export const projectImages = {
  grandmama: require('@/assets/projects/grandmama.jpeg') as ImageSource,
  bunny: require('@/assets/projects/bunny.jpg') as ImageSource,
  bag: require('@/assets/projects/bag.jpg') as ImageSource,
  hat: require('@/assets/projects/hat.jpg') as ImageSource,
  shawl1: require('@/assets/projects/shawl1.jpeg') as ImageSource,
  shawl2: require('@/assets/projects/shawl2.jpg') as ImageSource,
};

/**
 * MOCK DATA FOR DEVELOPMENT
 *
 * This file contains realistic mock data for the Crochet Tracker app.
 * Use this data to populate the app during development and testing.
 *
 * Includes:
 * - 6 realistic projects (varied types and statuses)
 * - Slovenian inventory items from Svet Metraže (EUR pricing)
 *   - 7 yarns (Alize brand)
 *   - 5 hooks (aluminum, standard Slovenian format)
 * - 1 mock user
 */

// =======================
// MOCK USER
// =======================

export const mockUser: User = {
  id: 'user-mock-001',
  name: 'Breda Crochet',
  email: 'breda.crochet@example.com',
  currency: 'EUR',
  role: 'ordinary',
  isPro: false,
  isAdmin: false,
};

// =======================
// MOCK INVENTORY ITEMS
// =======================

export const mockInventory: InventoryItem[] = [
  // YARN ITEMS - Alize from Svet Metraže (svetmetraze.si)
  {
    id: 'yarn-001',
    category: 'yarn',
    name: 'Alize Angora Gold Batik - Belo-rdeča',
    images: [],
    quantity: 5,
    unit: 'skein',
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-20'),
    yarnDetails: {
      brand: { name: 'Alize' },
      line: 'Angora Gold Batik',
      colorName: 'Belo-rdeča',
      colorCode: '1984',
      colorFamily: 'multi',
      fibers: [
        { fiberType: 'acrylic', percentage: 80 },
        { fiberType: 'wool', percentage: 20 },
      ],
      weight: { name: 'Fingering', ply: 4 },
      grams: 100,
      meters: 550,
      gaugeStitches: 28,
      gaugeRows: 36,
      hookSizeMin: 2.0,
      hookSizeMax: 4.0,
      needleSizeMin: 3.0,
      needleSizeMax: 6.0,
      store: 'Svet Metraže',
      purchaseDate: new Date('2025-01-10'),
      purchasePrice: 4.29,
      currency: 'EUR',
      storageLocation: 'Omara - Polica A',
    },
    location: 'Omara - Polica A',
    usedInProjects: ['project-001', 'project-003'],
  },
  {
    id: 'yarn-002',
    category: 'yarn',
    name: 'Alize Angora Gold Batik - Opečno-smetana',
    images: [],
    quantity: 4,
    unit: 'skein',
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-18'),
    yarnDetails: {
      brand: { name: 'Alize' },
      line: 'Angora Gold Batik',
      colorName: 'Opečno-smetana',
      colorCode: '8057',
      colorFamily: 'orange',
      fibers: [
        { fiberType: 'acrylic', percentage: 80 },
        { fiberType: 'wool', percentage: 20 },
      ],
      weight: { name: 'Fingering', ply: 4 },
      grams: 100,
      meters: 550,
      gaugeStitches: 28,
      gaugeRows: 36,
      hookSizeMin: 2.0,
      hookSizeMax: 4.0,
      needleSizeMin: 3.0,
      needleSizeMax: 6.0,
      store: 'Svet Metraže',
      purchaseDate: new Date('2025-01-10'),
      purchasePrice: 4.29,
      currency: 'EUR',
      storageLocation: 'Omara - Polica A',
    },
    location: 'Omara - Polica A',
    usedInProjects: ['project-002'],
  },
  {
    id: 'yarn-003',
    category: 'yarn',
    name: 'Alize Angora Gold Batik - Rjavo-bež',
    images: [],
    quantity: 3,
    unit: 'skein',
    createdAt: new Date('2025-01-12'),
    updatedAt: new Date('2025-01-15'),
    yarnDetails: {
      brand: { name: 'Alize' },
      line: 'Angora Gold Batik',
      colorName: 'Rjavo-bež',
      colorCode: '8054',
      colorFamily: 'brown',
      fibers: [
        { fiberType: 'acrylic', percentage: 80 },
        { fiberType: 'wool', percentage: 20 },
      ],
      weight: { name: 'Fingering', ply: 4 },
      grams: 100,
      meters: 550,
      gaugeStitches: 28,
      gaugeRows: 36,
      hookSizeMin: 2.0,
      hookSizeMax: 4.0,
      needleSizeMin: 3.0,
      needleSizeMax: 6.0,
      store: 'Svet Metraže',
      purchaseDate: new Date('2025-01-12'),
      purchasePrice: 4.29,
      currency: 'EUR',
      storageLocation: 'Omara - Polica A',
    },
    location: 'Omara - Polica A',
    usedInProjects: [],
  },
  {
    id: 'yarn-004',
    category: 'yarn',
    name: 'Alize Lanagold - Siva',
    images: [],
    quantity: 6,
    unit: 'skein',
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-20'),
    yarnDetails: {
      brand: { name: 'Alize' },
      line: 'Lanagold',
      colorName: 'Siva',
      colorCode: '348',
      colorFamily: 'gray',
      fibers: [
        { fiberType: 'acrylic', percentage: 51 },
        { fiberType: 'wool', percentage: 49 },
      ],
      weight: { name: 'Aran', ply: 10 },
      grams: 100,
      meters: 240,
      gaugeStitches: 18,
      gaugeRows: 25,
      hookSizeMin: 3.0,
      hookSizeMax: 4.5,
      needleSizeMin: 4.0,
      needleSizeMax: 6.0,
      store: 'Svet Metraže',
      purchaseDate: new Date('2025-01-15'),
      purchasePrice: 4.99,
      currency: 'EUR',
      storageLocation: 'Omara - Polica B',
    },
    location: 'Omara - Polica B',
    usedInProjects: ['project-004'],
  },
  {
    id: 'yarn-005',
    category: 'yarn',
    name: 'Alize Lanagold - Mint',
    images: [],
    quantity: 4,
    unit: 'skein',
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-18'),
    yarnDetails: {
      brand: { name: 'Alize' },
      line: 'Lanagold',
      colorName: 'Mint',
      colorCode: '386',
      colorFamily: 'green',
      fibers: [
        { fiberType: 'acrylic', percentage: 51 },
        { fiberType: 'wool', percentage: 49 },
      ],
      weight: { name: 'Aran', ply: 10 },
      grams: 100,
      meters: 240,
      gaugeStitches: 18,
      gaugeRows: 25,
      hookSizeMin: 3.0,
      hookSizeMax: 4.5,
      needleSizeMin: 4.0,
      needleSizeMax: 6.0,
      store: 'Svet Metraže',
      purchaseDate: new Date('2025-01-15'),
      purchasePrice: 4.99,
      currency: 'EUR',
      storageLocation: 'Omara - Polica B',
    },
    location: 'Omara - Polica B',
    usedInProjects: ['project-005'],
  },
  {
    id: 'yarn-006',
    category: 'yarn',
    name: 'Alize Lanagold - Rdeča',
    images: [],
    quantity: 5,
    unit: 'skein',
    createdAt: new Date('2025-01-16'),
    updatedAt: new Date('2025-01-20'),
    yarnDetails: {
      brand: { name: 'Alize' },
      line: 'Lanagold',
      colorName: 'Rdeča',
      colorCode: '56',
      colorFamily: 'red',
      fibers: [
        { fiberType: 'acrylic', percentage: 51 },
        { fiberType: 'wool', percentage: 49 },
      ],
      weight: { name: 'Aran', ply: 10 },
      grams: 100,
      meters: 240,
      gaugeStitches: 18,
      gaugeRows: 25,
      hookSizeMin: 3.0,
      hookSizeMax: 4.5,
      needleSizeMin: 4.0,
      needleSizeMax: 6.0,
      store: 'Svet Metraže',
      purchaseDate: new Date('2025-01-16'),
      purchasePrice: 4.99,
      currency: 'EUR',
      storageLocation: 'Omara - Polica B',
    },
    location: 'Omara - Polica B',
    usedInProjects: ['project-006'],
  },
  {
    id: 'yarn-007',
    category: 'yarn',
    name: 'Alize Lanagold - Črna',
    images: [],
    quantity: 8,
    unit: 'skein',
    createdAt: new Date('2025-01-16'),
    updatedAt: new Date('2025-01-22'),
    yarnDetails: {
      brand: { name: 'Alize' },
      line: 'Lanagold',
      colorName: 'Črna',
      colorCode: '60',
      colorFamily: 'black',
      fibers: [
        { fiberType: 'acrylic', percentage: 51 },
        { fiberType: 'wool', percentage: 49 },
      ],
      weight: { name: 'Aran', ply: 10 },
      grams: 100,
      meters: 240,
      gaugeStitches: 18,
      gaugeRows: 25,
      hookSizeMin: 3.0,
      hookSizeMax: 4.5,
      needleSizeMin: 4.0,
      needleSizeMax: 6.0,
      store: 'Svet Metraže',
      purchaseDate: new Date('2025-01-16'),
      purchasePrice: 4.99,
      currency: 'EUR',
      storageLocation: 'Omara - Polica B',
    },
    location: 'Omara - Polica B',
    usedInProjects: ['project-001', 'project-004'],
  },

  // HOOK ITEMS - Kvačke (Slovenian format: "Kvačka, aluminij, 15 cm, debelina X mm")
  {
    id: 'hook-001',
    category: 'hook',
    name: 'Kvačka, aluminij, 15 cm, debelina 2,5 mm',
    images: [],
    quantity: 1,
    unit: 'piece',
    createdAt: new Date('2024-10-15'),
    updatedAt: new Date('2025-01-20'),
    hookDetails: {
      brand: 'Prym',
      sizeMm: 2.5,
      handleType: 'standard',
      material: 'aluminum',
      store: 'Svet Metraže',
      purchaseDate: new Date('2024-10-15'),
      purchasePrice: 2.49,
      currency: 'EUR',
    },
    location: 'Škatla s kvačkami',
    usedInProjects: ['project-002'],
  },
  {
    id: 'hook-002',
    category: 'hook',
    name: 'Kvačka, aluminij, 15 cm, debelina 3,0 mm',
    images: [],
    quantity: 1,
    unit: 'piece',
    createdAt: new Date('2024-10-15'),
    updatedAt: new Date('2025-01-18'),
    hookDetails: {
      brand: 'Prym',
      sizeMm: 3.0,
      handleType: 'standard',
      material: 'aluminum',
      store: 'Svet Metraže',
      purchaseDate: new Date('2024-10-15'),
      purchasePrice: 2.49,
      currency: 'EUR',
    },
    location: 'Škatla s kvačkami',
    usedInProjects: ['project-001', 'project-003'],
  },
  {
    id: 'hook-003',
    category: 'hook',
    name: 'Kvačka, aluminij, 15 cm, debelina 4,0 mm',
    images: [],
    quantity: 2,
    unit: 'piece',
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date('2025-01-15'),
    hookDetails: {
      brand: 'Prym',
      sizeMm: 4.0,
      handleType: 'standard',
      material: 'aluminum',
      store: 'Svet Metraže',
      purchaseDate: new Date('2024-11-01'),
      purchasePrice: 2.79,
      currency: 'EUR',
    },
    location: 'Škatla s kvačkami',
    usedInProjects: ['project-004', 'project-005'],
  },
  {
    id: 'hook-004',
    category: 'hook',
    name: 'Kvačka, aluminij, 15 cm, debelina 5,0 mm',
    images: [],
    quantity: 1,
    unit: 'piece',
    createdAt: new Date('2024-11-10'),
    updatedAt: new Date('2025-01-12'),
    hookDetails: {
      brand: 'Prym',
      sizeMm: 5.0,
      handleType: 'standard',
      material: 'aluminum',
      store: 'Svet Metraže',
      purchaseDate: new Date('2024-11-10'),
      purchasePrice: 2.99,
      currency: 'EUR',
    },
    location: 'Škatla s kvačkami',
    usedInProjects: ['project-006'],
  },
  {
    id: 'hook-005',
    category: 'hook',
    name: 'Kvačka, aluminij, 15 cm, debelina 6,0 mm',
    images: [],
    quantity: 1,
    unit: 'piece',
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2025-01-10'),
    hookDetails: {
      brand: 'Prym',
      sizeMm: 6.0,
      handleType: 'standard',
      material: 'aluminum',
      store: 'Svet Metraže',
      purchaseDate: new Date('2024-12-01'),
      purchasePrice: 3.29,
      currency: 'EUR',
    },
    location: 'Škatla s kvačkami',
    usedInProjects: [],
  },
];

// =======================
// MOCK PROJECTS
// =======================

export const mockProjects: Project[] = [
  // PROJECT 1: Babičin kvadrat odeja (V teku)
  {
    id: 'project-001',
    title: 'Babičin kvadrat odeja',
    projectType: 'blanket',
    status: 'in-progress',
    images: [projectImages.grandmama],
    defaultImageIndex: 0,
    createdAt: new Date('2024-11-20'),
    updatedAt: new Date('2025-01-20'),
    startDate: new Date('2024-11-22'),
    yarnUsedIds: ['yarn-001', 'yarn-007'],
    hookUsedIds: ['hook-002'],
    notes: 'Delam 36 kvadratov v 6x6 postavitvi. Vsak kvadrat meri 15 cm.',
    workProgress: [
      {
        id: 'wp-001-1',
        date: new Date('2024-11-22'),
        notes: 'Začela s prvimi 5 kvadrati. Vzorec je enostaven!',
      },
      {
        id: 'wp-001-2',
        date: new Date('2024-12-15'),
        notes: 'Dokončanih 18 kvadratov - polovica!',
      },
      {
        id: 'wp-001-3',
        date: new Date('2025-01-15'),
        notes: '28 kvadratov končanih. Še 8 do cilja.',
      },
    ],
  },

  // PROJECT 2: Amigurumi zajček (Končano)
  {
    id: 'project-002',
    title: 'Amigurumi zajček',
    projectType: 'amigurumi',
    status: 'completed',
    images: [projectImages.bunny],
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2025-01-10'),
    startDate: new Date('2024-12-05'),
    completedDate: new Date('2025-01-10'),
    yarnUsedIds: ['yarn-002'],
    hookUsedIds: ['hook-001'],
    notes: 'Darilo za nečakinjo. Uporabila varnostne oči 12mm.',
    workProgress: [
      {
        id: 'wp-002-1',
        date: new Date('2024-12-05'),
        notes: 'Začela s telesom. Čarobni obroč dela odlično.',
      },
      {
        id: 'wp-002-2',
        date: new Date('2025-01-10'),
        notes: 'Končano! Dodala pentljo okoli vratu.',
      },
    ],
  },

  // PROJECT 3: Otroška odejica (Načrtovanje)
  {
    id: 'project-003',
    title: 'Otroška odejica',
    projectType: 'blanket',
    status: 'to-do',
    images: [],
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-20'),
    yarnUsedIds: ['yarn-001'],
    hookUsedIds: ['hook-002'],
    notes: 'Za kolegičino dojenčico. Ciljna velikost: 80x80 cm.',
  },

  // PROJECT 4: Pulover (V teku)
  {
    id: 'project-004',
    title: 'Zimski pulover',
    projectType: 'garment',
    status: 'in-progress',
    images: [projectImages.hat],
    createdAt: new Date('2024-12-10'),
    updatedAt: new Date('2025-01-18'),
    startDate: new Date('2024-12-15'),
    yarnUsedIds: ['yarn-004', 'yarn-007'],
    hookUsedIds: ['hook-003'],
    notes: 'Velikost M. Delam od spodaj navzgor.',
    workProgress: [
      {
        id: 'wp-004-1',
        date: new Date('2024-12-15'),
        notes: 'Začela hrbtni del.',
      },
      {
        id: 'wp-004-2',
        date: new Date('2025-01-10'),
        notes: 'Hrbtni del končan. Začenjam sprednji del.',
      },
    ],
  },

  // PROJECT 5: Torbica (Na čakanju)
  {
    id: 'project-005',
    title: 'Poletna torbica',
    projectType: 'accessory',
    status: 'on-hold',
    images: [projectImages.bag],
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date('2024-12-01'),
    startDate: new Date('2024-11-05'),
    yarnUsedIds: ['yarn-005'],
    hookUsedIds: ['hook-003'],
    notes: 'Približno 40% končano. Čakam na pomlad za nadaljevanje.',
  },

  // PROJECT 6: Šal (V teku)
  {
    id: 'project-006',
    title: 'Rdeč zimski šal',
    projectType: 'accessory',
    status: 'in-progress',
    images: [projectImages.shawl1, projectImages.shawl2],
    createdAt: new Date('2025-01-05'),
    updatedAt: new Date('2025-01-20'),
    startDate: new Date('2025-01-08'),
    yarnUsedIds: ['yarn-006'],
    hookUsedIds: ['hook-004'],
    notes: 'Enostaven vzorec z rebrami. Ciljna dolžina: 180 cm.',
    workProgress: [
      {
        id: 'wp-006-1',
        date: new Date('2025-01-08'),
        notes: 'Začela. Vzorec se hitro dela!',
      },
      {
        id: 'wp-006-2',
        date: new Date('2025-01-18'),
        notes: 'Dosežena polovica dolžine (90 cm).',
      },
    ],
  },
];

// =======================
// HELPER FUNCTIONS
// =======================

/**
 * Get all mock data in a single object
 */
export function getAllMockData() {
  return {
    user: mockUser,
    projects: mockProjects,
    inventory: mockInventory,
  };
}

/**
 * Get statistics about mock data
 */
export function getMockDataStats() {
  return {
    totalProjects: mockProjects.length,
    projectsByStatus: {
      'to-do': mockProjects.filter((p) => p.status === 'to-do').length,
      'in-progress': mockProjects.filter((p) => p.status === 'in-progress').length,
      'on-hold': mockProjects.filter((p) => p.status === 'on-hold').length,
      completed: mockProjects.filter((p) => p.status === 'completed').length,
      frogged: mockProjects.filter((p) => p.status === 'frogged').length,
    },
    totalInventory: mockInventory.length,
    inventoryByCategory: {
      yarn: mockInventory.filter((i) => i.category === 'yarn').length,
      hook: mockInventory.filter((i) => i.category === 'hook').length,
    },
  };
}
