import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
  Modal,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import ImageViewer from 'react-native-image-zoom-viewer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Link2,
  ImagePlus,
  Trash2,
  Lightbulb,
  Youtube,
  Globe,
  X,
  Pencil,
} from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ModalHeader } from '@/components/ModalHeader';
import { EmptyState } from '@/components/EmptyState';
import { LockedProFeature } from '@/components/LockedProFeature';
import { useProjects } from '@/providers/ProjectsProvider';
import { useLanguage } from '@/providers/LanguageProvider';
// TODO: Re-enable when subscription system is ready: import { useAuth } from '@/providers/AuthProvider';
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
  // TODO: Re-enable when subscription system is ready: const { user } = useAuth();
  const { showImagePickerOptionsMultiple } = useImagePicker();
  const project = getProjectById(id as string);

  // Bottom sheet states
  const [showLinkSheet, setShowLinkSheet] = useState(false);
  const [showImageSheet, setShowImageSheet] = useState(false);

  // Link form state
  const [linkUrl, setLinkUrl] = useState('');
  const [linkNotes, setLinkNotes] = useState('');

  // Image form state (for edit mode)
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  // Edit mode state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLinkUrl, setEditLinkUrl] = useState('');
  const [editLinkNotes, setEditLinkNotes] = useState('');
  const [editImageNotes, setEditImageNotes] = useState('');

  // Full-size image viewer
  const [fullSizeImages, setFullSizeImages] = useState<string[]>([]);
  const [fullSizeCurrentIndex, setFullSizeCurrentIndex] = useState(0);
  const lastTapRef = useRef<number>(0);

  if (!project) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ModalHeader title={t('projects.inspiration')} />
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
   * Open the Add Link bottom sheet
   */
  const handleOpenLinkSheet = () => {
    setLinkUrl('');
    setLinkNotes('');
    setShowLinkSheet(true);
  };

  /**
   * Save link from bottom sheet
   */
  const handleSaveLink = async () => {
    if (!linkUrl.trim()) {
      return; // Don't save empty URLs
    }

    const newInspiration: InspirationSource = {
      id: Date.now().toString(),
      type: 'link',
      url: linkUrl.trim(),
      description: linkNotes.trim() || undefined,
    };

    const updatedInspirationSources = [...inspirationSources, newInspiration];

    await updateProject(project.id, {
      inspirationSources: updatedInspirationSources,
    });

    setShowLinkSheet(false);
    setLinkUrl('');
    setLinkNotes('');
  };

  /**
   * Pick images and save directly as new inspiration (no bottom sheet)
   */
  const handleAddImages = async () => {
    const result = await showImagePickerOptionsMultiple();
    if (result.success && result.data.length > 0) {
      const newInspiration: InspirationSource = {
        id: Date.now().toString(),
        type: 'image',
        images: result.data,
      };

      const updatedInspirationSources = [...inspirationSources, newInspiration];

      await updateProject(project.id, {
        inspirationSources: updatedInspirationSources,
      });
    }
  };

  /**
   * Add more images while in the image bottom sheet (edit mode)
   */
  const handleAddMoreToSheet = async () => {
    const result = await showImagePickerOptionsMultiple();
    if (result.success && result.data.length > 0) {
      setSelectedImages((prev) => [...prev, ...result.data]);
    }
  };

  /**
   * Remove image from sheet selection
   */
  const handleRemoveFromSheet = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Open edit sheet for a link
   */
  const handleEditLink = (source: InspirationSource) => {
    setEditingId(source.id);
    setEditLinkUrl(source.url || '');
    setEditLinkNotes(source.description || '');
    setShowLinkSheet(true);
  };

  /**
   * Open edit sheet for images (notes only)
   */
  const handleEditImages = (source: InspirationSource) => {
    setEditingId(source.id);
    setEditImageNotes(source.description || '');
    setShowImageSheet(true);
    setSelectedImages(source.images || []);
  };

  /**
   * Save edited link
   */
  const handleSaveEditedLink = async () => {
    if (!editingId || !editLinkUrl.trim()) return;

    const updatedInspirationSources = inspirationSources.map((source) =>
      source.id === editingId
        ? { ...source, url: editLinkUrl.trim(), description: editLinkNotes.trim() || undefined }
        : source
    );

    await updateProject(project.id, {
      inspirationSources: updatedInspirationSources,
    });

    setShowLinkSheet(false);
    setEditingId(null);
    setEditLinkUrl('');
    setEditLinkNotes('');
  };

  /**
   * Save edited image notes
   */
  const handleSaveEditedImages = async () => {
    if (!editingId) return;

    const updatedInspirationSources = inspirationSources.map((source) =>
      source.id === editingId
        ? { ...source, images: selectedImages, description: editImageNotes.trim() || undefined }
        : source
    );

    await updateProject(project.id, {
      inspirationSources: updatedInspirationSources,
    });

    setShowImageSheet(false);
    setEditingId(null);
    setSelectedImages([]);
    setEditImageNotes('');
  };

  /**
   * Close edit sheet and reset
   */
  const handleCloseSheet = () => {
    setShowLinkSheet(false);
    setShowImageSheet(false);
    setEditingId(null);
    setLinkUrl('');
    setLinkNotes('');
    setSelectedImages([]);
    setEditLinkUrl('');
    setEditLinkNotes('');
    setEditImageNotes('');
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

  const handleOpenUrl = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert(t('common.error'), t('projects.cannotOpenUrl'));
      });
    }
  };

  /**
   * Handle double-tap on image to view full size gallery
   */
  const handleImageDoubleTap = (images: string[], tappedIndex: number) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected - open gallery
      setFullSizeImages(images);
      setFullSizeCurrentIndex(tappedIndex);
    }
    lastTapRef.current = now;
  };

  // Pro features available to all users until IAP is implemented
  // TODO: Re-enable when subscription system is ready: const isPro = user?.isPro === true;
  const isPro = true;

  /**
   * Render a LINK type inspiration card (read-only display)
   */
  const renderLinkCard = (source: InspirationSource, index: number) => {
    const urlType = getUrlType(source.url || '');
    const UrlIcon = urlType === 'youtube' ? Youtube : Globe;

    return (
      <View key={source.id} style={styles.inspirationCard}>
        {/* Notes above URL */}
        {source.description && (
          <Text style={styles.cardNotesTop}>{source.description}</Text>
        )}

        {/* Row with URL and actions */}
        <View style={styles.cardRow}>
          {/* Clickable URL */}
          {source.url && (
            <TouchableOpacity
              style={styles.linkUrlContainer}
              onPress={() => handleOpenUrl(source.url!)}
              activeOpacity={0.7}
            >
              <UrlIcon size={18} color={Colors.teal} />
              <Text style={styles.linkUrlText} numberOfLines={1}>
                {source.url}
              </Text>
            </TouchableOpacity>
          )}

          {/* Inline action icons - horizontal for links */}
          <View style={styles.cardActionsRow}>
            <TouchableOpacity
              onPress={() => handleEditLink(source)}
              style={styles.cardIconButton}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('common.edit')}
            >
              <Pencil size={16} color={Colors.warmGray} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDeleteInspiration(source.id)}
              style={styles.cardIconButton}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('common.delete')}
            >
              <Trash2 size={16} color={Colors.warmGray} />
            </TouchableOpacity>
          </View>
        </View>
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
        {/* Row with images and actions */}
        <View style={styles.cardRow}>
          <View style={styles.imagesSection}>
            <FlashList
              data={images}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, idx) => `${source.id}-${idx}`}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => handleImageDoubleTap(images, index)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: item }}
                    style={styles.imagePreview}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.imageList}
            />
          </View>

          {/* Inline action icons */}
          <View style={styles.cardActionsInline}>
            <TouchableOpacity
              onPress={() => handleEditImages(source)}
              style={styles.cardIconButton}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('common.edit')}
            >
              <Pencil size={16} color={Colors.warmGray} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDeleteInspiration(source.id)}
              style={styles.cardIconButton}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('common.delete')}
            >
              <Trash2 size={16} color={Colors.warmGray} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes (if any) */}
        {source.description && (
          <Text style={styles.cardNotes}>{source.description}</Text>
        )}
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
              onPress={handleOpenLinkSheet}
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

      {/* Add/Edit Link Bottom Sheet */}
      <Modal
        visible={showLinkSheet}
        transparent
        animationType="slide"
        onRequestClose={handleCloseSheet}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetKeyboardView}
        >
          <Pressable
            style={styles.sheetOverlay}
            onPress={handleCloseSheet}
          >
            <Pressable style={styles.sheetContent} onPress={() => {}}>
              {/* Drag handle */}
              <View style={styles.sheetHandle} />

              {/* Header */}
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>
                  {editingId ? t('common.edit') : t('projects.addLink')}
                </Text>
                <TouchableOpacity
                  onPress={handleCloseSheet}
                  style={styles.sheetCloseButton}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.close')}
                >
                  <X size={24} color={Colors.charcoal} />
                </TouchableOpacity>
              </View>

              {/* Form */}
              <View style={styles.sheetForm}>
                <Input
                  label={t('projects.url')}
                  placeholder={t('projects.urlPlaceholderLink')}
                  value={editingId ? editLinkUrl : linkUrl}
                  onChangeText={editingId ? setEditLinkUrl : setLinkUrl}
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus={!editingId}
                />

                <Input
                  label={t('projects.notesOptional')}
                  placeholder={t('projects.notesPlaceholder')}
                  value={editingId ? editLinkNotes : linkNotes}
                  onChangeText={editingId ? setEditLinkNotes : setLinkNotes}
                  multiline
                  numberOfLines={2}
                  style={styles.sheetTextArea}
                />
              </View>

              {/* Actions */}
              <View style={styles.sheetActions}>
                <TouchableOpacity
                  style={styles.sheetCancelButton}
                  onPress={handleCloseSheet}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sheetCancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sheetSaveButton,
                    !(editingId ? editLinkUrl.trim() : linkUrl.trim()) && styles.sheetSaveButtonDisabled,
                  ]}
                  onPress={editingId ? handleSaveEditedLink : handleSaveLink}
                  activeOpacity={0.7}
                  disabled={!(editingId ? editLinkUrl.trim() : linkUrl.trim())}
                >
                  <Text style={styles.sheetSaveText}>
                    {editingId ? t('common.save') : t('projects.addLink')}
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Images Bottom Sheet */}
      <Modal
        visible={showImageSheet}
        transparent
        animationType="slide"
        onRequestClose={handleCloseSheet}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetKeyboardView}
        >
          <Pressable style={styles.sheetOverlay} onPress={handleCloseSheet}>
            <Pressable style={styles.sheetContent} onPress={() => {}}>
              {/* Drag handle */}
              <View style={styles.sheetHandle} />

              {/* Header */}
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{t('common.edit')}</Text>
                <TouchableOpacity
                  onPress={handleCloseSheet}
                  style={styles.sheetCloseButton}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.close')}
                >
                  <X size={24} color={Colors.charcoal} />
                </TouchableOpacity>
              </View>

              {/* Images grid */}
              <View style={styles.sheetImagesGrid}>
                {selectedImages.map((item, index) => {
                  // Dynamic width: 1 img = 50%, 2 imgs = 47%, 3+ = 31%
                  const imageWidth = selectedImages.length === 1 ? '50%'
                    : selectedImages.length === 2 ? '47%'
                    : '31%';
                  return (
                    <View key={`sheet-img-${index}`} style={[styles.sheetGridImageContainer, { width: imageWidth }]}>
                      <Image
                        source={{ uri: item }}
                        style={styles.sheetGridImage}
                        contentFit="cover"
                      />
                      <TouchableOpacity
                        style={styles.sheetImageDeleteButton}
                        onPress={() => handleRemoveFromSheet(index)}
                        activeOpacity={0.7}
                      >
                        <X size={14} color={Colors.white} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
                <TouchableOpacity
                  style={[
                    styles.sheetGridAddButton,
                    { width: selectedImages.length === 0 ? '50%'
                        : selectedImages.length === 1 ? '47%'
                        : selectedImages.length === 2 ? '31%'
                        : '31%' }
                  ]}
                  onPress={handleAddMoreToSheet}
                  activeOpacity={0.7}
                >
                  <ImagePlus size={24} color={Colors.sage} />
                </TouchableOpacity>
              </View>

              {/* Notes */}
              <View style={styles.sheetForm}>
                <Input
                  label={t('projects.notesOptional')}
                  placeholder={t('projects.imageNotesPlaceholder')}
                  value={editImageNotes}
                  onChangeText={setEditImageNotes}
                  multiline
                  numberOfLines={2}
                  style={styles.sheetTextArea}
                />
              </View>

              {/* Actions */}
              <View style={styles.sheetActions}>
                <TouchableOpacity
                  style={styles.sheetCancelButton}
                  onPress={handleCloseSheet}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sheetCancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sheetSaveButton,
                    selectedImages.length === 0 && styles.sheetSaveButtonDisabled,
                  ]}
                  onPress={handleSaveEditedImages}
                  activeOpacity={0.7}
                  disabled={selectedImages.length === 0}
                >
                  <Text style={styles.sheetSaveText}>{t('common.save')}</Text>
                </TouchableOpacity>
            </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Full-size Image Gallery Modal with Zoom */}
      <Modal
        visible={fullSizeImages.length > 0}
        transparent
        animationType="fade"
        onRequestClose={() => setFullSizeImages([])}
      >
        <ImageViewer
          imageUrls={fullSizeImages.map((url) => ({ url }))}
          index={fullSizeCurrentIndex}
          onChange={(index) => index !== undefined && setFullSizeCurrentIndex(index)}
          onSwipeDown={() => setFullSizeImages([])}
          enableSwipeDown
          backgroundColor="rgba(0, 0, 0, 0.95)"
          renderIndicator={(currentIndex, allSize) =>
            allSize && allSize > 1 ? (
              <View style={styles.pageIndicator}>
                <Text style={styles.pageIndicatorText}>
                  {currentIndex} / {allSize}
                </Text>
              </View>
            ) : (
              <></>
            )
          }
          renderHeader={() => (
            <TouchableOpacity
              style={styles.fullImageCloseButton}
              onPress={() => setFullSizeImages([])}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
            >
              <X size={24} color={Colors.white} />
            </TouchableOpacity>
          )}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
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
    backgroundColor: Colors.deepSage,
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
    padding: 10,
    marginBottom: 10,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.border,
    ...Platform.select({
      ...buttonShadow,
      default: {},
    }),
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardActionsInline: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 8,
    borderLeftWidth: normalizeBorder(1),
    borderLeftColor: Colors.border,
    flexShrink: 0,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  cardIconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: Colors.cream,
  },

  // Link card specific - read-only display
  linkUrlContainer: {
    flex: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  linkUrlText: {
    ...Typography.body,
    color: Colors.teal,
    flex: 1,
    fontSize: 14,
  },
  cardNotes: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 14,
    fontWeight: '500' as const,
    marginTop: 8,
    lineHeight: 20,
  },
  cardNotesTop: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 14,
    fontWeight: '500' as const,
    marginBottom: 6,
    lineHeight: 20,
  },

  // Full-size image viewer
  fullImageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImageCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  pageIndicator: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  pageIndicatorText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500' as const,
  },

  // Text areas
  textAreaSmall: {
    height: 60,
    textAlignVertical: 'top',
    paddingTop: 12,
  },

  // Images section
  imagesSection: {
    flex: 1,
  },
  imageList: {
    paddingVertical: 4,
    gap: 8,
  },
  imagePreview: {
    width: 88,
    height: 88,
    borderRadius: 10,
    backgroundColor: Colors.warmGray,
    marginRight: 8,
  },

  // Bottom Sheet styles
  sheetKeyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: normalizeBorder(1),
    borderBottomColor: Colors.border,
  },
  sheetTitle: {
    ...Typography.title2,
    color: Colors.charcoal,
  },
  sheetCloseButton: {
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetForm: {
    padding: 16,
    gap: 8,
  },
  sheetTextArea: {
    height: 60,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sheetCancelButton: {
    flex: 1,
    backgroundColor: Colors.cream,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelText: {
    ...Typography.body,
    color: Colors.charcoal,
    fontWeight: '600' as const,
  },
  sheetSaveButton: {
    flex: 1,
    backgroundColor: Colors.deepSage,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSaveButtonDisabled: {
    opacity: 0.5,
  },
  sheetSaveText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600' as const,
  },

  // Image sheet specific - 3 column grid
  sheetImagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  sheetGridImageContainer: {
    position: 'relative',
    aspectRatio: 1,
  },
  sheetGridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: Colors.warmGray,
  },
  sheetGridAddButton: {
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: normalizeBorder(2),
    borderColor: Colors.sage,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  sheetImageDeleteButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
