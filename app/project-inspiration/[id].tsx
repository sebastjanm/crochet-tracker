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
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Link2,
  ImagePlus,
  Trash2,
  Lightbulb,
  ExternalLink,
  Youtube,
  Globe,
} from 'lucide-react-native';
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

/**
 * Helper to detect URL type for icon display
 */
function getUrlType(url: string): 'youtube' | 'generic' {
  if (!url) return 'generic';
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return 'youtube';
  }
  return 'generic';
}

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

  /**
   * Add a new LINK inspiration source
   */
  const handleAddLink = async () => {
    const newInspiration: InspirationSource = {
      id: Date.now().toString(),
      type: 'link',
      url: '',
      description: '',
    };

    const updatedInspirationSources = [...inspirationSources, newInspiration];

    await updateProject(project.id, {
      inspirationSources: updatedInspirationSources,
    });
  };

  /**
   * Add a new IMAGE inspiration source - opens picker immediately
   */
  const handleAddImages = async () => {
    const result = await showImagePickerOptions();
    if (result.success && result.data) {
      const uri = result.data;
      const newInspiration: InspirationSource = {
        id: Date.now().toString(),
        type: 'image',
        images: [uri],
        description: '',
      };

      const updatedInspirationSources = [...inspirationSources, newInspiration];

      await updateProject(project.id, {
        inspirationSources: updatedInspirationSources,
      });
    }
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

  const handleAddMoreImages = async (inspirationId: string) => {
    const result = await showImagePickerOptions();
    if (result.success && result.data) {
      const uri = result.data;
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

  const handleRemoveImage = async (inspirationId: string, imageIndex: number) => {
    const updatedInspirationSources = inspirationSources.map((source) =>
      source.id === inspirationId
        ? { ...source, images: (source.images || []).filter((_, i) => i !== imageIndex) }
        : source
    );

    await updateProject(project.id, {
      inspirationSources: updatedInspirationSources,
    });
  };

  const handleOpenUrl = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert(t('common.error'), t('projects.cannotOpenUrl'));
      });
    }
  };

  // Check if user is Pro
  const isPro = user?.isPro === true;

  /**
   * Render a LINK type inspiration card
   */
  const renderLinkCard = (source: InspirationSource, index: number) => {
    const urlType = getUrlType(source.url || '');
    const UrlIcon = urlType === 'youtube' ? Youtube : Globe;

    return (
      <View key={source.id} style={styles.inspirationCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTypeIndicator}>
            <Link2 size={16} color={Colors.teal} />
            <Text style={styles.cardTypeLabel}>{t('projects.linkSource')}</Text>
          </View>
          <TouchableOpacity
            onPress={() => handleDeleteInspiration(source.id)}
            style={styles.deleteButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('common.delete')}
          >
            <Trash2 size={18} color={Colors.error} />
          </TouchableOpacity>
        </View>

        <Input
          label={t('projects.url')}
          placeholder={t('projects.urlPlaceholderLink')}
          value={source.url || ''}
          onChangeText={(value) => handleUpdateInspiration(source.id, 'url', value)}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {source.url && (
          <TouchableOpacity
            style={styles.openLinkButton}
            onPress={() => handleOpenUrl(source.url!)}
            activeOpacity={0.7}
          >
            <UrlIcon size={16} color={Colors.teal} />
            <Text style={styles.openLinkText} numberOfLines={1}>
              {source.url}
            </Text>
            <ExternalLink size={14} color={Colors.teal} />
          </TouchableOpacity>
        )}

        <Input
          label={t('projects.notesOptional')}
          placeholder={t('projects.notesPlaceholder')}
          value={source.description || ''}
          onChangeText={(value) => handleUpdateInspiration(source.id, 'description', value)}
          multiline
          numberOfLines={2}
          style={styles.textAreaSmall}
        />
      </View>
    );
  };

  /**
   * Render an IMAGE type inspiration card
   */
  const renderImageCard = (source: InspirationSource, index: number) => {
    const images = source.images || [];

    return (
      <View key={source.id} style={styles.inspirationCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTypeIndicator}>
            <ImagePlus size={16} color={Colors.sage} />
            <Text style={[styles.cardTypeLabel, { color: Colors.sage }]}>
              {t('projects.imageSource')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleDeleteInspiration(source.id)}
            style={styles.deleteButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('common.delete')}
          >
            <Trash2 size={18} color={Colors.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.imagesSection}>
          <FlatList
            data={images}
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
                  onPress={() => handleRemoveImage(source.id, imageIndex)}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.delete')}
                >
                  <Trash2 size={14} color={Colors.white} />
                </TouchableOpacity>
              </View>
            )}
            ListFooterComponent={
              <TouchableOpacity
                style={styles.addMoreImageButton}
                onPress={() => handleAddMoreImages(source.id)}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('projects.addMorePhotos')}
              >
                <ImagePlus size={24} color={Colors.sage} />
              </TouchableOpacity>
            }
            contentContainerStyle={styles.imageList}
          />
        </View>

        <Input
          label={t('projects.notesOptional')}
          placeholder={t('projects.imageNotesPlaceholder')}
          value={source.description || ''}
          onChangeText={(value) => handleUpdateInspiration(source.id, 'description', value)}
          multiline
          numberOfLines={2}
          style={styles.textAreaSmall}
        />
      </View>
    );
  };

  /**
   * Render inspiration card based on type
   */
  const renderInspirationCard = (source: InspirationSource, index: number) => {
    if (source.type === 'link') {
      return renderLinkCard(source, index);
    }
    return renderImageCard(source, index);
  };

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
          {/* Two separate action buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.linkButton]}
              onPress={handleAddLink}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('projects.addLink')}
              accessibilityHint={t('projects.addLinkHint')}
            >
              <Link2 size={20} color={Colors.white} />
              <Text style={styles.actionButtonText}>{t('projects.addLink')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.imageButton]}
              onPress={handleAddImages}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('projects.addImages')}
              accessibilityHint={t('projects.addImagesHint')}
            >
              <ImagePlus size={20} color={Colors.white} />
              <Text style={styles.actionButtonText}>{t('projects.addImages')}</Text>
            </TouchableOpacity>
          </View>

          {inspirationSources.length === 0 ? (
            <EmptyState
              icon={<Lightbulb size={48} color={Colors.warmGray} />}
              title={t('projects.noInspirationSources')}
              description={t('projects.noInspirationSourcesDescriptionNew')}
            />
          ) : (
            inspirationSources.map((source, index) => renderInspirationCard(source, index))
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
    paddingBottom: 32,
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

  // Action buttons row
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 50,
    ...Platform.select({
      ...buttonShadow,
      default: {},
    }),
  },
  linkButton: {
    backgroundColor: Colors.teal,
  },
  imageButton: {
    backgroundColor: Colors.sage,
  },
  actionButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600' as const,
    fontSize: 15,
  },

  // Inspiration cards
  inspirationCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.border,
    ...Platform.select({
      ...buttonShadow,
      default: {},
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTypeLabel: {
    ...Typography.caption,
    color: Colors.teal,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteButton: {
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Link card specific
  openLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.cream,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  openLinkText: {
    ...Typography.caption,
    color: Colors.teal,
    flex: 1,
  },

  // Text areas
  textAreaSmall: {
    height: 60,
    textAlignVertical: 'top',
    paddingTop: 12,
  },

  // Images section
  imagesSection: {
    marginBottom: 12,
  },
  imageList: {
    paddingVertical: 8,
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
    top: 6,
    right: 6,
    backgroundColor: Colors.error,
    borderRadius: 10,
    padding: 6,
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoreImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: normalizeBorder(2),
    borderColor: Colors.sage,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
});
