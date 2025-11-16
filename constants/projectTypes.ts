import { ProjectType } from '@/types';
import Colors from './colors';

export interface ProjectTypeConfig {
  label: string;
  icon: string; // Lucide icon name
  color: string;
}

export const PROJECT_TYPE_CONFIGS: Record<ProjectType, ProjectTypeConfig> = {
  blanket: {
    label: 'Blanket',
    icon: 'Bed',
    color: Colors.teal,
  },
  amigurumi: {
    label: 'Amigurumi',
    icon: 'Smile',
    color: '#FFB84D', // Warm yellow
  },
  garment: {
    label: 'Garment',
    icon: 'Shirt',
    color: Colors.sage,
  },
  accessory: {
    label: 'Accessory',
    icon: 'Sparkles',
    color: Colors.terracotta,
  },
  'home-decor': {
    label: 'Home Decor',
    icon: 'Home',
    color: Colors.deepSage,
  },
  toy: {
    label: 'Toy',
    icon: 'Heart',
    color: '#9C27B0', // Purple
  },
  other: {
    label: 'Other',
    icon: 'MoreHorizontal',
    color: Colors.warmGray,
  },
};

// Helper function to get config for a project type
export function getProjectTypeConfig(type: ProjectType): ProjectTypeConfig {
  return PROJECT_TYPE_CONFIGS[type];
}

// Helper function to get all project type options for select dropdown
export function getProjectTypeOptions(): Array<{ value: ProjectType; label: string }> {
  return Object.entries(PROJECT_TYPE_CONFIGS).map(([value, config]) => ({
    value: value as ProjectType,
    label: config.label,
  }));
}
