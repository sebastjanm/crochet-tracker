import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
  Edit,
  Trash2,
  Link,
  FileText,
  CheckCircle,
  Clock,
  Lightbulb,
  Calendar,
} from 'lucide-react-native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ModalHeader } from '@/components/ModalHeader';
import { ImageGallery } from '@/components/ImageGallery';
import { ProjectTypeBadge } from '@/components/ProjectTypeBadge';
import { useProjects } from '@/hooks/projects-context';
import { useLanguage } from '@/hooks/language-context';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import type { ProjectStatus } from '@/types';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams();
  const { getProjectById, deleteProject, updateProject } = useProjects();
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
          text: t('projects.idea'),
          onPress: async () => await updateProject(project.id, { status: 'idea' as ProjectStatus }),
        },
        {
          text: t('projects.inProgress'),
          onPress: async () => await updateProject(project.id, { status: 'in-progress' as ProjectStatus }),
        },
        {
          text: t('projects.completed'),
          onPress: async () => await updateProject(project.id, { status: 'completed' as ProjectStatus }),
        },
        {
          text: t('projects.maybeSomeday'),
          onPress: async () => await updateProject(project.id, { status: 'maybe-someday' as ProjectStatus }),
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
      case 'idea':
        return '#FFB84D';
      case 'in-progress':
        return Colors.sage;
      case 'completed':
        return '#4CAF50';
      case 'maybe-someday':
        return '#9C27B0';
      default:
        return Colors.sage;
    }
  };

  const getStatusIcon = (status: ProjectStatus) => {
    switch (status) {
      case 'idea':
        return <Lightbulb size={16} color={Colors.white} />;
      case 'in-progress':
        return <Clock size={16} color={Colors.white} />;
      case 'completed':
        return <CheckCircle size={16} color={Colors.white} />;
      case 'maybe-someday':
        return <Calendar size={16} color={Colors.white} />;
      default:
        return <Clock size={16} color={Colors.white} />;
    }
  };

  const getStatusLabel = (status: ProjectStatus): string => {
    switch (status) {
      case 'idea':
        return t('projects.idea');
      case 'in-progress':
        return t('projects.inProgress');
      case 'completed':
        return t('projects.completed');
      case 'maybe-someday':
        return t('projects.maybeSomeday');
      default:
        return t('projects.inProgress');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ModalHeader title={project.title} />
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/edit-project/${project.id}`)}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t('common.edit')}
          accessibilityHint={`Edit ${project.title} project details`}
        >
          <Edit size={20} color={Colors.charcoal} />
          <Text style={styles.actionText}>{t('common.edit')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleDelete}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t('common.delete')}
          accessibilityHint={`Delete ${project.title} project permanently`}
        >
          <Trash2 size={20} color={Colors.error} />
          <Text style={[styles.actionText, { color: Colors.error }]}>{t('common.delete')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageGalleryContainer}>
          <ImageGallery
            images={project.images}
            onImagesChange={(images) => updateProject(project.id, { images })}
            editable={true}
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

          <Card style={styles.descriptionCard}>
            <Text style={styles.sectionTitle}>{t('projects.description')}</Text>
            <Text style={styles.description}>{project.description}</Text>
          </Card>

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

          <View style={styles.metadata}>
            <Text style={styles.metaText}>
              {t('projects.created')}: {new Date(project.createdAt).toLocaleDateString()}
            </Text>
            <Text style={styles.metaText}>
              {t('projects.updated')}: {new Date(project.updatedAt).toLocaleDateString()}
            </Text>
          </View>
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
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.cream,
    borderRadius: 8,
    minHeight: 44,
    minWidth: 44,
  },
  actionText: {
    ...Typography.body,
    color: Colors.charcoal,
    fontWeight: '500',
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
    padding: 16,
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  statusText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
    fontSize: 13,
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
  descriptionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.charcoal,
    marginBottom: 8,
  },
  description: {
    ...Typography.bodyLarge,
    color: Colors.warmGray,
    lineHeight: 24,
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
  metadata: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.warmGray,
    marginBottom: 4,
  },
});