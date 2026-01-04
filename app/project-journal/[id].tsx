import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Plus, Trash2, BookOpen, Clock, PenLine } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { ModalHeader } from '@/components/ModalHeader';
import { EmptyState } from '@/components/EmptyState';
import { LockedProFeature } from '@/components/LockedProFeature';
import { useProjects } from '@/providers/ProjectsProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useTimeSessions } from '@/providers/TimeSessionsProvider';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import type { WorkProgressEntry, ProjectTimeSession } from '@/types';
import { normalizeBorder, buttonShadow } from '@/constants/pixelRatio';

// Unified timeline entry type
type TimelineEntry =
  | { type: 'journal'; data: WorkProgressEntry }
  | { type: 'time'; data: ProjectTimeSession };

export default function ProjectJournalScreen() {
  const { id } = useLocalSearchParams();
  const projectId = id as string;
  const { getProjectById, updateProject } = useProjects();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { getSessionsForProject, addManualSession, deleteSession, getTotalMinutes } = useTimeSessions();
  const project = getProjectById(projectId);
  const timeSessions = getSessionsForProject(projectId);
  const totalMinutes = getTotalMinutes(projectId);

  // Format total time for display
  const formattedTotalTime = useMemo(() => {
    if (totalMinutes === 0) return null;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours === 0) {
      return `${mins}${t('timeTracking.minutes')}`;
    }
    if (mins === 0) {
      return `${hours}${t('timeTracking.hours')}`;
    }
    return `${hours}${t('timeTracking.hours')} ${mins}${t('timeTracking.minutes')}`;
  }, [totalMinutes, t]);

  // Modal state for unified work entry
  const [showWorkEntryModal, setShowWorkEntryModal] = useState(false);

  // Create unified timeline from journal entries + time sessions
  const timeline = useMemo((): TimelineEntry[] => {
    const entries: TimelineEntry[] = [];

    // Add journal entries
    const workProgress = project?.workProgress || [];
    workProgress.forEach((entry) => {
      entries.push({ type: 'journal', data: entry });
    });

    // Add time sessions
    timeSessions.forEach((session) => {
      entries.push({ type: 'time', data: session });
    });

    // Sort by date, newest first
    entries.sort((a, b) => {
      const dateA = a.type === 'journal' ? new Date(a.data.date) : new Date(a.data.startedAt);
      const dateB = b.type === 'journal' ? new Date(b.data.date) : new Date(b.data.startedAt);
      return dateB.getTime() - dateA.getTime();
    });

    return entries;
  }, [project?.workProgress, timeSessions]);

  // Format duration for time sessions (handles null for note-only entries)
  const formatSessionDuration = (minutes: number | null): string | null => {
    if (minutes === null) return null;
    if (minutes < 60) {
      return `${minutes}${t('timeTracking.minutes')}`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours}${t('timeTracking.hours')}`;
    }
    return `${hours}${t('timeTracking.hours')} ${mins}${t('timeTracking.minutes')}`;
  };

  // Handle work entry save (unified: note and/or duration)
  const handleSaveWorkEntry = async (hours: number, minutes: number, note?: string) => {
    const totalMinutes = hours * 60 + minutes;
    await addManualSession(
      projectId,
      new Date(),
      totalMinutes > 0 ? totalMinutes : null,
      note
    );
    setShowWorkEntryModal(false);
  };

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

  // Delete legacy journal entry
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

  // Delete time session / work entry
  const handleDeleteTimeSession = (sessionId: string) => {
    Alert.alert(
      t('timeTracking.deleteWorkEntry'),
      t('timeTracking.deleteWorkEntryConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteSession(sessionId);
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
          {/* Total time summary */}
          {formattedTotalTime && (
            <View style={styles.totalTimeCard}>
              <Clock size={20} color={Colors.deepTeal} />
              <View style={styles.totalTimeContent}>
                <Text style={styles.totalTimeLabel}>{t('timeTracking.totalTimeWorked')}</Text>
                <Text style={styles.totalTimeValue}>{formattedTotalTime}</Text>
              </View>
            </View>
          )}

          {/* Add Work Entry button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowWorkEntryModal(true)}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('timeTracking.addWorkEntry')}
          >
            <Plus size={20} color={Colors.white} />
            <Text style={styles.addButtonText}>{t('timeTracking.addWorkEntry')}</Text>
          </TouchableOpacity>

          {timeline.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={48} color={Colors.warmGray} />}
              title={t('projects.noJournalEntries')}
              description={t('projects.noJournalEntriesDescription')}
            />
          ) : (
            <View style={styles.entriesList}>
              {timeline.map((entry) => {
                if (entry.type === 'journal') {
                  // Journal entry
                  return (
                    <View key={`journal-${entry.data.id}`} style={styles.entryCard}>
                      <View style={styles.entryHeader}>
                        <View style={styles.entryTypeRow}>
                          <PenLine size={14} color={Colors.sage} />
                          <Text style={styles.entryDate}>{formatDate(entry.data.date)}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteEntry(entry.data.id)}
                          style={styles.deleteButton}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={t('common.delete')}
                          accessibilityHint={t('projects.deleteThisEntry')}
                        >
                          <Trash2 size={18} color={Colors.error} />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.entryNotes}>{entry.data.notes}</Text>
                    </View>
                  );
                } else {
                  // Time session / work entry
                  const session = entry.data;
                  const durationText = formatSessionDuration(session.durationMinutes);
                  const hasNote = session.note && session.note.trim().length > 0;
                  const hasDuration = durationText !== null;

                  return (
                    <View
                      key={`time-${session.id}`}
                      style={hasDuration ? styles.timeSessionCard : styles.workEntryCard}
                    >
                      <View style={styles.entryHeader}>
                        <View style={styles.entryTypeRow}>
                          {session.source === 'timer' ? (
                            <Clock size={14} color={Colors.deepTeal} />
                          ) : (
                            <PenLine size={14} color={Colors.sage} />
                          )}
                          <Text style={styles.entryDate}>{formatDate(session.startedAt)}</Text>
                        </View>
                        <View style={styles.entryActions}>
                          {hasDuration && (
                            <View style={styles.sessionBadge}>
                              <Text style={styles.sessionBadgeText}>{durationText}</Text>
                            </View>
                          )}
                          <TouchableOpacity
                            onPress={() => handleDeleteTimeSession(session.id)}
                            style={styles.deleteButton}
                            accessible={true}
                            accessibilityRole="button"
                            accessibilityLabel={t('common.delete')}
                            accessibilityHint={t('timeTracking.deleteThisEntry')}
                          >
                            <Trash2 size={18} color={Colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      {hasNote && (
                        <Text style={styles.entryNotes}>{session.note}</Text>
                      )}
                      {!hasNote && hasDuration && (
                        <Text style={styles.sessionSource}>
                          {session.source === 'timer'
                            ? t('timeTracking.timerSession')
                            : t('timeTracking.manualEntry')}
                        </Text>
                      )}
                    </View>
                  );
                }
              })}
            </View>
          )}
        </ScrollView>

        {/* Work Entry Modal */}
        <WorkEntryModal
          visible={showWorkEntryModal}
          onSave={handleSaveWorkEntry}
          onClose={() => setShowWorkEntryModal(false)}
        />
      </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

// ============================================================================
// WORK ENTRY MODAL (unified: note and/or duration)
// ============================================================================

interface WorkEntryModalProps {
  visible: boolean;
  onSave: (hours: number, minutes: number, note?: string) => void;
  onClose: () => void;
}

function WorkEntryModal({ visible, onSave, onClose }: WorkEntryModalProps) {
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('0');
  const [note, setNote] = useState('');
  const [showDuration, setShowDuration] = useState(false);
  const [validationError, setValidationError] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setHours('0');
      setMinutes('0');
      setNote('');
      setShowDuration(false);
      setValidationError(false);
    }
  }, [visible]);

  const handleHoursChange = (text: string) => {
    const numeric = text.replace(/[^0-9]/g, '');
    setHours(numeric);
    setValidationError(false);
  };

  const handleMinutesChange = (text: string) => {
    const numeric = text.replace(/[^0-9]/g, '');
    const num = parseInt(numeric, 10);
    if (numeric === '' || (num >= 0 && num <= 59)) {
      setMinutes(numeric);
      setValidationError(false);
    }
  };

  const handleNoteChange = (text: string) => {
    setNote(text);
    setValidationError(false);
  };

  const handleSave = () => {
    const h = parseInt(hours, 10) || 0;
    const m = parseInt(minutes, 10) || 0;
    const hasNote = note.trim().length > 0;
    const hasDuration = h > 0 || m > 0;

    if (!hasNote && !hasDuration) {
      setValidationError(true);
      return;
    }

    onSave(h, m, note.trim() || undefined);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <Pressable style={modalStyles.backdrop} onPress={onClose} />
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <View style={modalStyles.content}>
            <Text style={modalStyles.title}>Add Work Entry</Text>

            {/* Note field first */}
            <View style={modalStyles.formGroup}>
              <Text style={modalStyles.label}>What did you work on?</Text>
              <TextInput
                style={[modalStyles.noteInput, validationError && modalStyles.inputError]}
                placeholder="Describe your progress..."
                placeholderTextColor={Colors.warmGray}
                value={note}
                onChangeText={handleNoteChange}
                multiline
                autoFocus
              />
            </View>

            {/* Duration toggle */}
            {!showDuration ? (
              <TouchableOpacity
                style={modalStyles.addTimeButton}
                onPress={() => setShowDuration(true)}
                activeOpacity={0.7}
              >
                <Plus size={16} color={Colors.deepSage} />
                <Text style={modalStyles.addTimeText}>Add time</Text>
              </TouchableOpacity>
            ) : (
              <View style={modalStyles.formGroup}>
                <View style={modalStyles.durationHeader}>
                  <Text style={modalStyles.label}>Duration (optional)</Text>
                  <TouchableOpacity onPress={() => {
                    setShowDuration(false);
                    setHours('0');
                    setMinutes('0');
                  }}>
                    <Text style={modalStyles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
                <View style={modalStyles.durationRow}>
                  <View style={modalStyles.durationInput}>
                    <TextInput
                      style={modalStyles.durationField}
                      value={hours}
                      onChangeText={handleHoursChange}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text style={modalStyles.durationUnit}>hr</Text>
                  </View>
                  <Text style={modalStyles.durationSep}>:</Text>
                  <View style={modalStyles.durationInput}>
                    <TextInput
                      style={modalStyles.durationField}
                      value={minutes}
                      onChangeText={handleMinutesChange}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text style={modalStyles.durationUnit}>min</Text>
                  </View>
                </View>
              </View>
            )}

            {validationError && (
              <Text style={modalStyles.errorText}>Please add a note or time worked</Text>
            )}

            <View style={modalStyles.buttons}>
              <TouchableOpacity style={modalStyles.btnSecondary} onPress={onClose}>
                <Text style={modalStyles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modalStyles.btnPrimary} onPress={handleSave}>
                <Text style={modalStyles.btnPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Modal styles
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  content: {
    paddingHorizontal: 24,
    gap: 8,
  },
  title: {
    ...Typography.title2,
    color: Colors.charcoal,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  formGroup: {
    width: '100%',
    gap: 6,
  },
  label: {
    ...Typography.caption,
    color: Colors.charcoal,
    fontSize: 13,
    fontWeight: '500',
  },
  noteInput: {
    ...Typography.body,
    backgroundColor: Colors.linen,
    borderRadius: 10,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: Colors.error,
    borderWidth: normalizeBorder(1.5),
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(74, 93, 79, 0.08)',
    borderRadius: 8,
  },
  addTimeText: {
    ...Typography.body,
    color: Colors.deepSage,
    fontSize: 14,
    fontWeight: '500',
  },
  durationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  removeText: {
    ...Typography.caption,
    color: Colors.error,
    fontSize: 13,
    fontWeight: '500',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationInput: {
    flex: 1,
    backgroundColor: Colors.linen,
    borderRadius: 10,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.border,
    paddingVertical: 10,
    alignItems: 'center',
  },
  durationField: {
    ...Typography.title2,
    color: Colors.charcoal,
    fontSize: 22,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    minWidth: 40,
    padding: 0,
  },
  durationUnit: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontSize: 11,
  },
  durationSep: {
    ...Typography.title2,
    color: Colors.warmGray,
    fontSize: 20,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  btnSecondary: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: Colors.linen,
    borderRadius: 12,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.border,
  },
  btnSecondaryText: {
    ...Typography.body,
    color: Colors.charcoal,
    fontWeight: '500',
  },
  btnPrimary: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: Colors.deepSage,
    borderRadius: 12,
  },
  btnPrimaryText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
  },
});

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
  totalTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.deepTeal,
    ...Platform.select({
      ...buttonShadow,
      default: {},
    }),
  },
  totalTimeContent: {
    flex: 1,
  },
  totalTimeLabel: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontSize: 12,
    marginBottom: 2,
  },
  totalTimeValue: {
    ...Typography.title2,
    color: Colors.deepTeal,
    fontWeight: '700' as const,
    fontSize: 20,
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
  timeSessionCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.deepTeal,
    borderLeftWidth: 3,
    ...Platform.select({
      ...buttonShadow,
      default: {},
    }),
  },
  workEntryCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.sage,
    borderLeftWidth: 3,
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
  entryTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  sessionBadge: {
    backgroundColor: Colors.deepTeal,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sessionBadgeText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600' as const,
    fontSize: 12,
  },
  sessionDetails: {
    gap: 4,
  },
  sessionSource: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontSize: 13,
  },
  sessionNote: {
    ...Typography.body,
    color: Colors.charcoal,
    marginTop: 4,
    lineHeight: 20,
  },
});
