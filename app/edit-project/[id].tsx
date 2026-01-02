import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Lightbulb, Clock, CheckCircle, Star, Trash2, PauseCircle, RotateCcw, FileText, Link } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { MaterialPickerModal } from '@/components/MaterialPickerModal';
import { SelectedMaterialsPreview } from '@/components/SelectedMaterialsPreview';
import { DatePicker } from '@/components/DatePicker';
import { ModalHeader } from '@/components/ModalHeader';
import { SectionHeaderWithAdd } from '@/components/SectionHeaderWithAdd';
import { FullscreenImageModal } from '@/components/FullscreenImageModal';
import { useProjects } from '@/providers/ProjectsProvider';
import { useInventory } from '@/providers/InventoryProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useImagePicker } from '@/hooks/useImagePicker';
import { useImageActions } from '@/hooks/useImageActions';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import {
  clearProjectDraft,
  getProjectDraft,
  saveFormAsDraft,
  consumeNewlyCreatedInventory,
} from '@/lib/legend-state';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { normalizeBorder, buttonShadow } from '@/constants/pixelRatio';
import { ProjectStatus, ProjectType, ProjectImage, ProjectYarn, getImageSource } from '@/types';
import { getProjectTypeOptions } from '@/constants/projectTypes';

/**
 * EditProjectScreen - Edit form for existing projects.
 * Supports photos, materials, patterns, and status updates.
 */
