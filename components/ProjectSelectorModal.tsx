import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { X, Check, Search, FolderGit2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { useProjects } from '@/providers/ProjectsProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import type { Project } from '@/types';
import { getImageSource } from '@/types';

interface ProjectSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  selectedProjectIds: string[];
  onSelectionChange: (projectIds: string[]) => void;
  title?: string;
}

const STATUS_COLORS: Record<string, string> = {
  'to-do': '#FFB84D',
  'in-progress': Colors.sage,
  'on-hold': '#9C27B0',
  completed: Colors.deepSage,
  frogged: '#E57373',
};

function ProjectListItem({
  project,
  isSelected,
  onToggle,
  t,
}: {
  project: Project;
  isSelected: boolean;
  onToggle: () => void;
  t: (key: string) => string;
}) {
  const statusColor = STATUS_COLORS[project.status] || Colors.warmGray;
  // Convert kebab-case to camelCase: in-progress → inProgress, on-hold → onHold
  const statusKey = project.status.replace(/-(.)/g, (_, c) => c.toUpperCase());
  const statusLabel = t(`projects.${statusKey}`) || project.status;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.option,
        pressed && styles.optionPressed,
        isSelected && styles.optionSelected,
      ]}
      onPress={onToggle}
      accessible={true}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={`${project.title}, ${statusLabel}`}
    >
      <View style={styles.optionContent}>
        {project.images && project.images.length > 0 ? (
          <Image
            source={getImageSource(project.images[0])}
            style={styles.optionImage}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.optionImage, styles.placeholderImage]}>
            <FolderGit2 size={24} color={Colors.warmGray} />
          </View>
        )}
        <View style={styles.optionText}>
          <Text
            style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}
            numberOfLines={1}
          >
            {project.title}
          </Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text
              style={[styles.optionSubtitle, isSelected && styles.optionSubtitleSelected]}
            >
              {statusLabel}
            </Text>
          </View>
        </View>
        {isSelected && <Check size={24} color={Colors.white} strokeWidth={3} />}
      </View>
    </Pressable>
  );
}

export function ProjectSelectorModal({
  visible,
  onClose,
  selectedProjectIds,
  onSelectionChange,
  title,
}: ProjectSelectorModalProps) {
  const { projects } = useProjects();
  const { t } = useLanguage();
  const [localSelection, setLocalSelection] = useState<string[]>(selectedProjectIds);
  const [searchQuery, setSearchQuery] = useState('');

  // Reset local state when modal opens
  React.useEffect(() => {
    if (visible) {
      setLocalSelection(selectedProjectIds);
      setSearchQuery('');
    }
  }, [visible, selectedProjectIds]);

  // Filter projects by search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter((p) => p.title.toLowerCase().includes(query));
  }, [projects, searchQuery]);

  const handleToggle = useCallback((projectId: string) => {
    setLocalSelection((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  }, []);

  const handleDone = () => {
    onSelectionChange(localSelection);
    onClose();
  };

  const handleCancel = () => {
    setLocalSelection(selectedProjectIds);
    onClose();
  };


  const renderItem = useCallback(
    ({ item }: { item: Project }) => (
      <ProjectListItem
        project={item}
        isSelected={localSelection.includes(item.id)}
        onToggle={() => handleToggle(item.id)}
        t={t}
      />
    ),
    [localSelection, handleToggle, t]
  );

  const keyExtractor = useCallback((item: Project) => item.id, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <SafeAreaView style={styles.modal} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={handleCancel}
            style={styles.modalButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
          >
            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.modalTitle}>{title || t('inventory.selectProjects')}</Text>
            {localSelection.length > 0 && (
              <Text style={styles.selectedCount}>
                {t('inventory.projectsSelected', { count: localSelection.length })}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={handleDone}
            style={styles.modalButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('common.done')}
          >
            <Text style={styles.doneButtonText}>{t('common.done')}</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.warmGray} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('inventory.searchProjects')}
            placeholderTextColor={Colors.warmGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={Colors.warmGray} />
            </TouchableOpacity>
          )}
        </View>

        {/* Project List */}
        {projects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FolderGit2 size={48} color={Colors.warmGray} />
            <Text style={styles.emptyText}>{t('inventory.noProjectsYet')}</Text>
          </View>
        ) : filteredProjects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Search size={48} color={Colors.warmGray} />
            <Text style={styles.emptyText}>{t('inventory.noProjectsFound')}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredProjects}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            windowSize={10}
            maxToRenderPerBatch={10}
            removeClippedSubviews={true}
            initialNumToRender={10}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  modalButton: {
    minWidth: 60,
    minHeight: 44,
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 16,
  },
  doneButtonText: {
    ...Typography.body,
    color: Colors.sage,
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'right',
  },
  modalTitle: {
    ...Typography.title3,
    color: Colors.charcoal,
    fontWeight: '600' as const,
  },
  selectedCount: {
    ...Typography.caption,
    color: Colors.sage,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 16,
    padding: 0,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 32,
  },
  option: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    minHeight: 80,
  },
  optionPressed: {
    backgroundColor: Colors.beige,
  },
  optionSelected: {
    backgroundColor: Colors.sage,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 80,
  },
  optionImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: Colors.beige,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
    marginRight: 12,
  },
  optionLabel: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 16,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  optionLabelSelected: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  optionSubtitle: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontSize: 13,
  },
  optionSubtitleSelected: {
    color: Colors.white,
    opacity: 0.9,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.warmGray,
    textAlign: 'center',
  },
});
