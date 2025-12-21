import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import {
  Trash2,
  Link,
  FileText,
  CheckCircle,
  Clock,
  Lightbulb,
  Calendar,
  PauseCircle,
  RotateCcw,
  BookOpen,
  ChevronRight,
  ExternalLink,
} from 'lucide-react-native';
import { Button } from '@/components/Button';
import { UniversalHeader } from '@/components/UniversalHeader';
import { ImageGallery } from '@/components/ImageGallery';
import { ProjectTypeBadge } from '@/components/ProjectTypeBadge';
import { SectionHeader } from '@/components/SectionHeader';
import { useProjects } from '@/hooks/projects-context';
import { useInventory } from '@/hooks/inventory-context';
import { useLanguage } from '@/hooks/language-context';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { normalizeBorder } from '@/constants/pixelRatio';
import type { ProjectStatus, Project } from '@/types';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams();
  const { getProjectById, deleteProject } = useProjects();
  const { getItemById, getItemsByCategory } = useInventory();
  const { t } = useLanguage();
  const [project, setProject] = useState(getProjectById(id as string));
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Refresh project data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Project detail screen focused, refreshing data for ID:', id);
      const updatedProject = getProjectById(id as string);
      console.log('📦 Fetched project data:', updatedProject ? updatedProject.title : 'NOT FOUND');
      if (updatedProject) {
        console.log('📝 Project details:', {
          title: updatedProject.title,
          status: updatedProject.status,
          notes: updatedProject.notes?.substring(0, 50),
          images: updatedProject.images?.length,
          yarnCount: updatedProject.yarnUsedIds?.length,
          hookCount: updatedProject.hookUsedIds?.length,
        });
        // Force a new object reference to trigger React re-render
        setProject({ ...updatedProject });
      } else {
        setProject(undefined);
      }
      console.log('✨ State updated with new project data');
    }, [id, getProjectById])
  );

  if (!project) {
    return (
      <SafeAreaView style={styles.container}>
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

  const handleDelete = () => {
    console.log('Delete button pressed');
    Alert.alert(
      t('projects.deleteProject'),
      t('projects.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            console.log('Deleting project:', project.id);
            await deleteProject(project.id);
            console.log('Project deleted, navigating back');
            router.back();
          },
        },
      ]
    );
  };

  const getStatusColor = (status: ProjectStatus): string => {
    switch (status) {
      case 'planning':
        return '#FFB84D';
      case 'in-progress':
        return '#2C7873';
      case 'on-hold':
        return '#9C27B0';
      case 'completed':
        return '#4CAF50';
      case 'frogged':
        return '#FF6B6B';
      default:
        return '#2C7873';
    }
  };

  const getStatusIcon = (status: ProjectStatus) => {
    switch (status) {
      case 'planning':
        return <Lightbulb size={16} color={Colors.white} />;
      case 'in-progress':
        return <Clock size={16} color={Colors.white} />;
      case 'on-hold':
        return <PauseCircle size={16} color={Colors.white} />;
      case 'completed':
        return <CheckCircle size={16} color={Colors.white} />;
      case 'frogged':
        return <RotateCcw size={16} color={Colors.white} />;
      default:
        return <Clock size={16} color={Colors.white} />;
    }
  };

  const getStatusLabel = (status: ProjectStatus): string => {
    switch (status) {
      case 'planning':
        return t('projects.planning');
      case 'in-progress':
        return t('projects.inProgress');
      case 'on-hold':
        return t('projects.onHold');
      case 'completed':
        return t('projects.completed');
      case 'frogged':
        return t('projects.frogged');
      default:
        return t('projects.inProgress');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <UniversalHeader
        title=""
        showBack={true}
        backLabel={t('common.back')}
        showHelp={false}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageGalleryContainer}>
          <ImageGallery
            images={project.images}
            editable={false}
            showCounter={false}
            onIndexChange={setCurrentImageIndex}
          />
          <View style={styles.titleOverlay}>
            <Text style={styles.projectTitle}>{project.title}</Text>
            {project.images.length > 1 && (
              <Text style={styles.imageCounter}>
                {currentImageIndex + 1}/{project.images.length}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.badgesContainer}>
            {project.projectType && (
              <ProjectTypeBadge type={project.projectType} />
            )}

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(project.status) },
              ]}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={`Project status: ${getStatusLabel(project.status)}`}
            >
              {getStatusIcon(project.status)}
              <Text style={styles.statusText}>
                {getStatusLabel(project.status)}
              </Text>
            </View>
          </View>

          {(project.startDate || (project.status === 'completed' && project.completedDate)) && (
            <View style={styles.datesContainer}>
              {project.startDate && (
                <View style={styles.dateRow}>
                  <Calendar size={16} color={Colors.warmGray} />
                  <Text style={styles.dateLabel}>{t('projects.started')}:</Text>
                  <Text style={styles.dateValue}>
                    {new Date(project.startDate).toLocaleDateString()}
                  </Text>
                </View>
              )}
              {project.status === 'completed' && project.completedDate && (
                <View style={styles.dateRow}>
                  <CheckCircle size={16} color={Colors.warmGray} />
                  <Text style={styles.dateLabel}>{t('projects.completedDate')}:</Text>
                  <Text style={styles.dateValue}>
                    {new Date(project.completedDate).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.sectionDivider} />

          <SectionHeader title={t('projects.pattern')} />

          {project.patternImages && project.patternImages.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.patternImagesScroll}
                  contentContainerStyle={styles.patternImagesContent}
                >
                  {project.patternImages.map((imgUri, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.patternImagePreview}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={{ uri: imgUri }}
                        style={styles.patternPreviewImage}
                        contentFit="cover"
                        transition={200}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <View style={styles.resourcesList}>
                {project.patternPdf && (
                  <TouchableOpacity
                    style={styles.resourceButton}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.resourceIcon, styles.resourceIconPdf]}>
                      <FileText size={24} color={Colors.white} />
                    </View>
                    <View style={styles.resourceContent}>
                      <Text style={styles.resourceTitle}>{t('projects.patternPDF')}</Text>
                      <Text style={styles.resourceSubtitle}>View full pattern</Text>
                    </View>
                    <ChevronRight size={20} color={Colors.warmGray} />
                  </TouchableOpacity>
                )}

                {project.patternUrl && (
                  <TouchableOpacity
                    style={styles.resourceButton}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.resourceIcon, styles.resourceIconLink]}>
                      <Link size={24} color={Colors.white} />
                    </View>
                    <View style={styles.resourceContent}>
                      <Text style={styles.resourceTitle}>Pattern Link</Text>
                      <Text style={styles.resourceSubtitle} numberOfLines={1}>
                        {project.patternUrl.replace(/^https?:\/\//i, '').split('/')[0]}
                      </Text>
                    </View>
                    <ExternalLink size={20} color={Colors.warmGray} />
                  </TouchableOpacity>
                )}

                {project.inspirationUrl && (
                  <TouchableOpacity
                    style={styles.resourceButton}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.resourceIcon, styles.resourceIconInspiration]}>
                      <Lightbulb size={24} color={Colors.white} />
                    </View>
                    <View style={styles.resourceContent}>
                      <Text style={styles.resourceTitle}>{t('projects.inspirationLink')}</Text>
                      <Text style={styles.resourceSubtitle} numberOfLines={1}>
                        {project.inspirationUrl.replace(/^https?:\/\//i, '').split('/')[0]}
                      </Text>
                    </View>
                    <ExternalLink size={20} color={Colors.warmGray} />
                  </TouchableOpacity>
                )}
              </View>

          <View style={styles.sectionDivider} />

          <SectionHeader title={t('projects.materialsYarn')} />

          {project.yarnUsedIds && project.yarnUsedIds.length > 0 ? (
                <View style={styles.materialsSection}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.materialsScroll}
                  >
                    {project.yarnUsedIds.map((yarnId) => {
                      const yarn = getItemById(yarnId);
                      if (!yarn) {
                        console.warn(`Yarn ${yarnId} not found in inventory!`);
                        return null;
                      }
                      return (
                        <TouchableOpacity
                          key={yarnId}
                          style={styles.materialCard}
                          onPress={() => router.push(`/inventory/${yarnId}`)}
                          activeOpacity={0.8}
                        >
                          {yarn.images && yarn.images.length > 0 ? (
                            <Image
                              source={{ uri: yarn.images[0] }}
                              style={styles.materialImage}
                              contentFit="cover"
                              transition={200}
                            />
                          ) : (
                            <View style={[styles.materialImage, styles.materialImagePlaceholder]}>
                              <FileText size={32} color={Colors.warmGray} />
                            </View>
                          )}
                          <View style={styles.usedInProjectBadge}>
                            <CheckCircle size={16} color={Colors.white} />
                          </View>
                          {yarn.yarnDetails?.brand && (
                            <View style={styles.brandBadge}>
                              <Text style={styles.brandBadgeText} numberOfLines={1}>
                                {yarn.yarnDetails.brand}
                              </Text>
                            </View>
                          )}
                          <View style={styles.materialInfo}>
                            <Text style={styles.materialName} numberOfLines={1}>
                              {yarn.name}
                            </Text>
                            <Text style={styles.materialDetail} numberOfLines={1}>
                              {yarn.yarnDetails?.colorName || yarn.yarnDetails?.fiber || yarn.yarnDetails?.weightCategory || ''}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : (
                <Text style={styles.previewEmptyText}>{t('projects.noYarnAdded')}</Text>
              )}

          {project.colorNotes && (
            <View style={styles.colorNotesContainer}>
              <Text style={styles.colorNotesText}>{project.colorNotes}</Text>
            </View>
          )}

          <View style={styles.sectionDivider} />

          <SectionHeader title={t('projects.materialsHooks')} />

          {project.hookUsedIds && project.hookUsedIds.length > 0 ? (
                <View style={styles.materialsSection}>
                  <View style={styles.hooksRow}>
                    {project.hookUsedIds.map((hookId) => {
                      const hook = getItemById(hookId);
                      if (!hook) {
                        console.warn(`Hook ${hookId} not found in inventory!`);
                        return null;
                      }
                      return (
                        <TouchableOpacity
                          key={hookId}
                          style={styles.hookCard}
                          onPress={() => router.push(`/inventory/${hookId}`)}
                          activeOpacity={0.8}
                        >
                          {hook.images && hook.images.length > 0 ? (
                            <Image
                              source={{ uri: hook.images[0] }}
                              style={styles.hookImage}
                              contentFit="contain"
                              transition={200}
                            />
                          ) : (
                            <View style={[styles.hookImage, styles.materialImagePlaceholder]}>
                              <FileText size={24} color={Colors.warmGray} />
                            </View>
                          )}
                          <View style={styles.usedInProjectBadgeSmall}>
                            <CheckCircle size={12} color={Colors.white} />
                          </View>
                          <Text style={styles.hookName} numberOfLines={1}>
                            {hook.hookDetails?.size || hook.name}
                          </Text>
                          {hook.hookDetails?.brand && (
                            <Text style={styles.hookBrand} numberOfLines={1}>
                              {hook.hookDetails.brand}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <Text style={styles.previewEmptyText}>{t('projects.noHooksAdded')}</Text>
              )}

          <View style={styles.sectionDivider} />

          {/* Project Journal Preview */}
          <TouchableOpacity
            onPress={() => router.push(`/project-journal/${project.id}`)}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('projects.projectJournal')}
            accessibilityHint={t('projects.viewFullJournal')}
          >
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <BookOpen size={20} color={Colors.deepSage} />
                <Text style={styles.sectionTitle}>{t('projects.projectJournal')}</Text>
                {project.workProgress && project.workProgress.length > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{project.workProgress.length}</Text>
                  </View>
                )}
              </View>
              <ChevronRight size={20} color={Colors.warmGray} />
            </View>
            {project.workProgress && project.workProgress.length > 0 ? (
              <View style={styles.previewContent}>
                <Text style={styles.entryDate}>
                  {new Date(project.workProgress[project.workProgress.length - 1].date).toLocaleDateString()}
                </Text>
                <Text style={styles.previewText} numberOfLines={2}>
                  {project.workProgress[project.workProgress.length - 1].notes}
                </Text>
              </View>
            ) : (
              <Text style={styles.previewEmptyText}>{t('projects.noJournalEntries')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.sectionDivider} />

          {/* Inspiration Preview */}
          <TouchableOpacity
            onPress={() => router.push(`/project-inspiration/${project.id}`)}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('projects.inspiration')}
            accessibilityHint={t('projects.viewFullInspiration')}
          >
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <Lightbulb size={20} color={Colors.deepSage} />
                <Text style={styles.sectionTitle}>{t('projects.inspiration')}</Text>
                {project.inspirationSources && project.inspirationSources.length > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{project.inspirationSources.length}</Text>
                  </View>
                )}
              </View>
              <ChevronRight size={20} color={Colors.warmGray} />
            </View>
            {project.inspirationSources && project.inspirationSources.length > 0 ? (
              <View style={styles.previewContent}>
                {project.inspirationSources[0].images && project.inspirationSources[0].images.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.inspirationImagesScroll}
                  >
                    {project.inspirationSources[0].images.slice(0, 3).map((img, index) => (
                      <Image
                        key={index}
                        source={{ uri: img }}
                        style={styles.inspirationPreviewImage}
                        contentFit="cover"
                        transition={200}
                      />
                    ))}
                  </ScrollView>
                )}
                <Text style={styles.previewText} numberOfLines={2}>
                  {project.inspirationSources[0].description || project.inspirationSources[0].patternSource || project.inspirationSources[0].url || t('projects.inspirationSourceAdded')}
                </Text>
              </View>
            ) : (
              <Text style={styles.previewEmptyText}>{t('projects.noInspirationSources')}</Text>
            )}
          </TouchableOpacity>

          {project.notes && (
            <>
              <View style={styles.sectionDivider} />

              <SectionHeader title={t('projects.notes')} />

              <Text style={styles.notes}>{project.notes}</Text>
            </>
          )}

          <View style={styles.metadata}>
            <Text style={styles.metaText}>
              {t('projects.created')}: {new Date(project.createdAt).toLocaleDateString()}
            </Text>
            <Text style={styles.metaText}>
              {t('projects.updated')}: {new Date(project.updatedAt).toLocaleDateString()}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push(`/edit-project/${project.id}`)}
            style={styles.editButton}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('common.edit')}
            accessibilityHint={`Edit ${project.title} project`}
          >
            <Text style={styles.editButtonText}>{t('common.edit')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDelete}
            style={styles.deleteButton}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('common.delete')}
            accessibilityHint={`Delete ${project.title} project permanently`}
          >
            <Trash2 size={20} color={Colors.error} />
            <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
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
  imageGalleryContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 10,
  },
  content: {
    padding: 24,
  },
  projectTitle: {
    ...Typography.title1,
    color: Colors.white,
    fontWeight: '400' as const,
    fontSize: 24,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    flex: 1,
    marginRight: 16,
  },
  imageCounter: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '500' as const,
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.warmGray,
    marginVertical: 4,
    opacity: 0.5,
  },
  photosScroll: {
    marginBottom: 16,
  },
  photosContent: {
    paddingVertical: 12,
    gap: 12,
  },
  photoPreview: {
    width: 100,
    height: 133,
    borderRadius: 12,
    marginRight: 12,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: Colors.beige,
  },
  photoPreviewImage: {
    width: '100%',
    height: '100%',
  },
  defaultBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.sage,
    borderRadius: 12,
    padding: 4,
  },

  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    minHeight: 36,
  },
  statusText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600' as const,
    fontSize: 14,
    letterSpacing: -0.1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dateText: {
    ...Typography.body,
    color: Colors.warmGray,
    fontSize: 14,
  },
  datesContainer: {
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateLabel: {
    ...Typography.body,
    color: Colors.warmGray,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  dateValue: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 14,
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.charcoal,
    fontWeight: '500' as const,
    fontSize: 18,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewContent: {
    marginTop: 8,
  },
  materialsSection: {
    marginBottom: 20,
  },
  subsectionTitle: {
    ...Typography.body,
    color: Colors.charcoal,
    fontWeight: '600' as const,
    marginBottom: 12,
    fontSize: 15,
  },
  materialsScroll: {
    paddingRight: 24,
  },
  materialCard: {
    width: 100,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.linen,
    borderWidth: normalizeBorder(0.5),
    borderColor: 'rgba(139, 154, 123, 0.12)',
  },
  materialCardUnused: {
    opacity: 0.5,
  },
  materialImage: {
    width: 100,
    height: 133,
    backgroundColor: Colors.beige,
  },
  materialImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialImageUnused: {
    opacity: 0.6,
  },
  usedInProjectBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.deepTeal,
    borderRadius: 12,
    padding: 4,
  },
  usedInProjectBadgeSmall: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.deepTeal,
    borderRadius: 10,
    padding: 3,
  },
  brandBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 100,
  },
  brandBadgeText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.charcoal,
  },
  materialInfo: {
    padding: 12,
  },
  materialName: {
    ...Typography.caption,
    color: Colors.charcoal,
    fontWeight: '600' as const,
    marginBottom: 4,
    fontSize: 13,
  },
  materialNameUnused: {
    color: Colors.warmGray,
  },
  materialDetail: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontSize: 11,
  },
  materialDetailUnused: {
    opacity: 0.7,
  },
  hooksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  hookCard: {
    width: 90,
    height: 110,
    borderRadius: 12,
    backgroundColor: Colors.linen,
    borderWidth: normalizeBorder(0.5),
    borderColor: 'rgba(139, 154, 123, 0.12)',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hookCardUnused: {
    opacity: 0.5,
  },
  hookImage: {
    width: 50,
    height: 50,
    marginBottom: 8,
  },
  hookImageUnused: {
    opacity: 0.6,
  },
  hookName: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.charcoal,
    textAlign: 'center',
  },
  hookNameUnused: {
    color: Colors.warmGray,
  },
  hookBrand: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.warmGray,
    textAlign: 'center',
    marginTop: 2,
  },
  hookBrandUnused: {
    opacity: 0.7,
  },
  colorNotesContainer: {
    marginTop: 8,
  },
  colorNotesText: {
    ...Typography.body,
    color: Colors.warmGray,
    fontSize: 14,
    fontStyle: 'italic',
  },
  patternImagesScroll: {
    marginBottom: 16,
  },
  patternImagesContent: {
    paddingRight: 24,
  },
  patternImagePreview: {
    width: 100,
    height: 133,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.beige,
  },
  patternPreviewImage: {
    width: '100%',
    height: '100%',
  },
  resourcesList: {
    gap: 12,
  },
  resourceButton: {
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
  resourceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  resourceIconPdf: {
    backgroundColor: Colors.deepTeal,
  },
  resourceIconLink: {
    backgroundColor: Colors.deepSage,
  },
  resourceIconInspiration: {
    backgroundColor: '#9C27B0',
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    ...Typography.body,
    color: Colors.charcoal,
    fontWeight: '600' as const,
    marginBottom: 4,
    fontSize: 15,
  },
  resourceSubtitle: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontSize: 13,
  },
  notes: {
    ...Typography.body,
    color: Colors.warmGray,
    lineHeight: 22,
    marginBottom: 16,
  },
  countBadge: {
    backgroundColor: Colors.deepSage,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    ...Typography.caption,
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  entryDate: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontSize: 12,
    marginBottom: 8,
  },
  previewText: {
    ...Typography.body,
    color: Colors.warmGray,
    lineHeight: 22,
  },
  previewEmptyText: {
    ...Typography.body,
    color: Colors.warmGray,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  inspirationImagesScroll: {
    marginBottom: 12,
  },
  inspirationPreviewImage: {
    width: 100,
    height: 133,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: Colors.beige,
  },
  metadata: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: normalizeBorder(0.5),
    borderTopColor: 'rgba(139, 154, 123, 0.15)',
  },
  metaText: {
    ...Typography.caption,
    color: Colors.warmGray,
    marginBottom: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: Colors.sage,
    borderRadius: 12,
    minHeight: 52,
  },
  editButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600' as const,
    fontSize: 16,
    letterSpacing: -0.1,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: normalizeBorder(1),
    borderColor: 'rgba(200, 117, 99, 0.3)',
    minHeight: 52,
  },
  deleteButtonText: {
    ...Typography.body,
    color: Colors.error,
    fontWeight: '500' as const,
    fontSize: 16,
    letterSpacing: -0.1,
  },
});