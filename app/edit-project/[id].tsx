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
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Lightbulb, Clock, CheckCircle, Star, Trash2, Plus, PauseCircle, RotateCcw, FileText, Camera, Link } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { MaterialCardSelector } from '@/components/MaterialCardSelector';
import { DatePicker } from '@/components/DatePicker';
import { ModalHeader } from '@/components/ModalHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { useProjects } from '@/hooks/projects-context';
import { useInventory } from '@/hooks/inventory-context';
import { useLanguage } from '@/hooks/language-context';
import { useImagePicker } from '@/hooks/useImagePicker';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { normalizeBorder, cardShadow, buttonShadow } from '@/constants/pixelRatio';
import { ProjectStatus, ProjectType, InventoryItem } from '@/types';
import { getProjectTypeOptions } from '@/constants/projectTypes';

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams();
  const { getProjectById, updateProject } = useProjects();
  const { items: inventory } = useInventory();
  const { t } = useLanguage();
  const { showImagePickerOptionsMultiple, takePhotoWithCamera } = useImagePicker();
  const project = getProjectById(id as string);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [inspirationUrl, setInspirationUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [defaultImageIndex, setDefaultImageIndex] = useState<number>(0);
  const [patternImages, setPatternImages] = useState<string[]>([]);
  const [patternPdf, setPatternPdf] = useState<string>('');
  const [patternUrl, setPatternUrl] = useState<string>('');
  const [status, setStatus] = useState<ProjectStatus>('planning');
  const [projectType, setProjectType] = useState<ProjectType | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [yarnUsedIds, setYarnUsedIds] = useState<string[]>([]);
  const [hookUsedIds, setHookUsedIds] = useState<string[]>([]);
  const [colorNotes, setColorNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setTitle(project.title);
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
      setColorNotes(project.colorNotes || '');
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
      t('projects.addNewYarn'),
      t('projects.formWillClose'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.continue'),
          onPress: () => {
            router.dismiss();
            router.push({
              pathname: '/add-inventory',
              params: { category: 'yarn' },
            });
          },
        },
      ]
    );
  };

  const handleAddHook = () => {
    Alert.alert(
      t('projects.addNewHook'),
      t('projects.formWillClose'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.continue'),
          onPress: () => {
            router.dismiss();
            router.push({
              pathname: '/add-inventory',
              params: { category: 'hook' },
            });
          },
        },
      ]
    );
  };

  const handleToggleYarn = (id: string) => {
    if (yarnUsedIds.includes(id)) {
      setYarnUsedIds(yarnUsedIds.filter((yarnId) => yarnId !== id));
    } else {
      setYarnUsedIds([...yarnUsedIds, id]);
    }
  };

  const handleToggleHook = (id: string) => {
    if (hookUsedIds.includes(id)) {
      setHookUsedIds(hookUsedIds.filter((hookId) => hookId !== id));
    } else {
      setHookUsedIds([...hookUsedIds, id]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert(t('common.error'), t('projects.enterProjectTitle'));
      return;
    }

    setLoading(true);
    try {
      await updateProject(project.id, {
        title,
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
        colorNotes: colorNotes.trim() || undefined,
      });
      router.dismiss();
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
          {/* SECTION 1: BASIC INFO */}
          <SectionHeader title={t('projects.basicInfo')} badge="1" isFirst={true} />

          <View style={styles.sectionContent}>
            <Input
              label={t('projects.projectTitle')}
              placeholder={t('projects.enterProjectName')}
              value={title}
              onChangeText={setTitle}
              required
            />

            <Select<ProjectType>
              label={t('projects.projectType')}
              value={projectType}
              options={getProjectTypeOptions()}
              onChange={setProjectType}
              placeholder={t('projects.selectProjectType')}
            />

            <View style={styles.statusSection}>
            <Text style={styles.sectionLabel}>{t('projects.status')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statusScrollContent}
            >
              {[
                { value: 'planning' as ProjectStatus, label: t('projects.planning'), icon: <Lightbulb size={16} color={status === 'planning' ? Colors.white : '#FFB84D'} />, color: '#FFB84D' },
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

            <Input
              label={t('projects.notes')}
              placeholder={t('projects.additionalNotes')}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              style={styles.textArea}
            />
          </View>

          <View style={styles.photosHeader}>
            <Text style={styles.photosTitle}>{t('projects.photos')}</Text>
            <TouchableOpacity
              style={styles.addPhotosButton}
              onPress={handleAddPhoto}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('projects.addPhotos')}
              accessibilityHint="Choose to take a photo or select from gallery"
            >
              <Plus size={20} color={Colors.sage} />
              <Text style={styles.addPhotosButtonText}>{t('projects.addPhotos')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.imageSection}>
              {!images.length && (
              <Text style={styles.photosEmptyText}>
                {t('projects.addPhotosDescription')}
              </Text>
            )}

            {images.length > 0 && (
              <FlatList
                data={images}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: item }}
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
                    <View style={styles.imageActions}>
                      <TouchableOpacity
                        style={[styles.imageActionButton, index === defaultImageIndex && styles.imageActionButtonActive]}
                        onPress={() => setAsDefault(index)}
                        activeOpacity={0.7}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={index === defaultImageIndex ? t('projects.defaultImage') : t('projects.markAsDefault')}
                        accessibilityHint={index === defaultImageIndex ? t('projects.currentDefaultImage') : t('projects.setAsMainPhoto')}
                      >
                        <Star size={16} color={index === defaultImageIndex ? Colors.white : Colors.charcoal} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.imageActionButton, styles.deleteButton]}
                        onPress={() => removeImage(index)}
                        activeOpacity={0.7}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="Delete photo"
                        accessibilityHint={t('projects.removeThisPhoto')}
                      >
                        <Trash2 size={16} color={Colors.white} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                contentContainerStyle={styles.imageList}
              />
            )}

              {images.length > 0 && (
                <Text style={styles.imageCount}>
                  {images.length} {t('projects.photosSelected')} • {t('projects.tapStarDefault')}
                </Text>
              )}
          </View>

          {/* PATTERN SECTION */}
          <View style={styles.patternHeader}>
            <Text style={styles.patternTitle}>{t('projects.pattern')}</Text>
            <TouchableOpacity
              style={styles.addPatternButton}
              onPress={handleAddPattern}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('projects.addPattern')}
              accessibilityHint={t('projects.addPatternDescription')}
            >
              <Plus size={20} color={Colors.sage} />
              <Text style={styles.addPatternButtonText}>{t('projects.addPattern')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.patternSection}>
              {!patternImages.length && !patternPdf && !patternUrl && (
              <Text style={styles.patternEmptyText}>
                {t('projects.addPatternDescription')}
              </Text>
            )}

            {patternImages.length > 0 && (
              <View style={styles.patternPreviewSection}>
                <Text style={styles.sectionLabel}>{t('projects.patternPhotos')}</Text>
                <FlatList
                  data={patternImages}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item, index }) => (
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: item }}
                        style={styles.imagePreview}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="memory-disk"
                      />
                      <View style={styles.imageActions}>
                        <TouchableOpacity
                          style={[styles.imageActionButton, styles.deleteButton]}
                          onPress={() => removePatternImage(index)}
                          activeOpacity={0.7}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={t('common.delete')}
                          accessibilityHint={t('projects.removeThisPhoto')}
                        >
                          <Trash2 size={16} color={Colors.white} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  contentContainerStyle={styles.imageList}
                />
              </View>
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

          {/* SECTION 2: MATERIALS */}
          <SectionHeader title={t('projects.materials')} badge="2" />

          <View style={styles.sectionContent}>
            <MaterialCardSelector
            items={inventory.filter((item) => item.category === 'yarn')}
            selectedIds={yarnUsedIds}
            onToggle={handleToggleYarn}
            onAddNew={handleAddYarn}
            category="yarn"
            title={t('projects.materialsYarn')}
            addButtonLabel={t('projects.addYarnToInventory')}
            emptyMessage={t('projects.noYarnAvailable')}
          />

          <MaterialCardSelector
            items={inventory.filter((item) => item.category === 'hook')}
            selectedIds={hookUsedIds}
            onToggle={handleToggleHook}
            onAddNew={handleAddHook}
            category="hook"
            title={t('projects.materialsHooks')}
            addButtonLabel={t('projects.addHookToInventory')}
            emptyMessage={t('projects.noHooksAvailable')}
          />

            <Input
              label={t('projects.colorNotes')}
              placeholder={t('projects.colorNotesPlaceholder')}
              value={colorNotes}
              onChangeText={setColorNotes}
              multiline
              numberOfLines={2}
            />
          </View>

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
    padding: 20,
  },
  sectionContent: {
    backgroundColor: Colors.linen,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginBottom: 20,
    borderWidth: normalizeBorder(0.5),
    borderColor: 'rgba(139, 154, 123, 0.12)',
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  imageSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    ...Typography.body,
    color: Colors.charcoal,
    marginBottom: 8,
    fontWeight: '500',
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  patternTitle: {
    ...Typography.title3,
    color: Colors.charcoal,
    fontWeight: '600' as const,
    fontSize: 18,
  },
  addPatternButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.beige,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  addPatternButtonText: {
    ...Typography.body,
    color: Colors.sage,
    fontWeight: '600' as const,
    fontSize: 15,
  },
  patternSection: {
    marginBottom: 24,
  },
  patternEmptyText: {
    ...Typography.body,
    color: Colors.warmGray,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  patternPreviewSection: {
    marginTop: 16,
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
  imageCount: {
    ...Typography.caption,
    color: Colors.sage,
    marginTop: 8,
  },
  footer: {
    marginTop: 24,
    marginBottom: 32,
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
    width: 130,
    height: 130,
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
  imageActions: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  imageActionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 12,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageActionButtonActive: {
    backgroundColor: Colors.sage,
  },
  deleteButton: {
    backgroundColor: '#FF5252',
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
  photosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  photosTitle: {
    ...Typography.title3,
    color: Colors.charcoal,
    fontWeight: '600' as const,
    fontSize: 18,
  },
  addPhotosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.beige,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  addPhotosButtonText: {
    ...Typography.body,
    color: Colors.sage,
    fontWeight: '600' as const,
    fontSize: 15,
  },
  photosEmptyText: {
    ...Typography.body,
    color: Colors.warmGray,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
});
