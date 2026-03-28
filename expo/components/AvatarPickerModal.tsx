import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { CUTE_AVATARS, AvatarStyle } from '@/constants/avatars';
import { useLanguage } from '@/providers/LanguageProvider';

interface AvatarPickerModalProps {
  visible: boolean;
  onClose: () => void;
  currentAvatar?: string;
  onSelectAvatar: (avatarName: string) => void;
}

export function AvatarPickerModal({
  visible,
  onClose,
  currentAvatar,
  onSelectAvatar,
}: AvatarPickerModalProps) {
  const { t } = useLanguage();

  const handleSelect = (avatar: AvatarStyle) => {
    onSelectAvatar(avatar.name);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.headerSpacer} />
          <Text style={styles.modalTitle}>{t('profile.chooseAvatar')}</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color={Colors.charcoal} />
          </TouchableOpacity>
        </View>

        {/* Avatar Grid */}
        <ScrollView
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {CUTE_AVATARS.map((avatar) => {
              const isSelected = currentAvatar === avatar.name;
              return (
                <TouchableOpacity
                  key={avatar.name}
                  style={[
                    styles.avatarItem,
                    isSelected && styles.avatarItemSelected,
                  ]}
                  onPress={() => handleSelect(avatar)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${avatar.name} avatar`}
                >
                  <View
                    style={[
                      styles.avatarCircle,
                      { backgroundColor: avatar.backgroundColor },
                    ]}
                  >
                    <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <Check size={12} color={Colors.white} strokeWidth={3} />
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.avatarName,
                      isSelected && styles.avatarNameSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {avatar.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  headerSpacer: {
    width: 44,
  },
  modalTitle: {
    ...Typography.title3,
    color: Colors.charcoal,
    fontWeight: '600',
    textAlign: 'center',
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12,
  },
  avatarItem: {
    width: '22%',
    aspectRatio: 0.85,
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarItemSelected: {
    borderColor: Colors.sage,
    backgroundColor: Colors.beige,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.sage,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  avatarName: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontSize: 11,
    textAlign: 'center',
  },
  avatarNameSelected: {
    color: Colors.charcoal,
    fontWeight: '600',
  },
});
