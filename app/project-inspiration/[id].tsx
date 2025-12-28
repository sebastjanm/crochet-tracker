import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Plus, Trash2, Lightbulb } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ModalHeader } from '@/components/ModalHeader';
import { EmptyState } from '@/components/EmptyState';
import { LockedProFeature } from '@/components/LockedProFeature';
import { useProjects } from '@/providers/ProjectsProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useImagePicker } from '@/hooks/useImagePicker';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import type { InspirationSource } from '@/types';
import { normalizeBorder, buttonShadow } from '@/constants/pixelRatio';

export default function ProjectInspirationScreen() {
  const { id } = useLocalSearchParams();
  const { getProjectById, updateProject } = useProjects();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showImagePickerOptions } = useImagePicker();
  const project = getProjectById(id as string);

  if (!project) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('projects.projectNotFound')}</Text>
          <Button
            title={t('projects.goBack')}
            onPress={() => router.back()}
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const inspirationSources = project.inspirationSources || [];

  const handleAddInspiration = async () => {
    const newInspiration: InspirationSource = {
      id: Date.now().toString(),
      url: '',
      patternSource: '',
      description: '',
      images: [],
    };

    const updatedInspirationSources = [...inspirationSources, newInspiration];

    await updateProject(project.id, {
      inspirationSources: updatedInspirationSources,
    });
  };

  const handleUpdateInspiration = async (
    inspirationId: string,
    field: keyof InspirationSource,
    value: unknown
  ) => {
    const updatedInspirationSources = inspirationSources.map((source) =>
      source.id === inspirationId ? { ...source, [field]: value } : source
    );

    await updateProject(project.id, {
      inspirationSources: updatedInspirationSources,
    });
  };

  const handleDeleteInspiration = (inspirationId: string) => {
    Alert.alert(
      t('projects.deleteInspiration'),
      t('projects.deleteInspirationConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const updatedInspirationSources = inspirationSources.filter(
              (source) => source.id !== inspirationId
            );
            await updateProject(project.id, {
              inspirationSources:
                updatedInspirationSources.length > 0 ? updatedInspirationSources : undefined,
            });
          },
        },
      ]
    );
  };

  const handleAddInspirationImage = async (inspirationId: string) => {
    const uri = await showImagePickerOptions();
    if (uri) {
      const updatedInspirationSources = inspirationSources.map((source) =>
        source.id === inspirationId
          ? { ...source, images: [...(source.images || []), uri] }
          : source
      );

      await updateProject(project.id, {
        inspirationSources: updatedInspirationSources,
      });
    }
  };

  const handleRemoveInspirationImage = async (inspirationId: string, imageIndex: number) => {
    const updatedInspirationSources = inspirationSources.map((source) =>
      source.id === inspirationId
        ? { ...source, images: (source.images || []).filter((_, i) => i !== imageIndex) }
        : source
    );

    await updateProject(project.id, {
      inspirationSources: updatedInspirationSources,
    });
  };

  // Check if user is Pro
  const isPro = user?.isPro === true;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ModalHeader title={t('projects.inspiration')} />

      {!isPro ? (
        <LockedProFeature
          title={t('projects.inspirationIsProFeature')}
          description={t('projects.inspirationProDescription')}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddInspiration}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t('projects.addInspiration')}
          accessibilityHint={t('projects.addInspirationHint')}
        >
          <Plus size={20} color={Colors.white} />
          <Text style={styles.addButtonText}>{t('projects.addInspiration')}</Text>
        </TouchableOpacity>

        {inspirationSources.length === 0 ? (
          <EmptyState
            icon={<Lightbulb size={48} color={Colors.warmGray} />}
            title={t('projects.noInspirationSources')}
            description={t('projects.noInspirationSourcesDescription')}
          />
        ) : (
          inspirationSources.map((source, index) => (
            <View key={source.id} style={styles.inspirationCard}>
              <View style={styles.inspirationHeader}>
                <Text style={styles.inspirationTitle}>
                  {t('projects.inspirationSource')} {index + 1}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDeleteInspiration(source.id)}
                  style={styles.deleteButton}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.delete')}
                  accessibilityHint={t('projects.deleteThisInspiration')}
                >
                  <Trash2 size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>

              <Input
                label={t('projects.url')}
                placeholder={t('projects.urlPlaceholder')}
                value={source.url || ''}
                onChangeText={(value) => handleUpdateInspiration(source.id, 'url', value)}
              />

              <Input
                label={t('projects.patternSource')}
                placeholder={t('projects.patternSourcePlaceholder')}
                value={source.patternSource || ''}
                onChangeText={(value) =>
                  handleUpdateInspiration(source.id, 'patternSource', value)
                }
              />

              <Input
                label={t('projects.description')}
                placeholder={t('projects.descriptionPlaceholder')}
                value={source.description || ''}
                onChangeText={(value) =>
                  handleUpdateInspiration(source.id, 'description', value)
                }
                multiline
                numberOfLines={3}
                style={styles.textArea}
              />

              <View style={styles.imagesSection}>
                <Text style={styles.sectionLabel}>{t('projects.inspirationImages')}</Text>

                {source.images && source.images.length > 0 && (
                  <FlatList
                    data={source.images}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, idx) => `${source.id}-${idx}`}
                    renderItem={({ item, index: imageIndex }) => (
                      <View style={styles.imageContainer}>
                        <Image
                          source={{ uri: item }}
                          style={styles.imagePreview}
                          contentFit="cover"
                          transition={200}
                          cachePolicy="memory-disk"
                        />
                        <TouchableOpacity
                          style={styles.imageDeleteButton}
                          onPress={() => handleRemoveInspirationImage(source.id, imageIndex)}
                          activeOpacity={0.7}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={t('common.delete')}
                          accessibilityHint={t('projects.removeThisPhoto')}
                        >
                          <Trash2 size={16} color={Colors.white} />
                        </TouchableOpacity>
                      </View>
                    )}
                    ListFooterComponent={
                      <TouchableOpacity
                        style={styles.addImageButton}
                        onPress={() => handleAddInspirationImage(source.id)}
                        activeOpacity={0.7}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={t('projects.addPhoto')}
                        accessibilityHint="Choose from camera or gallery"
                      >
                        <Plus size={24} color={Colors.sage} />
                        <Text style={styles.addImageText}>{t('common.add')}</Text>
                      </TouchableOpacity>
                    }
                    contentContainerStyle={styles.imageList}
                  />
                )}

                {(!source.images || source.images.length === 0) && (
                  <TouchableOpacity
                    style={styles.addPhotoButton}
                    onPress={() => handleAddInspirationImage(source.id)}
                    activeOpacity={0.7}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={t('projects.addPhoto')}
                    accessibilityHint="Choose to take a photo or select from gallery"
                  >
                    <Plus size={32} color={Colors.sage} />
                    <Text style={styles.addPhotoButtonText}>{t('projects.addPhoto')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scrollContent: {
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    ...Typography.title2,
    color: Colors.charcoal,
    marginBottom: 16,
  },
  errorButton: {
    minWidth: 120,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.sage,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    minHeight: 50,
    ...Platform.select({
      ...buttonShadow,
      default: {},
    }),
  },
  addButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600' as const,
    fontSize: 16,
  },
  inspirationCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.sage,
    ...Platform.select({
      ...buttonShadow,
      default: {},
    }),
  },
  inspirationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inspirationTitle: {
    ...Typography.title3,
    color: Colors.sage,
    fontWeight: '600' as const,
    fontSize: 16,
  },
  deleteButton: {
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  imagesSection: {
    marginTop: 12,
  },
  sectionLabel: {
    ...Typography.body,
    color: Colors.charcoal,
    marginBottom: 8,
    fontWeight: '500' as const,
  },
  imageList: {
    paddingVertical: 12,
    gap: 12,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: Colors.warmGray,
  },
  imageDeleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.error,
    borderRadius: 12,
    padding: 8,
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: normalizeBorder(2),
    borderColor: Colors.sage,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    gap: 4,
  },
  addImageText: {
    ...Typography.caption,
    color: Colors.sage,
    fontWeight: '600' as const,
  },
  addPhotoButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: normalizeBorder(2),
    borderColor: Colors.sage,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 100,
  },
  addPhotoButtonText: {
    ...Typography.body,
    color: Colors.sage,
    fontWeight: '600' as const,
    fontSize: 16,
  },
});
