import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '@/hooks/language-context';

interface ImageActionOptions {
  canSetDefault?: boolean;
  isDefault?: boolean;
  canViewFullSize?: boolean;
  viewFullSizeType?: 'image' | 'material'; // Determines which translation key to use
  onSetDefault?: () => void;
  onRemoveDefault?: () => void;
  onDelete?: () => void;
  onRemoveFromProject?: () => void;
  onViewFullSize?: () => void;
}

export function useImageActions() {
  const { t } = useLanguage();

  const showImageActions = (options: ImageActionOptions) => {
    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const buttons: { text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }[] = [];

    // Add default/remove default option
    if (options.canSetDefault) {
      if (options.isDefault && options.onRemoveDefault) {
        buttons.push({
          text: t('imageActions.removeDefault'),
          onPress: options.onRemoveDefault,
        });
      } else if (!options.isDefault && options.onSetDefault) {
        buttons.push({
          text: t('imageActions.setAsDefault'),
          onPress: options.onSetDefault,
        });
      }
    }

    // Add view full size option
    if (options.canViewFullSize && options.onViewFullSize) {
      const translationKey = options.viewFullSizeType === 'image'
        ? 'imageActions.viewImage'
        : 'imageActions.viewFullSize';
      buttons.push({
        text: t(translationKey),
        onPress: options.onViewFullSize,
      });
    }

    // Add remove from project option (if provided)
    if (options.onRemoveFromProject) {
      buttons.push({
        text: t('imageActions.removeFromProject'),
        onPress: options.onRemoveFromProject,
        style: 'destructive',
      });
    }

    // Add delete option (if provided)
    if (options.onDelete) {
      buttons.push({
        text: t('imageActions.delete'),
        onPress: options.onDelete,
        style: 'destructive',
      });
    }

    // Add cancel
    buttons.push({
      text: t('common.cancel'),
      style: 'cancel',
    });

    Alert.alert(
      t('imageActions.title'),
      undefined,
      buttons
    );
  };

  return { showImageActions };
}
