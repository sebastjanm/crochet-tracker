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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Plus, Trash2, BookOpen } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ModalHeader } from '@/components/ModalHeader';
import { EmptyState } from '@/components/EmptyState';
import { LockedProFeature } from '@/components/LockedProFeature';
import { useProjects } from '@/providers/ProjectsProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import type { WorkProgressEntry } from '@/types';
import { normalizeBorder, buttonShadow } from '@/constants/pixelRatio';

export default function ProjectJournalScreen() {
  const { id } = useLocalSearchParams();
  const { getProjectById, updateProject } = useProjects();
  const { t } = useLanguage();
  const { user } = useAuth();
  const project = getProjectById(id as string);

  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState('');

  if (!project) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
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

  const workProgress = project.workProgress || [];

  const handleAddEntry = () => {
    setIsAddingEntry(true);
    setEditingEntry('');
  };

  const handleSaveEntry = async () => {
    if (editingEntry.trim()) {
      const newEntry: WorkProgressEntry = {
        id: Date.now().toString(),
        date: new Date(),
        notes: editingEntry.trim(),
      };

      const updatedWorkProgress = [...workProgress, newEntry];

      await updateProject(project.id, {
        workProgress: updatedWorkProgress,
      });

      setEditingEntry('');
      setIsAddingEntry(false);
    }
  };

  const handleCancelEntry = () => {
    setEditingEntry('');
    setIsAddingEntry(false);
  };

  const handleDeleteEntry = (entryId: string) => {
    Alert.alert(
      t('projects.deleteJournalEntry'),
      t('projects.deleteJournalEntryConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const updatedWorkProgress = workProgress.filter((entry) => entry.id !== entryId);
            await updateProject(project.id, {
              workProgress: updatedWorkProgress.length > 0 ? updatedWorkProgress : undefined,
            });
          },
        },
      ]
    );
  };

  const formatDate = (date: Date): string => {
    const entryDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset hours to compare just dates
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    entryDate.setHours(0, 0, 0, 0);

    if (entryDate.getTime() === today.getTime()) {
      return t('common.today');
    } else if (entryDate.getTime() === yesterday.getTime()) {
      return t('common.yesterday');
    } else {
      return new Date(date).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  // Check if user is Pro
  const isPro = user?.isPro === true;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ModalHeader title={t('projects.projectJournal')} />

      {!isPro ? (
        <LockedProFeature
          title={t('projects.journalIsProFeature')}
          description={t('projects.journalProDescription')}
        />
      ) : (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {!isAddingEntry && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddEntry}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('projects.addJournalEntry')}
              accessibilityHint={t('projects.addJournalEntryHint')}
            >
              <Plus size={20} color={Colors.white} />
              <Text style={styles.addButtonText}>{t('projects.addJournalEntry')}</Text>
            </TouchableOpacity>
          )}

          {isAddingEntry && (
            <View style={styles.entryForm}>
              <Text style={styles.formTitle}>{t('projects.newJournalEntry')}</Text>
              <Input
                label={t('projects.workEntryLabel')}
                placeholder={t('projects.workEntryPlaceholder')}
                value={editingEntry}
                onChangeText={setEditingEntry}
                multiline
                numberOfLines={6}
                style={styles.textArea}
                autoFocus
              />
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelEntry}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.cancel')}
                >
                  <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    !editingEntry.trim() && styles.saveButtonDisabled,
                  ]}
                  onPress={handleSaveEntry}
                  disabled={!editingEntry.trim()}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t('projects.saveEntry')}
                  accessibilityState={{ disabled: !editingEntry.trim() }}
                >
                  <Text style={styles.saveButtonText}>{t('projects.saveEntry')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {workProgress.length === 0 && !isAddingEntry ? (
            <EmptyState
              icon={<BookOpen size={48} color={Colors.warmGray} />}
              title={t('projects.noJournalEntries')}
              description={t('projects.noJournalEntriesDescription')}
            />
          ) : (
            <View style={styles.entriesList}>
              {[...workProgress]
                .reverse()
                .map((entry) => (
                  <View key={entry.id} style={styles.entryCard}>
                    <View style={styles.entryHeader}>
                      <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteEntry(entry.id)}
                        style={styles.deleteButton}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={t('common.delete')}
                        accessibilityHint={t('projects.deleteThisEntry')}
                      >
                        <Trash2 size={18} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.entryNotes}>{entry.notes}</Text>
                  </View>
                ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      )}
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.sage,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    minHeight: 50,
    ...Platform.select({
      ...buttonShadow,
      default: {},
    }),
  },
  addButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600' as const,
    fontSize: 16,
  },
  entryForm: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: normalizeBorder(1.5),
    borderColor: Colors.sage,
    ...Platform.select({
      ...buttonShadow,
      default: {},
    }),
  },
  formTitle: {
    ...Typography.title3,
    color: Colors.charcoal,
    fontWeight: '600' as const,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top',
    paddingTop: 12,
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
  entriesList: {
    gap: 12,
  },
  entryCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.border,
    ...Platform.select({
      ...buttonShadow,
      default: {},
    }),
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  entryDate: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontWeight: '600' as const,
    fontSize: 13,
  },
  deleteButton: {
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryNotes: {
    ...Typography.body,
    color: Colors.charcoal,
    lineHeight: 22,
  },
});
