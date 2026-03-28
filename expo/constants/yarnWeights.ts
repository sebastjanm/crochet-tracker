import type { YarnWeightName } from '@/types';

export interface YarnWeightOption {
  name: YarnWeightName;
  i18nKey: string;
  descKey: string; // Translation key for description
  weight: number; // CYC standard weight number (0-7)
  ply?: string; // UK/AU ply reference
}

// Standard CYC (Craft Yarn Council) weight system
export const YARN_WEIGHTS: YarnWeightOption[] = [
  { name: 'Lace', i18nKey: 'yarnWeights.Lace', descKey: 'yarnWeightDesc.Lace', weight: 0, ply: '2-ply' },
  { name: 'Light Fingering', i18nKey: 'yarnWeights.Light Fingering', descKey: 'yarnWeightDesc.Light Fingering', weight: 1, ply: '3-ply' },
  { name: 'Fingering', i18nKey: 'yarnWeights.Fingering', descKey: 'yarnWeightDesc.Fingering', weight: 1, ply: '4-ply' },
  { name: 'Sport', i18nKey: 'yarnWeights.Sport', descKey: 'yarnWeightDesc.Sport', weight: 2, ply: '5-ply' },
  { name: 'DK', i18nKey: 'yarnWeights.DK', descKey: 'yarnWeightDesc.DK', weight: 3, ply: '8-ply' },
  { name: 'Worsted', i18nKey: 'yarnWeights.Worsted', descKey: 'yarnWeightDesc.Worsted', weight: 4, ply: '10-ply' },
  { name: 'Aran', i18nKey: 'yarnWeights.Aran', descKey: 'yarnWeightDesc.Aran', weight: 4, ply: '10-ply' },
  { name: 'Bulky', i18nKey: 'yarnWeights.Bulky', descKey: 'yarnWeightDesc.Bulky', weight: 5, ply: '12-ply' },
  { name: 'Super Bulky', i18nKey: 'yarnWeights.Super Bulky', descKey: 'yarnWeightDesc.Super Bulky', weight: 6, ply: '14-ply' },
  { name: 'Jumbo', i18nKey: 'yarnWeights.Jumbo', descKey: 'yarnWeightDesc.Jumbo', weight: 7, ply: '16-ply+' },
];

export function getWeightByName(name: string): YarnWeightOption | undefined {
  return YARN_WEIGHTS.find((w) => w.name === name);
}