export default function EditProjectScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams();
  const { getProjectById, updateProject } = useProjects();
  const { items: inventory } = useInventory();
  const { t } = useLanguage();
  const { pickImagesFromGallery, takePhotoWithCamera } = useImagePicker();
  const { showImageActions } = useImageActions();
  const project = getProjectById(id as string);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [inspirationUrl, setInspirationUrl] = useState('');
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [defaultImageIndex, setDefaultImageIndex] = useState<number>(0);
  const [patternImages, setPatternImages] = useState<string[]>([]);
  const [patternPdf, setPatternPdf] = useState<string>('');
  const [patternUrl, setPatternUrl] = useState<string>('');
  const [status, setStatus] = useState<ProjectStatus>('to-do');
  const [projectType, setProjectType] = useState<ProjectType | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [yarnMaterials, setYarnMaterials] = useState<ProjectYarn[]>([]);
  const [hookUsedIds, setHookUsedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fullscreenImageUri, setFullscreenImageUri] = useState<ProjectImage | null>(null);
  const [yarnPickerVisible, setYarnPickerVisible] = useState(false);
  const [hookPickerVisible, setHookPickerVisible] = useState(false);

  // Track when form data is initialized from project
  const isFormInitializedRef = useRef(false);

  useEffect(() => {
    if (project) {
      // Check for draft first (in case returning from Add Inventory after crash)
      let restoredFromDraft = false;
      try {
        const draft = getProjectDraft();
        if (draft && draft.screenType === 'edit' && draft.editProjectId === id) {
          // Restore from draft (had unsaved edits)
          setTitle(draft.title);
          setDescription(draft.description);
          setNotes(draft.notes);
          setInspirationUrl(draft.inspirationUrl);
          setImages(draft.images);
          setDefaultImageIndex(draft.defaultImageIndex);
          setPatternImages(draft.patternImages);
          setPatternPdf(draft.patternPdf);
          setPatternUrl(draft.patternUrl);
          setStatus(draft.status as ProjectStatus);
          setProjectType(draft.projectType as ProjectType | undefined);
          setStartDate(draft.startDate ? new Date(draft.startDate) : undefined);
          setYarnMaterials(draft.yarnMaterials.map(ym => ({
            itemId: ym.inventoryItemId,
            quantity: ym.quantity,
          })));
          setHookUsedIds(draft.hookUsedIds);
          // Clear draft after restoration
          clearProjectDraft();
          restoredFromDraft = true;
          if (__DEV__) console.log('[EditProject] Restored draft from navigation');
        }
      } catch (error) {
        // If draft restoration fails, clear corrupted data and load from project
        if (__DEV__) console.error('[EditProject] Failed to restore draft:', error);
        clearProjectDraft();
      }

      if (!restoredFromDraft) {
        // Load from project (normal case)
        setTitle(project.title);
        setDescription(project.description || '');
        setNotes(project.notes || '');
        setInspirationUrl(project.inspirationUrl || '');
        setImages(project.images || []);
        setDefaultImageIndex(project.defaultImageIndex || 0);
        setPatternImages(project.patternImages || []);
        setPatternPdf(project.patternPdf || '');
        setPatternUrl(project.patternUrl || '');
        setStatus(project.status);
        setProjectType(project.projectType);
        setStartDate(project.startDate);
        // Load yarn materials (use new format, or migrate from legacy yarnUsedIds)
        if (project.yarnMaterials && project.yarnMaterials.length > 0) {
          setYarnMaterials(project.yarnMaterials);
        } else if (project.yarnUsedIds && project.yarnUsedIds.length > 0) {
          // Migrate legacy format
          setYarnMaterials(project.yarnUsedIds.map(ymId => ({ itemId: ymId, quantity: 1 })));
        } else {
          setYarnMaterials([]);
        }
        setHookUsedIds(project.hookUsedIds || []);
      }
      // Mark form as initialized so change detection can begin
      isFormInitializedRef.current = true;
    }
  }, [project, id]);

  // Check for newly created inventory on focus (auto-add feature)
  useFocusEffect(
    useCallback(() => {
      const newItem = consumeNewlyCreatedInventory();
      if (newItem) {
        if (newItem.category === 'yarn') {
          setYarnMaterials(prev => {
            // Don't add duplicate
            if (prev.some(m => m.itemId === newItem.id)) return prev;
            return [...prev, { itemId: newItem.id, quantity: 1 }];
          });
          if (__DEV__) console.log('[EditProject] Auto-added new yarn:', newItem.name);
        } else if (newItem.category === 'hook') {
          setHookUsedIds(prev => {
            // Don't add duplicate
            if (prev.includes(newItem.id)) return prev;
            return [...prev, newItem.id];
          });
          if (__DEV__) console.log('[EditProject] Auto-added new hook:', newItem.name);
        }
      }
    }, [])
  );

  // Create normalized form state for change detection
  const formState = useMemo(() => ({
    title,
    description,
    notes,
    inspirationUrl,
    images,
    defaultImageIndex,
    patternImages,
    patternPdf,
    patternUrl,
    status,
    projectType,
    startDate,
    yarnMaterials,
    hookUsedIds,
  }), [
    title, description, notes, inspirationUrl, images, defaultImageIndex,
    patternImages, patternPdf, patternUrl, status, projectType, startDate,
    yarnMaterials, hookUsedIds
  ]);

  // Detect unsaved changes and prevent accidental navigation away
  const { resetInitialState } = useUnsavedChanges({
    formState,
    isReady: isFormInitializedRef.current && !!project,
    dialogTitle: t('common.unsavedChanges'),
    dialogMessage: t('common.unsavedChangesMessage'),
    discardText: t('common.discard'),
    keepEditingText: t('common.keepEditing'),
    onDiscard: clearProjectDraft, // Clean up any saved draft when discarding
  });

  /** Opens photo source selection dialog */
  const handleAddPhoto = useCallback(() => {
    Alert.alert(
      t('projects.choosePhotoSource'),
      undefined,
      [
        {
          text: t('projects.takePhoto'),
          onPress: async () => {
            const result = await takePhotoWithCamera();
            if (result.success && result.data) {
              const uri = result.data;
              setImages(prev => [...prev, uri]);
            }
          },
        },
        {
          text: t('projects.chooseFromLibrary'),
          onPress: async () => {
            const result = await pickImagesFromGallery();
            if (result.success && result.data.length > 0) {
              setImages(prev => [...prev, ...result.data]);
            }
          },
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ]
    );
  }, [t, takePhotoWithCamera, pickImagesFromGallery]);

  /** Removes an image and adjusts default index */
  const removeImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setDefaultImageIndex(prev => {
      if (prev === index) return 0;
      if (prev > index) return prev - 1;
      return prev;
    });
  }, []);

  /** Sets the default image for the project */
  const setAsDefault = useCallback((index: number) => {
    setDefaultImageIndex(index);
  }, []);

  /** Adds pattern images from library */
  const handleAddPatternImage = useCallback(async () => {
    const result = await pickImagesFromGallery();
    if (result.success && result.data.length > 0) {
      setPatternImages(prev => [...prev, ...result.data]);
    }
  }, [pickImagesFromGallery]);

  /** Removes a pattern image by index */
  const removePatternImage = useCallback((index: number) => {
    setPatternImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  /** Opens pattern source selection dialog */
  const handleAddPattern = useCallback(() => {
    Alert.alert(
      t('projects.choosePatternSource'),
      undefined,
      [
        {
          text: t('projects.takePhotoOfPattern'),
          onPress: handleAddPatternImage,
        },
        {
          text: t('projects.uploadPdfPattern'),
          onPress: () => {
            Alert.prompt(
              t('projects.addPdfUrl'),
              t('projects.enterPdfUrl'),
              (text) => {
                if (text) setPatternPdf(text);
              },
              'plain-text'
            );
          },
        },
        {
          text: t('projects.addPatternUrlOption'),
          onPress: () => {
            Alert.prompt(
              t('projects.addUrl'),
              t('projects.enterPatternUrl'),
              (text) => {
                if (text) setPatternUrl(text);
              },
              'plain-text'
            );
          },
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ]
    );
  }, [t, handleAddPatternImage]);

  /** Opens yarn selection dialog */
  const handleAddYarn = useCallback(() => {
    Alert.alert(
      t('projects.addYarn'),
      undefined,
      [
        {
          text: t('projects.selectExistingYarn'),
          onPress: () => setYarnPickerVisible(true),
        },
        {
          text: t('projects.addNewYarn'),
          onPress: () => {
            // Save draft before navigating to Add Inventory
            saveFormAsDraft({
              title, description, notes, inspirationUrl, images,
              defaultImageIndex, patternImages, patternPdf, patternUrl,
              status, projectType, startDate, yarnMaterials, hookUsedIds,
            }, 'edit', id as string);
            // Navigate to Add Inventory (edit form stays in stack)
            router.push({
              pathname: '/add-inventory',
              params: { category: 'yarn', returnTo: 'project-form' },
            });
          },
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ]
    );
  }, [
    t, id, title, description, notes, inspirationUrl, images, defaultImageIndex,
    patternImages, patternPdf, patternUrl, status, projectType, startDate,
    yarnMaterials, hookUsedIds
  ]);

  /** Opens hook selection dialog */
  const handleAddHook = useCallback(() => {
    Alert.alert(
      t('projects.addHook'),
      undefined,
      [
        {
          text: t('projects.selectExistingHook'),
          onPress: () => setHookPickerVisible(true),
        },
        {
          text: t('projects.addNewHook'),
          onPress: () => {
            // Save draft before navigating to Add Inventory
            saveFormAsDraft({
              title, description, notes, inspirationUrl, images,
              defaultImageIndex, patternImages, patternPdf, patternUrl,
              status, projectType, startDate, yarnMaterials, hookUsedIds,
            }, 'edit', id as string);
            // Navigate to Add Inventory (edit form stays in stack)
            router.push({
              pathname: '/add-inventory',
              params: { category: 'hook', returnTo: 'project-form' },
            });
          },
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ]
    );
  }, [
    t, id, title, description, notes, inspirationUrl, images, defaultImageIndex,
    patternImages, patternPdf, patternUrl, status, projectType, startDate,
    yarnMaterials, hookUsedIds
  ]);

  /** Removes a yarn from materials */
  const handleRemoveYarn = useCallback((id: string) => {
    setYarnMaterials(prev => prev.filter((yarn) => yarn.itemId !== id));
  }, []);

  /** Updates yarn quantity in materials */
  const handleYarnQuantityChange = useCallback((id: string, quantity: number) => {
    setYarnMaterials(prev => prev.map((yarn) =>
      yarn.itemId === id ? { ...yarn, quantity } : yarn
    ));
  }, []);

  /** Removes a hook from the project */
  const handleRemoveHook = useCallback((id: string) => {
    setHookUsedIds(prev => prev.filter((hookId) => hookId !== id));
  }, []);

  /** Submits updated project data */
  const handleSubmit = useCallback(async () => {
    if (!project) return;
    if (!title.trim()) {
      Alert.alert(t('common.error'), t('projects.enterProjectTitle'));
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        title,
        description: description.trim() || undefined,
        notes,
        inspirationUrl,
        images,
        defaultImageIndex: images.length > 0 ? defaultImageIndex : undefined,
        patternImages: patternImages.length > 0 ? patternImages : undefined,
        patternPdf: patternPdf.trim() || undefined,
        patternUrl: patternUrl.trim() || undefined,
        status,
        projectType,
        startDate,
        yarnMaterials,
        hookUsedIds,
      };
      if (__DEV__) {
        console.log('📤 Submitting update with yarnMaterials:', yarnMaterials);
        console.log('📤 Submitting update with hookUsedIds:', hookUsedIds);
      }
      await updateProject(project.id, updateData);
      // Clear any saved draft and reset form state before navigating back
      clearProjectDraft();
      resetInitialState();
      router.back();
    } catch {
      Alert.alert(t('common.error'), t('projects.failedToUpdate'));
    } finally {
      setLoading(false);
    }
  }, [
    project, title, description, notes, inspirationUrl, images, defaultImageIndex,
    patternImages, patternPdf, patternUrl, status, projectType, startDate,
    yarnMaterials, hookUsedIds, updateProject, t, resetInitialState
  ]);

  // Early return for missing project - AFTER all hooks
  if (!project) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('projects.projectNotFound')}</Text>
          <Button
            title={t('projects.goBack')}
            onPress={() => router.dismiss()}
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ModalHeader
        title={t('projects.editProject')}
        showHelp={true}
        helpSection="projects"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* SECTION 1: Identity - Title, Description, Type */}
          <Input
            label={t('projects.projectTitle')}
            placeholder={t('projects.enterProjectName')}
            value={title}
            onChangeText={setTitle}
            required
          />

          <Input
            label={t('projects.description')}
            placeholder={t('projects.projectDescriptionPlaceholder')}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Select<ProjectType>
            label={t('projects.projectType')}
            value={projectType}
            options={getProjectTypeOptions()}
            onChange={setProjectType}
            placeholder={t('projects.selectProjectType')}
          />

          <View style={styles.sectionDivider} />

          {/* SECTION 2: Photos - Visual representation */}
          <View>
            <SectionHeaderWithAdd
              title={t('projects.photos')}
              onAdd={handleAddPhoto}
              addButtonLabel={t('projects.addPhotos')}
            />

            <View style={styles.imageSection}>
            {images.length > 0 && (
              <FlatList
                data={images}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <Pressable
                    style={styles.imageContainer}
                    onLongPress={() => {
                      showImageActions({
                        canSetDefault: true,
                        isDefault: index === defaultImageIndex,
                        canViewFullSize: true,
                        viewFullSizeType: 'image',
                        onSetDefault: () => setAsDefault(index),
                        onRemoveDefault: () => setAsDefault(0),
                        onDelete: () => removeImage(index),
                        onViewFullSize: () => setFullscreenImageUri(item),
                      });
                    }}
                    accessible={true}
                    accessibilityRole="image"
                    accessibilityLabel={index === defaultImageIndex ? t('projects.defaultImage') : t('projects.photo')}
                    accessibilityHint={t('projects.longPressForOptions')}
                  >
                    <Image
                      source={getImageSource(item)}
                      style={styles.imagePreview}
                      contentFit="cover"
                      transition={200}
                      cachePolicy="memory-disk"
                      onError={(error) => {
                        if (__DEV__) console.warn('Image load error:', error);
                      }}
                    />
                    {index === defaultImageIndex && (
                      <View style={styles.defaultBadge}>
                        <Star size={16} color={Colors.white} fill={Colors.white} />
                      </View>
                    )}
                  </Pressable>
                )}
                contentContainerStyle={styles.imageList}
              />
            )}
            </View>
          </View>

          <View style={styles.sectionDivider} />

          {/* SECTION 3: Status & Date */}
          <View style={styles.statusSection}>
            <Text style={styles.sectionLabel}>{t('projects.status')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statusScrollContent}
            >
              {[
                { value: 'to-do' as ProjectStatus, label: t('projects.toDo'), icon: <Lightbulb size={16} color={status === 'to-do' ? Colors.white : '#FFB84D'} />, color: '#FFB84D' },
                { value: 'in-progress' as ProjectStatus, label: t('projects.inProgress'), icon: <Clock size={16} color={status === 'in-progress' ? Colors.white : '#2C7873'} />, color: '#2C7873' },
                { value: 'on-hold' as ProjectStatus, label: t('projects.onHold'), icon: <PauseCircle size={16} color={status === 'on-hold' ? Colors.white : '#9C27B0'} />, color: '#9C27B0' },
                { value: 'completed' as ProjectStatus, label: t('projects.completed'), icon: <CheckCircle size={16} color={status === 'completed' ? Colors.white : '#4CAF50'} />, color: '#4CAF50' },
                { value: 'frogged' as ProjectStatus, label: t('projects.frogged'), icon: <RotateCcw size={16} color={status === 'frogged' ? Colors.white : '#FF6B6B'} />, color: '#FF6B6B' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.statusOption,
                    status === item.value && [styles.statusOptionActive, { backgroundColor: item.color, borderColor: item.color }]
                  ]}
                  onPress={() => setStatus(item.value)}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityRole="radio"
                  accessibilityLabel={item.label}
                  accessibilityHint={`Set project status to ${item.label}`}
                  accessibilityState={{
                    selected: status === item.value,
                    checked: status === item.value,
                  }}
                >
                  {item.icon}
                  <Text style={[
                    styles.statusOptionText,
                    status === item.value && styles.statusOptionTextActive
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <DatePicker
            label={t('projects.startDate')}
            value={startDate}
            onChange={setStartDate}
            maxDate={new Date()}
          />

          <View style={styles.sectionDivider} />

          {/* SECTION 4: Materials */}
          <View>
            <SectionHeaderWithAdd
              title={t('projects.materialsYarn')}
              onAdd={handleAddYarn}
              addButtonLabel={t('projects.addYarnToInventory')}
            />
            <SelectedMaterialsPreview
              items={inventory.filter((item) => yarnMaterials.some(y => y.itemId === item.id))}
              onRemove={handleRemoveYarn}
              hideEmptyState
              category="yarn"
              quantities={Object.fromEntries(yarnMaterials.map(y => [y.itemId, y.quantity]))}
              onQuantityChange={handleYarnQuantityChange}
            />
          </View>

          <View style={styles.sectionDivider} />

          <View>
            <SectionHeaderWithAdd
              title={t('projects.materialsHooks')}
              onAdd={handleAddHook}
              addButtonLabel={t('projects.addHookToInventory')}
            />
            <SelectedMaterialsPreview
              items={inventory.filter((item) => hookUsedIds.includes(item.id))}
              onRemove={handleRemoveHook}
              hideEmptyState
              category="hook"
            />
          </View>

          <View style={styles.sectionDivider} />

          {/* SECTION 5: Pattern */}
          <View>
            <SectionHeaderWithAdd
              title={t('projects.pattern')}
              onAdd={handleAddPattern}
              addButtonLabel={t('projects.addPattern')}
            />

            <View style={styles.imageSection}>
            {patternImages.length > 0 && (
              <FlatList
                data={patternImages}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <Pressable
                    style={styles.imageContainer}
                    onLongPress={() => {
                      showImageActions({
                        canSetDefault: false,
                        canViewFullSize: true,
                        viewFullSizeType: 'image',
                        onDelete: () => removePatternImage(index),
                        onViewFullSize: () => setFullscreenImageUri(item),
                      });
                    }}
                    accessible={true}
                    accessibilityRole="image"
                    accessibilityLabel={t('projects.patternPhoto')}
                    accessibilityHint={t('projects.longPressForOptions')}
                  >
                    <Image
                      source={{ uri: item }}
                      style={styles.imagePreview}
                      contentFit="cover"
                      transition={200}
                      cachePolicy="memory-disk"
                    />
                  </Pressable>
                )}
                contentContainerStyle={styles.imageList}
              />
            )}

            {patternPdf && (
              <View style={styles.pdfPreview}>
                <FileText size={20} color={Colors.sage} />
                <Text style={styles.pdfText} numberOfLines={1}>
                  {patternPdf}
                </Text>
                <TouchableOpacity
                  onPress={() => setPatternPdf('')}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Remove PDF"
                  accessibilityHint="Remove the PDF URL"
                >
                  <Trash2 size={16} color="#FF5252" />
                </TouchableOpacity>
              </View>
            )}

            {patternUrl && (
              <View style={styles.pdfPreview}>
                <Link size={20} color={Colors.sage} />
                <Text style={styles.pdfText} numberOfLines={1}>
                  {patternUrl}
                </Text>
                <TouchableOpacity
                  onPress={() => setPatternUrl('')}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Remove URL"
                  accessibilityHint="Remove the pattern URL"
                >
                  <Trash2 size={16} color="#FF5252" />
                </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          <View style={styles.sectionDivider} />

          {/* SECTION 6: Pattern Adjustments
              Note: "Pattern Adjustments" in the UI maps to the "notes" field
              in the data model for backward compatibility with existing data */}
          <Input
            label={t('projects.patternAdjustments')}
            placeholder={t('projects.patternAdjustmentsPlaceholder')}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <View style={styles.footer}>
            <Button
              title={t('projects.updateProject')}
              onPress={handleSubmit}
              loading={loading}
              size="large"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fullscreen Image Modal */}
      <FullscreenImageModal
        visible={fullscreenImageUri !== null}
        imageUri={fullscreenImageUri}
        onClose={() => setFullscreenImageUri(null)}
      />

      {/* Material Picker Modals */}
      <MaterialPickerModal
        visible={yarnPickerVisible}
        onClose={() => setYarnPickerVisible(false)}
        category="yarn"
        selectedIds={yarnMaterials.map(y => y.itemId)}
        onSelectionChange={(newIds) => {
          // Preserve existing quantities, add new items with quantity 1
          const existingMap = new Map(yarnMaterials.map(y => [y.itemId, y.quantity]));
          setYarnMaterials(newIds.map(id => ({
            itemId: id,
            quantity: existingMap.get(id) ?? 1,
          })));
        }}
      />

      <MaterialPickerModal
        visible={hookPickerVisible}
        onClose={() => setHookPickerVisible(false)}
        category="hook"
        selectedIds={hookUsedIds}
        onSelectionChange={setHookUsedIds}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },

  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  imageSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    color: Colors.warmGray,
    marginBottom: 8,
    fontWeight: '500',
    letterSpacing: 0.2,
    paddingHorizontal: 16,
  },
  pdfPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.border,
  },
  pdfText: {
    ...Typography.body,
    color: Colors.charcoal,
    flex: 1,
  },
  footer: {
    marginTop: 24,
    marginBottom: 32,
  },
  statusSection: {
    marginBottom: 16,
  },
  statusScrollContent: {
    paddingVertical: 4,
    gap: 10,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: normalizeBorder(0),
    backgroundColor: 'rgba(139, 154, 123, 0.12)',
    minHeight: 32,
  },
  statusOptionActive: {
    borderColor: 'transparent',
    ...Platform.select({
      ...buttonShadow,
      default: {},
    }),
  },
  statusOptionText: {
    ...Typography.caption,
    color: Colors.charcoal,
    fontWeight: '600' as const,
    fontSize: 13,
  },
  statusOptionTextActive: {
    color: Colors.white,
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
    height: 133, // 3:4 aspect ratio (100 * 4/3 ≈ 133)
    borderRadius: 12,
    backgroundColor: Colors.warmGray,
  },
  defaultBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.sage,
    borderRadius: 12,
    padding: 4,
  },
});
