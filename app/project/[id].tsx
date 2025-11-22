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
  const { getProjectById, deleteProject, updateProject } = useProjects();
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

  const handleStatusChange = () => {
    Alert.alert(
      t('projects.changeStatus'),
      t('projects.selectNewStatus'),
      [
        {
          text: t('projects.planning'),
          onPress: async () => await updateProject(project.id, { status: 'planning' as ProjectStatus }),
        },
        {
          text: t('projects.inProgress'),
          onPress: async () => await updateProject(project.id, { status: 'in-progress' as ProjectStatus }),
        },
        {
          text: t('projects.onHold'),
          onPress: async () => await updateProject(project.id, { status: 'on-hold' as ProjectStatus }),
        },
        {
          text: t('projects.completed'),
          onPress: async () => await updateProject(project.id, { status: 'completed' as ProjectStatus }),
        },
        {
          text: t('projects.frogged'),
          onPress: async () => await updateProject(project.id, { status: 'frogged' as ProjectStatus }),
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
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

            <TouchableOpacity
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(project.status) },
              ]}
              onPress={handleStatusChange}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={getStatusLabel(project.status)}
              accessibilityHint={`Change project status. Currently ${getStatusLabel(project.status)}`}
            >
              {getStatusIcon(project.status)}
              <Text style={styles.statusText}>
                {getStatusLabel(project.status)}
              </Text>
            </TouchableOpacity>
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
                <View style={styles.materialItem}>
                  <Text style={styles.materialLabel}>{t('projects.yarnUsed')}:</Text>
                  <View style={styles.yarnList}>
                    {project.yarnUsedIds.map((yarnId) => {
                      const yarn = getItemById(yarnId);
                      if (!yarn) return null;
                      return (
                        <TouchableOpacity
                          key={yarnId}
                          style={styles.yarnChip}
                          onPress={() => router.push(`/inventory/${yarnId}`)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.yarnChipText}>{yarn.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {project.hookUsedIds && project.hookUsedIds.length > 0 && (
                <View style={styles.materialItem}>
                  <Text style={styles.materialLabel}>{t('projects.hookUsed')}:</Text>
                  <View style={styles.yarnList}>
                    {project.hookUsedIds.map((hookId) => {
                      const hook = getItemById(hookId);
                      if (!hook) return null;
                      return (
                        <TouchableOpacity
                          key={hookId}
                          style={styles.yarnChip}
                          onPress={() => router.push(`/inventory/${hookId}`)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.yarnChipText}>{hook.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {project.colorNotes && (
                <View style={styles.materialItem}>
                  <Text style={styles.materialLabel}>{t('projects.colorNotes')}:</Text>
                  <Text style={styles.materialValue}>{project.colorNotes}</Text>
                </View>
              )}
            </Card>
          )}

          {(project.patternPdf || project.inspirationUrl) && (
            <Card style={styles.linksCard}>
              <Text style={styles.sectionTitle}>{t('projects.resources')}</Text>
              {project.patternPdf && (
                <TouchableOpacity
                  style={styles.linkItem}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t('projects.patternPDF')}
                  accessibilityHint="Open pattern PDF file"
                >
                  <FileText size={20} color={Colors.teal} />
                  <Text style={styles.linkText}>{t('projects.patternPDF')}</Text>
                </TouchableOpacity>
              )}
              {project.inspirationUrl && (
                <TouchableOpacity
                  style={styles.linkItem}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t('projects.inspirationLink')}
                  accessibilityHint="Open inspiration link in browser"
                >
                  <Link size={20} color={Colors.teal} />
                  <Text style={styles.linkText}>{t('projects.inspirationLink')}</Text>
                </TouchableOpacity>
              )}
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
                <BookOpen size={20} color={Colors.sage} />
                <Text style={styles.previewTitle}>{t('projects.projectJournal')}</Text>
              </View>
              <ChevronRight size={20} color={Colors.warmGray} />
            </View>
            {project.workProgress && project.workProgress.length > 0 ? (
              <Text style={styles.previewText} numberOfLines={2}>
                {project.workProgress[project.workProgress.length - 1].notes}
              </Text>
            ) : (
              <Text style={styles.previewEmptyText}>{t('projects.noJournalEntries')}</Text>
            )}
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
                <Lightbulb size={20} color={Colors.sage} />
                <Text style={styles.previewTitle}>{t('projects.inspiration')}</Text>
              </View>
              <ChevronRight size={20} color={Colors.warmGray} />
            </View>
            {project.inspirationSources && project.inspirationSources.length > 0 ? (
              <Text style={styles.previewText} numberOfLines={2}>
                {project.inspirationSources[0].description || project.inspirationSources[0].patternSource || project.inspirationSources[0].url || t('projects.inspirationSourceAdded')}
              </Text>
            ) : (
              <Text style={styles.previewEmptyText}>{t('projects.noInspirationSources')}</Text>
            )}
          </TouchableOpacity>

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
  },
  materialItem: {
    marginBottom: 12,
  },
  materialLabel: {
    ...Typography.body,
    color: Colors.charcoal,
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  materialValue: {
    ...Typography.body,
    color: Colors.teal,
    textDecorationLine: 'underline',
  },
  materialDeletedValue: {
    ...Typography.body,
    color: Colors.warmGray,
    fontStyle: 'italic',
  },
  yarnList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  yarnChip: {
    backgroundColor: Colors.sage,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minHeight: 32,
    justifyContent: 'center',
  },
  yarnChipText: {
    ...Typography.body,
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: -0.1,
  },
  linksCard: {
    marginBottom: 16,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  linkText: {
    ...Typography.body,
    color: Colors.teal,
    textDecorationLine: 'underline',
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