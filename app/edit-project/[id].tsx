import React, { useState, useEffect } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { Lightbulb, Clock, CheckCircle, Star, Trash2, PauseCircle, RotateCcw, FileText, Link, Lock } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { MaterialPickerModal } from '@/components/MaterialPickerModal';
import { SelectedMaterialsPreview } from '@/components/SelectedMaterialsPreview';
import { DatePicker } from '@/components/DatePicker';
import { ModalHeader } from '@/components/ModalHeader';
import { SectionHeaderWithAdd } from '@/components/SectionHeaderWithAdd';
import { FullscreenImageModal } from '@/components/FullscreenImageModal';
import { useProjects } from '@/hooks/projects-context';
import { useInventory } from '@/hooks/inventory-context';
import { useLanguage } from '@/hooks/language-context';
import { useAuth } from '@/hooks/auth-context';
import { useImagePicker } from '@/hooks/useImagePicker';
import { useImageActions } from '@/hooks/useImageActions';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { normalizeBorder, buttonShadow } from '@/constants/pixelRatio';
import { ProjectStatus, ProjectType, ProjectImage, getImageSource } from '@/types';
import { getProjectTypeOptions } from '@/constants/projectTypes';

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams();
  const { getProjectById, updateProject } = useProjects();
  const { items: inventory } = useInventory();
  const { t } = useLanguage();
  const { user } = useAuth();
  const isPro = user?.isPro === true;
  const { showImagePickerOptionsMultiple, takePhotoWithCamera } = useImagePicker();
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
  const [yarnUsedIds, setYarnUsedIds] = useState<string[]>([]);
  const [hookUsedIds, setHookUsedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fullscreenImageUri, setFullscreenImageUri] = useState<ProjectImage | null>(null);
  const [yarnPickerVisible, setYarnPickerVisible] = useState(false);
  const [hookPickerVisible, setHookPickerVisible] = useState(false);

  useEffect(() => {
    if (project) {
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
      setYarnUsedIds(project.yarnUsedIds || []);
      setHookUsedIds(project.hookUsedIds || []);
    }
  }, [project]);

  if (!project) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
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

  const handleAddPhoto = () => {
    Alert.alert(
      t('projects.choosePhotoSource'),
      undefined,
      [
        {
          text: t('projects.takePhoto'),
          onPress: async () => {
            const uri = await takePhotoWithCamera();
            if (uri) {
              setImages([...images, uri]);
            }
          },
        },
        {
          text: t('projects.chooseFromLibrary'),
          onPress: async () => {
            const uris = await showImagePickerOptionsMultiple();
            if (uris.length > 0) {
              setImages([...images, ...uris]);
            }
          },
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ]
    );
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);

    if (defaultImageIndex === index) {
      setDefaultImageIndex(0);
    } else if (defaultImageIndex > index) {
      setDefaultImageIndex(defaultImageIndex - 1);
    }
  };

  const setAsDefault = (index: number) => {
    setDefaultImageIndex(index);
  };

  // Pattern handlers
  const handleAddPatternImage = async () => {
    const uris = await showImagePickerOptionsMultiple();
    if (uris.length > 0) {
      setPatternImages([...patternImages, ...uris]);
    }
  };

  const removePatternImage = (index: number) => {
    setPatternImages(patternImages.filter((_, i) => i !== index));
  };

  const handleAddPattern = () => {
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
              'plain-text',
              patternPdf
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
              'plain-text',
              patternUrl
            );
          },
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ]
    );
  };

  const handleAddYarn = () => {
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
            router.dismiss();
            router.push({
              pathname: '/add-inventory',
              params: { category: 'yarn' },
            });
          },
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ]
    );
  };

  const handleAddHook = () => {
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
            router.dismiss();
            router.push({
              pathname: '/add-inventory',
              params: { category: 'hook' },
            });
          },
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ]
    );
  };

  const handleRemoveYarn = (id: string) => {
    setYarnUsedIds(yarnUsedIds.filter((yarnId) => yarnId !== id));
  };

  const handleRemoveHook = (id: string) => {
    setHookUsedIds(hookUsedIds.filter((hookId) => hookId !== id));
  };

  const handleSubmit = async () => {
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
        yarnUsedIds,
        hookUsedIds,
      };
      console.log('📤 Submitting update with yarnUsedIds:', yarnUsedIds);
      console.log('📤 Submitting update with hookUsedIds:', hookUsedIds);
      await updateProject(project.id, updateData);
      router.back();
    } catch (error) {
      Alert.alert(t('common.error'), t('projects.failedToUpdate'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ModalHeader title={t('projects.editProject')} />

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
                        console.warn('Image load error:', error);
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
            placeholder={t('projects.selectStartDate')}
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
              items={inventory.filter((item) => yarnUsedIds.includes(item.id))}
              onRemove={handleRemoveYarn}
              emptyText={t('projects.noYarnAdded')}
              category="yarn"
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
              emptyText={t('projects.noHooksAdded')}
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

          {/* SECTION 6: Additional Details - Notes (PRO FEATURE) */}
          {isPro ? (
            <Input
              label={t('projects.notes')}
              placeholder={t('projects.additionalNotes')}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          ) : (
            <View style={styles.proLockedField}>
              <View style={styles.proLockedHeader}>
                <Text style={styles.proLockedLabel}>{t('projects.notes')}</Text>
                <View style={styles.proBadge}>
                  <Lock size={10} color={Colors.white} />
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              </View>
            </View>
          )}

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
        selectedIds={yarnUsedIds}
        onSelectionChange={setYarnUsedIds}
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
    backgroundColor: Colors.warmGray,
    marginVertical: 4,
    opacity: 0.5,
  },
  textArea: {
    minHeight: 100,
  },
  imageSection: {
    marginBottom: 0,
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
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderWidth: normalizeBorder(1.5),
    borderColor: Colors.sage,
    borderRadius: 14,
    paddingVertical: 16,
    minHeight: 54,
    ...Platform.select({
      ...buttonShadow,
      default: {},
    }),
  },
  imageButtonText: {
    ...Typography.body,
    color: Colors.sage,
    fontWeight: '600' as const,
    fontSize: 16,
  },
  footer: {
    marginTop: 24,
    marginBottom: 32,
  },
  // PRO locked field styles
  proLockedField: {
    marginBottom: 20,
  },
  proLockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  proLockedLabel: {
    ...Typography.body,
    color: Colors.charcoal,
    fontWeight: '500' as const,
    fontSize: 14,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.sage,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  proBadgeText: {
    ...Typography.caption,
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  proLockedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.beige,
    borderRadius: 12,
    padding: 16,
  },
  proLockedText: {
    ...Typography.body,
    color: Colors.warmGray,
    fontSize: 14,
    fontStyle: 'italic',
  },
  statusSection: {
    marginBottom: 16,
  },
  materialsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.charcoal,
    fontWeight: '600' as const,
    marginBottom: 16,
    fontSize: 18,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.deepSage,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    minHeight: 50,
  },
  addButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  savedWorkEntry: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  savedWorkEntryText: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
    marginRight: 12,
  },
  workEntryDeleteButton: {
    padding: 4,
    marginTop: -4,
  },
  workEntryForm: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: normalizeBorder(1.5),
    borderColor: Colors.sage,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.border,
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelButtonText: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 15,
    fontWeight: '500' as const,
  },
  saveButton: {
    backgroundColor: Colors.sage,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: Colors.warmGray,
    opacity: 0.5,
  },
  saveButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  workEntryTitle: {
    ...Typography.title3,
    color: Colors.charcoal,
    fontWeight: '600',
    fontSize: 16,
  },
  inspirationCard: {
    backgroundColor: Colors.beige,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.deepSage,
  },
  inspirationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inspirationTitle: {
    ...Typography.title3,
    color: Colors.deepSage,
    fontWeight: '600',
    fontSize: 16,
  },
  inspirationImagesSection: {
    marginTop: 12,
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
  addImageButton: {
    width: 120,
    height: 120,
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
    minHeight: 120,
  },
  addPhotoButtonText: {
    ...Typography.body,
    color: Colors.sage,
    fontWeight: '600' as const,
    fontSize: 16,
  },
});
