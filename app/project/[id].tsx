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
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import {
  Trash2,
  Link,
  FileText,
  CheckCircle,
  Clock,
  Lightbulb,
  PauseCircle,
  RotateCcw,
  BookOpen,
  ChevronRight,
  ExternalLink,
  Pencil,
  Lock,
  StickyNote,
} from 'lucide-react-native';
import { Button } from '@/components/Button';
import { UniversalHeader } from '@/components/UniversalHeader';
import { ImageGallery } from '@/components/ImageGallery';
import { SectionHeader } from '@/components/SectionHeader';
import { useProjects } from '@/hooks/projects-context';
import { useInventory } from '@/hooks/inventory-context';
import { useLanguage } from '@/hooks/language-context';
import { useAuth } from '@/hooks/auth-context';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { normalizeBorder, normalizeBorderOpacity } from '@/constants/pixelRatio';
import type { ProjectStatus, Project } from '@/types';
import { getImageSource } from '@/types';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams();
  const { getProjectById, deleteProject } = useProjects();
  const { getItemById, getItemsByCategory } = useInventory();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [project, setProject] = useState(getProjectById(id as string));

  // Check if user is Pro
  const isPro = user?.isPro === true;
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
      case 'to-do':
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
      case 'to-do':
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
      case 'to-do':
        return t('projects.toDo');
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
    <View style={styles.backgroundContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerWrapper}>
          <UniversalHeader
            title=""
            showBack={true}
            backLabel={t('common.back')}
            showHelp={true}
            helpSection="projects"
          />
        </View>
      </SafeAreaView>

      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image with title overlay (Apple HIG style) */}
        {project.images && project.images.length > 0 ? (
          <View style={styles.imageGalleryContainer}>
            <ImageGallery
              images={project.images}
              editable={false}
              showCounter={false}
              onIndexChange={setCurrentImageIndex}
            />
            {/* Title overlay with gradient */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.titleOverlay}
              pointerEvents="none"
            >
              <View style={styles.titleOverlayContent}>
                <Text style={styles.projectTitle} numberOfLines={2}>{project.title}</Text>
                {project.projectType && (
                  <Text style={styles.projectTypeSubtitle}>
                    {t(`projects.projectTypes.${project.projectType}`)}
                  </Text>
                )}
              </View>
              {project.images.length > 1 && (
                <Text style={styles.imageCounter}>
                  {currentImageIndex + 1}/{project.images.length}
                </Text>
              )}
            </LinearGradient>
          </View>
        ) : (
          /* Large title when no images (Apple HIG pattern) */
          <View style={styles.noImageTitleContainer}>
            <Text style={styles.largeTitle}>{project.title}</Text>
            {project.projectType && (
              <Text style={styles.projectTypeSubtitleDark}>
                {t(`projects.projectTypes.${project.projectType}`)}
              </Text>
            )}
          </View>
        )}

        <View style={styles.content}>
          {/* Combined Info Section */}
          <View style={styles.infoSection}>
            {/* Status Row */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('projects.status')}</Text>
              <View
                style={styles.statusValue}
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel={`${t('projects.status')}: ${getStatusLabel(project.status)}`}
              >
                {getStatusIcon(project.status)}
                <Text style={[styles.infoValue, { color: getStatusColor(project.status) }]}>
                  {getStatusLabel(project.status)}
                </Text>
              </View>
            </View>

            {/* Start Date Row */}
            {project.startDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('projects.started')}</Text>
                <Text style={styles.infoValue}>
                  {new Date(project.startDate).toLocaleDateString()}
                </Text>
              </View>
            )}

            {/* Completed Date Row */}
            {project.status === 'completed' && project.completedDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('projects.completedDate')}</Text>
                <Text style={styles.infoValue}>
                  {new Date(project.completedDate).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>

          {/* Pattern Section - only show if has content */}
          {((project.patternImages && project.patternImages.length > 0) ||
            project.patternPdf ||
            project.patternUrl ||
            project.inspirationUrl) && (
          <>
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
          </>
          )}

          {/* Yarn Section */}
          {((project.yarnMaterials && project.yarnMaterials.length > 0) ||
            (project.yarnUsedIds && project.yarnUsedIds.length > 0)) && (
          <>
          <SectionHeader title={t('projects.materialsYarn')} />
                <View style={styles.yarnSection}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.materialsScroll}
                  >
                    {(project.yarnMaterials || project.yarnUsedIds?.map(id => ({ itemId: id, quantity: 1 })) || []).map((yarnEntry) => {
                      const yarnId = typeof yarnEntry === 'string' ? yarnEntry : yarnEntry.itemId;
                      const quantity = typeof yarnEntry === 'string' ? 1 : yarnEntry.quantity;
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
                              source={getImageSource(yarn.images[0])}
                              style={styles.materialImage}
                              contentFit="cover"
                              transition={200}
                            />
                          ) : (
                            <View style={[styles.materialImage, styles.materialImagePlaceholder]}>
                              <FileText size={32} color={Colors.warmGray} />
                            </View>
                          )}
                          {/* Quantity badge */}
                          <View style={styles.quantityBadge}>
                            <Text style={styles.quantityBadgeText}>×{quantity}</Text>
                          </View>
                          {yarn.yarnDetails?.brand?.name && (
                            <View style={styles.brandBadge}>
                              <Text style={styles.brandBadgeText} numberOfLines={1}>
                                {yarn.yarnDetails.brand.name}
                              </Text>
                            </View>
                          )}
                          <View style={styles.materialInfo}>
                            <Text style={styles.materialName} numberOfLines={1}>
                              {yarn.name}
                            </Text>
                            <Text style={styles.materialDetail} numberOfLines={1}>
                              {yarn.yarnDetails?.colorName || yarn.yarnDetails?.weight?.name || ''}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
          </>
          )}

          {/* Hooks Section */}
          {project.hookUsedIds && project.hookUsedIds.length > 0 && (
          <>
          <SectionHeader title={t('projects.materialsHooks')} />
                <View style={styles.hooksList}>
                  {project.hookUsedIds.map((hookId, index) => {
                    const hook = getItemById(hookId);
                    if (!hook) {
                      console.warn(`Hook ${hookId} not found in inventory!`);
                      return null;
                    }
                    const isLast = index === project.hookUsedIds!.length - 1;
                    return (
                      <TouchableOpacity
                        key={hookId}
                        style={[styles.hookListRow, !isLast && styles.hookListRowBorder]}
                        onPress={() => router.push(`/inventory/${hookId}`)}
                        activeOpacity={0.7}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={`${hook.hookDetails?.size || hook.name}${hook.hookDetails?.brand ? `, ${hook.hookDetails.brand}` : ''}`}
                      >
                        {hook.images && hook.images.length > 0 ? (
                          <Image
                            source={getImageSource(hook.images[0])}
                            style={styles.hookListThumb}
                            contentFit="cover"
                            transition={200}
                          />
                        ) : (
                          <View style={[styles.hookListThumb, styles.hookListThumbPlaceholder]}>
                            <FileText size={18} color={Colors.warmGray} />
                          </View>
                        )}
                        <View style={styles.hookListInfo}>
                          <Text style={styles.hookListSize} numberOfLines={1}>
                            {hook.hookDetails?.size || hook.name}
                          </Text>
                          {(hook.hookDetails?.brand || hook.hookDetails?.material) && (
                            <Text style={styles.hookListBrand} numberOfLines={1}>
                              {[hook.hookDetails?.brand, hook.hookDetails?.material].filter(Boolean).join(' · ')}
                            </Text>
                          )}
                        </View>
                        <ChevronRight size={18} color={Colors.warmGray} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
          </>
          )}

          {/* PRO Features Section */}
          <SectionHeader title={t('projects.proSection')} />

          {/* PRO Feature Rows */}
          <View style={styles.proFeaturesList}>
            {/* Project Journal Row */}
            <TouchableOpacity
              onPress={() => router.push(`/project-journal/${project.id}`)}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`${t('projects.projectJournal')}${!isPro ? ` - ${t('projects.proFeature')}` : ''}`}
              style={styles.proFeatureRow}
            >
              <BookOpen size={20} color={Colors.deepSage} />
              <Text style={styles.proFeatureTitle}>{t('projects.projectJournal')}</Text>
              {!isPro ? (
                <View style={styles.proBadge}>
                  <Lock size={10} color={Colors.white} />
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              ) : project.workProgress && project.workProgress.length > 0 ? (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{project.workProgress.length}</Text>
                </View>
              ) : null}
              <ChevronRight size={18} color={Colors.warmGray} />
            </TouchableOpacity>

            {/* Inspiration Row */}
            <TouchableOpacity
              onPress={() => router.push(`/project-inspiration/${project.id}`)}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`${t('projects.inspiration')}${!isPro ? ` - ${t('projects.proFeature')}` : ''}`}
              style={styles.proFeatureRow}
            >
              <Lightbulb size={20} color={Colors.deepSage} />
              <Text style={styles.proFeatureTitle}>{t('projects.inspiration')}</Text>
              {!isPro ? (
                <View style={styles.proBadge}>
                  <Lock size={10} color={Colors.white} />
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              ) : project.inspirationSources && project.inspirationSources.length > 0 ? (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{project.inspirationSources.length}</Text>
                </View>
              ) : null}
              <ChevronRight size={18} color={Colors.warmGray} />
            </TouchableOpacity>

            {/* Notes Row */}
            <TouchableOpacity
              onPress={() => router.push(`/edit-project/${project.id}`)}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`${t('projects.notes')}${!isPro ? ` - ${t('projects.proFeature')}` : ''}`}
              style={[styles.proFeatureRow, styles.proFeatureRowLast]}
            >
              <StickyNote size={20} color={Colors.deepSage} />
              <Text style={styles.proFeatureTitle}>{t('projects.notes')}</Text>
              {!isPro && (
                <View style={styles.proBadge}>
                  <Lock size={10} color={Colors.white} />
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
              {isPro && project.notes && (
                <Text style={styles.proFeatureSubtitle} numberOfLines={1}>
                  {project.notes.substring(0, 30)}{project.notes.length > 30 ? '...' : ''}
                </Text>
              )}
              <ChevronRight size={18} color={Colors.warmGray} />
            </TouchableOpacity>
          </View>

          <View style={styles.metadata}>
            <Text style={styles.metaText}>
              {t('projects.created')}: {new Date(project.createdAt).toLocaleDateString()}
            </Text>
            <Text style={styles.metaText}>
              {t('projects.updated')}: {new Date(project.updatedAt).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              onPress={() => router.push(`/edit-project/${project.id}`)}
              style={styles.editButton}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('common.edit')}
              accessibilityHint={`Edit ${project.title} project`}
            >
              <Pencil size={20} color={Colors.deepSage} />
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
        </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    backgroundColor: Colors.headerBg,
  },
  safeArea: {
    backgroundColor: Colors.headerBg,
  },
  headerWrapper: {
    backgroundColor: Colors.headerBg,
    paddingVertical: 12,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.beige,
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
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 16,
    zIndex: 10,
  },
  noImageTitleContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  largeTitle: {
    ...Typography.largeTitle,
    color: Colors.charcoal,
  },
  content: {
    padding: 16,
  },
  projectTitle: {
    ...Typography.title1,
    color: Colors.white,
    fontWeight: '700' as const,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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

  titleOverlayContent: {
    flex: 1,
    marginRight: 16,
  },
  projectTypeSubtitle: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  projectTypeSubtitleDark: {
    ...Typography.body,
    color: Colors.warmGray,
    fontSize: 15,
    marginTop: 4,
  },
  infoSection: {
    marginBottom: 16,
    paddingBottom: 16,
    gap: 12,
    borderBottomWidth: normalizeBorder(0.5),
    borderBottomColor: `rgba(0, 0, 0, ${normalizeBorderOpacity(0.15)})`,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 24,
  },
  infoLabel: {
    ...Typography.body,
    color: Colors.warmGray,
    fontSize: 15,
  },
  infoValue: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 15,
    fontWeight: '500' as const,
  },
  statusValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  yarnSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: normalizeBorder(0.5),
    borderBottomColor: `rgba(0, 0, 0, ${normalizeBorderOpacity(0.15)})`,
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
    width: 140,
    marginRight: 12,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: Colors.linen,
    borderWidth: normalizeBorder(0.5),
    borderColor: 'rgba(139, 154, 123, 0.12)',
  },
  materialCardUnused: {
    opacity: 0.5,
  },
  materialImage: {
    width: 140,
    height: 187,
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
  quantityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.deepSage,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  quantityBadgeText: {
    ...Typography.caption,
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600' as const,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    maxWidth: 124,
  },
  brandBadgeText: {
    ...Typography.caption,
    fontSize: 12,
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
    fontSize: 14,
  },
  materialNameUnused: {
    color: Colors.warmGray,
  },
  materialDetail: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontSize: 12,
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
  // Hook list row styles
  hooksList: {
    gap: 8,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: normalizeBorder(0.5),
    borderBottomColor: `rgba(0, 0, 0, ${normalizeBorderOpacity(0.15)})`,
  },
  hookListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    minHeight: 56,
    gap: 12,
  },
  hookListRowBorder: {
    borderBottomWidth: normalizeBorder(1),
    borderBottomColor: Colors.border,
  },
  hookListThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.linen,
  },
  hookListThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hookListInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  hookListSize: {
    ...Typography.body,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.charcoal,
  },
  hookListBrand: {
    ...Typography.caption,
    fontSize: 13,
    color: Colors.warmGray,
    marginTop: 2,
  },
  patternImagesScroll: {
    marginBottom: 8,
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
    gap: 10,
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: normalizeBorder(0.5),
    borderBottomColor: `rgba(0, 0, 0, ${normalizeBorderOpacity(0.15)})`,
  },
  resourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
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
  // PRO Features List Styles
  proFeaturesList: {
    marginBottom: 16,
  },
  proFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    minHeight: 52,
    borderBottomWidth: normalizeBorder(0.5),
    borderBottomColor: `rgba(0, 0, 0, ${normalizeBorderOpacity(0.15)})`,
  },
  proFeatureRowLast: {
    borderBottomWidth: 0,
  },
  proFeatureTitle: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 16,
    fontWeight: '500' as const,
    flex: 1,
  },
  proFeatureSubtitle: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontSize: 13,
    maxWidth: 120,
  },
  countBadge: {
    backgroundColor: Colors.deepSage,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
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
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.sage,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  proBadgeText: {
    ...Typography.caption,
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  metadata: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: normalizeBorder(1),
    borderTopColor: Colors.border,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.warmGray,
    marginBottom: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.deepSage,
    minHeight: 52,
  },
  editButtonText: {
    ...Typography.body,
    color: Colors.deepSage,
    fontWeight: '500' as const,
    fontSize: 16,
    letterSpacing: -0.1,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: normalizeBorder(1),
    borderColor: `rgba(200, 117, 99, ${normalizeBorderOpacity(0.3)})`,
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