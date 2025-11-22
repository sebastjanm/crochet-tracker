import React from 'react';
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
import { useLocalSearchParams, router } from 'expo-router';
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
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ModalHeader } from '@/components/ModalHeader';
import { ImageGallery } from '@/components/ImageGallery';
import { ProjectTypeBadge } from '@/components/ProjectTypeBadge';
import { useProjects } from '@/hooks/projects-context';
import { useInventory } from '@/hooks/inventory-context';
import { useLanguage } from '@/hooks/language-context';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { normalizeBorder, cardShadow } from '@/constants/pixelRatio';
import type { ProjectStatus } from '@/types';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams();
  const { getProjectById, deleteProject } = useProjects();
  const { getItemById } = useInventory();
  const { t } = useLanguage();
  const project = getProjectById(id as string);

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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ModalHeader
        title={project.title}
        rightAction={{
          label: t('common.edit'),
          onPress: () => router.push(`/edit-project/${project.id}`),
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageGalleryContainer}>
          <ImageGallery
            images={project.images}
            editable={false}
          />
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

          {project.startDate && (
            <View style={styles.dateContainer}>
              <Calendar size={16} color={Colors.warmGray} />
              <Text style={styles.dateText}>
                {t('projects.started')}: {new Date(project.startDate).toLocaleDateString()}
              </Text>
            </View>
          )}

          {(project.yarnUsedIds?.length || project.hookUsedIds?.length || project.colorNotes) && (
            <Card style={styles.materialsCard}>
              <Text style={styles.sectionTitle}>{t('projects.materials')}</Text>

              {project.yarnUsedIds && project.yarnUsedIds.length > 0 && (
                <View style={styles.materialsSection}>
                  <Text style={styles.subsectionTitle}>{t('projects.yarnUsed')}</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.materialsScroll}
                  >
                    {project.yarnUsedIds.map((yarnId) => {
                      const yarn = getItemById(yarnId);
                      if (!yarn) return null;
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
              )}

              {project.hookUsedIds && project.hookUsedIds.length > 0 && (
                <View style={styles.materialsSection}>
                  <Text style={styles.subsectionTitle}>{t('projects.hookUsed')}</Text>
                  <View style={styles.hooksRow}>
                    {project.hookUsedIds.map((hookId) => {
                      const hook = getItemById(hookId);
                      if (!hook) return null;
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
              )}

              {project.colorNotes && (
                <View style={styles.colorNotesContainer}>
                  <Text style={styles.subsectionTitle}>{t('projects.colorNotes')}</Text>
                  <Text style={styles.colorNotesText}>{project.colorNotes}</Text>
                </View>
              )}
            </Card>
          )}

          {(project.patternPdf || project.patternUrl || project.patternImages?.length || project.inspirationUrl) && (
            <Card style={styles.patternCard}>
              <Text style={styles.sectionTitle}>{t('projects.pattern')}</Text>

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
            </Card>
          )}

          {project.notes && (
            <Card style={styles.notesCard}>
              <Text style={styles.sectionTitle}>{t('projects.notes')}</Text>
              <Text style={styles.notes}>{project.notes}</Text>
            </Card>
          )}

          {/* Project Journal Preview */}
          <TouchableOpacity
            style={styles.previewCard}
            onPress={() => router.push(`/project-journal/${project.id}`)}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('projects.projectJournal')}
            accessibilityHint={t('projects.viewFullJournal')}
          >
            <View style={styles.previewHeader}>
              <View style={styles.previewTitleContainer}>
                <BookOpen size={20} color={Colors.deepSage} />
                <Text style={styles.previewTitle}>{t('projects.projectJournal')}</Text>
                {project.workProgress && project.workProgress.length > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{project.workProgress.length}</Text>
                  </View>
                )}
              </View>
              <ChevronRight size={20} color={Colors.warmGray} />
            </View>
            {project.workProgress && project.workProgress.length > 0 ? (
              <>
                <Text style={styles.entryDate}>
                  {new Date(project.workProgress[project.workProgress.length - 1].date).toLocaleDateString()}
                </Text>
                <Text style={styles.previewText} numberOfLines={2}>
                  {project.workProgress[project.workProgress.length - 1].notes}
                </Text>
              </>
            ) : (
              <Text style={styles.previewEmptyText}>{t('projects.noJournalEntries')}</Text>
            )}
            <View style={styles.previewFooter}>
              <Text style={styles.viewAllText}>View all entries</Text>
              <ChevronRight size={16} color={Colors.deepSage} />
            </View>
          </TouchableOpacity>

          {/* Inspiration Preview */}
          <TouchableOpacity
            style={styles.previewCard}
            onPress={() => router.push(`/project-inspiration/${project.id}`)}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('projects.inspiration')}
            accessibilityHint={t('projects.viewFullInspiration')}
          >
            <View style={styles.previewHeader}>
              <View style={styles.previewTitleContainer}>
                <Lightbulb size={20} color={Colors.deepSage} />
                <Text style={styles.previewTitle}>{t('projects.inspiration')}</Text>
                {project.inspirationSources && project.inspirationSources.length > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{project.inspirationSources.length}</Text>
                  </View>
                )}
              </View>
              <ChevronRight size={20} color={Colors.warmGray} />
            </View>
            {project.inspirationSources && project.inspirationSources.length > 0 ? (
              <>
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
              </>
            ) : (
              <Text style={styles.previewEmptyText}>{t('projects.noInspirationSources')}</Text>
            )}
            <View style={styles.previewFooter}>
              <Text style={styles.viewAllText}>View all sources</Text>
              <ChevronRight size={16} color={Colors.deepSage} />
            </View>
          </TouchableOpacity>

          {/* Timeline */}
          {(project.startDate || project.completedDate) && (
            <Card style={styles.timelineCard}>
              <Text style={styles.sectionTitle}>Timeline</Text>
              <View style={styles.timeline}>
                {project.startDate && (
                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, styles.timelineDotActive]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineLabel}>{t('projects.started')}</Text>
                      <Text style={styles.timelineDate}>
                        {new Date(project.startDate).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.timelineItem}>
                  <View style={[
                    styles.timelineDot,
                    project.status === 'completed' && styles.timelineDotActive,
                  ]} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineLabel}>{getStatusLabel(project.status)}</Text>
                    {project.status === 'completed' && project.completedDate && (
                      <Text style={styles.timelineDate}>
                        {new Date(project.completedDate).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </Card>
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
  },
  content: {
    padding: 24,
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
  sectionTitle: {
    ...Typography.title3,
    color: Colors.charcoal,
    fontWeight: '500' as const,
    fontSize: 18,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  materialsCard: {
    marginBottom: 16,
    overflow: 'visible',
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
    width: 120,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    ...cardShadow,
  },
  materialImage: {
    width: 120,
    height: 120,
    backgroundColor: Colors.beige,
  },
  materialImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
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
  materialDetail: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontSize: 11,
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
    backgroundColor: Colors.white,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  hookImage: {
    width: 50,
    height: 50,
    marginBottom: 8,
  },
  hookName: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.charcoal,
    textAlign: 'center',
  },
  hookBrand: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.warmGray,
    textAlign: 'center',
    marginTop: 2,
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
  patternCard: {
    marginBottom: 16,
    overflow: 'visible',
  },
  patternImagesScroll: {
    marginBottom: 16,
  },
  patternImagesContent: {
    paddingRight: 24,
  },
  patternImagePreview: {
    width: 150,
    height: 200,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.beige,
    ...cardShadow,
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
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.border,
    ...cardShadow,
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
  notesCard: {
    marginBottom: 16,
  },
  notes: {
    ...Typography.body,
    color: Colors.warmGray,
    lineHeight: 22,
  },
  previewCard: {
    backgroundColor: Colors.linen,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: normalizeBorder(0.5),
    borderColor: 'rgba(139, 154, 123, 0.12)',
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  previewTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewTitle: {
    ...Typography.title3,
    color: Colors.charcoal,
    fontWeight: '500' as const,
    fontSize: 16,
    letterSpacing: -0.2,
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
  previewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: normalizeBorder(0.5),
    borderTopColor: 'rgba(139, 154, 123, 0.15)',
  },
  viewAllText: {
    ...Typography.caption,
    color: Colors.deepSage,
    fontWeight: '600' as const,
    fontSize: 13,
  },
  inspirationImagesScroll: {
    marginBottom: 12,
  },
  inspirationPreviewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: Colors.beige,
  },
  timelineCard: {
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.warmGray,
    backgroundColor: Colors.cream,
    marginRight: 16,
    marginTop: 2,
  },
  timelineDotActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    ...Typography.body,
    color: Colors.charcoal,
    fontWeight: '500' as const,
    marginBottom: 4,
    fontSize: 15,
  },
  timelineDate: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontSize: 13,
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 40,
    marginBottom: 32,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: normalizeBorder(1),
    borderColor: 'rgba(200, 117, 99, 0.3)',
    minHeight: 52,
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
  },
  deleteButtonText: {
    ...Typography.body,
    color: Colors.error,
    fontWeight: '500' as const,
    fontSize: 16,
    letterSpacing: -0.1,
  },
});