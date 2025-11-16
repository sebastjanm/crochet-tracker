import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { Lightbulb, Clock, CheckCircle, Calendar, Star, Trash2, Plus } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ModalHeader } from '@/components/ModalHeader';
import { useProjects } from '@/hooks/projects-context';
import { useLanguage } from '@/hooks/language-context';
import { useImagePicker } from '@/hooks/useImagePicker';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { ProjectStatus } from '@/types';

export default function AddProjectScreen() {
  const { addProject } = useProjects();
  const { t } = useLanguage();
  const { showImagePickerOptions } = useImagePicker();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [inspirationUrl, setInspirationUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [defaultImageIndex, setDefaultImageIndex] = useState<number>(0);
  const [status, setStatus] = useState<ProjectStatus>('idea');
  const [loading, setLoading] = useState(false);

  const handleAddImage = async () => {
    const uri = await showImagePickerOptions();
    if (uri) {
      setImages([...images, uri]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    
    // Adjust default index if needed
    if (defaultImageIndex === index) {
      setDefaultImageIndex(0);
    } else if (defaultImageIndex > index) {
      setDefaultImageIndex(defaultImageIndex - 1);
    }
  };

  const setAsDefault = (index: number) => {
    setDefaultImageIndex(index);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert(t('common.error'), t('projects.enterProjectTitle'));
      return;
    }

    setLoading(true);
    try {
      await addProject({
        title,
        description,
        notes,
        inspirationUrl,
        images,
        defaultImageIndex: images.length > 0 ? defaultImageIndex : undefined,
        status,
      });
      router.dismiss();
    } catch (error) {
      Alert.alert(t('common.error'), t('projects.failedToCreate'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ModalHeader title={t('projects.newProject')} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Input
            label={t('projects.projectTitle')}
            placeholder={t('projects.enterProjectName')}
            value={title}
            onChangeText={setTitle}
          />

          <Input
            label={t('projects.description')}
            placeholder={t('projects.describeProject')}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />

          <View style={styles.statusSection}>
            <Text style={styles.sectionLabel}>{t('projects.status')}</Text>
            <View style={styles.statusGrid}>
              {[
                { value: 'idea' as ProjectStatus, label: t('projects.idea'), icon: <Lightbulb size={20} color={status === 'idea' ? Colors.white : '#FFB84D'} />, color: '#FFB84D' },
                { value: 'in-progress' as ProjectStatus, label: t('projects.inProgress'), icon: <Clock size={20} color={status === 'in-progress' ? Colors.white : Colors.sage} />, color: Colors.sage },
                { value: 'completed' as ProjectStatus, label: t('projects.completed'), icon: <CheckCircle size={20} color={status === 'completed' ? Colors.white : '#4CAF50'} />, color: '#4CAF50' },
                { value: 'maybe-someday' as ProjectStatus, label: t('projects.maybeSomeday'), icon: <Calendar size={20} color={status === 'maybe-someday' ? Colors.white : '#9C27B0'} />, color: '#9C27B0' },
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
            </View>
          </View>

          <View style={styles.imageSection}>
            <Text style={styles.sectionLabel}>{t('projects.photos')}</Text>
            
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
                ListFooterComponent={
                  <TouchableOpacity
                    style={styles.addImageButton}
                    onPress={handleAddImage}
                    activeOpacity={0.7}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={t('projects.addMorePhotos')}
                    accessibilityHint="Choose from camera or gallery"
                  >
                    <Plus size={24} color={Colors.sage} />
                    <Text style={styles.addImageText}>{t('common.add')}</Text>
                  </TouchableOpacity>
                }
                contentContainerStyle={styles.imageList}
              />
            )}
            
            {images.length === 0 && (
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={handleAddImage}
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
            
            {images.length > 0 && (
              <Text style={styles.imageCount}>
                {images.length} {t('projects.photosSelected')} • {t('projects.tapStarDefault')}
              </Text>
            )}
          </View>

          <Input
            label={t('projects.inspirationOptional')}
            placeholder="https://..."
            value={inspirationUrl}
            onChangeText={setInspirationUrl}
            autoCapitalize="none"
          />

          <Input
            label={t('projects.notesOptional')}
            placeholder={t('projects.additionalNotes')}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />

          <View style={styles.footer}>
            <Button
              title={t('projects.createProject')}
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
    padding: 16,
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
    borderWidth: 1.5,
    borderColor: Colors.sage,
    borderRadius: 14,
    paddingVertical: 16,
    minHeight: 54,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
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
  },
  statusSection: {
    marginBottom: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusOption: {
    flex: 1,
    minWidth: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.warmGray,
    backgroundColor: Colors.white,
  },
  statusOptionActive: {
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: Colors.charcoal,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
  statusOptionText: {
    ...Typography.body,
    color: Colors.charcoal,
    fontWeight: '600' as const,
    fontSize: 14,
  },
  statusOptionTextActive: {
    color: Colors.white,
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
    width: 120,
    height: 120,
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
    borderWidth: 2,
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
    borderWidth: 2,
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