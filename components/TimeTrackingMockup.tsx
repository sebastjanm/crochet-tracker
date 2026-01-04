/**
 * TimeTracking - Compact inline time tracking UI
 *
 * Real time tracking functionality using Legend-State + Supabase.
 * - Start/stop timer
 * - Manual time entry
 * - Computed totals
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import {
  Play,
  Square,
  Plus,
  Clock,
} from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { normalizeBorder, normalizeBorderOpacity } from '@/constants/pixelRatio';
import { useTimeSessions } from '@/providers';
import { formatElapsed, formatDuration, formatDurationCompact } from '@/lib/timer-utils';
import type { ProjectTimeSession } from '@/types';

// ============================================================================
// PROPS
// ============================================================================

interface TimeTrackingProps {
  projectId: string;
  isCompleted?: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TimeTrackingMockup({
  projectId,
  isCompleted = false,
}: TimeTrackingProps) {
  const {
    activeTimer,
    isTimerRunning,
    startTimer,
    stopTimer,
    addManualSession,
    getTotalMinutes,
    updateSessionNote,
    isTimerRunningFor,
  } = useTimeSessions();

  // Local state for modals
  const [showStoppedModal, setShowStoppedModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [lastSession, setLastSession] = useState<ProjectTimeSession | null>(null);

  // Elapsed time display (updates every second when running)
  const [elapsedDisplay, setElapsedDisplay] = useState('0:00');

  // Is timer running for THIS project?
  const isRunningForThisProject = isTimerRunningFor(projectId);

  // Total time for this project
  const totalMinutes = getTotalMinutes(projectId);
  const totalTimeDisplay = formatDurationCompact(totalMinutes);

  // Update elapsed time display every second when timer is running
  useEffect(() => {
    if (!isRunningForThisProject || !activeTimer) {
      setElapsedDisplay('0:00');
      return;
    }

    // Immediate update
    setElapsedDisplay(formatElapsed(activeTimer.startedAt));

    // Update every second
    const interval = setInterval(() => {
      setElapsedDisplay(formatElapsed(activeTimer.startedAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunningForThisProject, activeTimer]);

  // Handle start button
  const handleStart = useCallback(() => {
    const success = startTimer(projectId);
    if (__DEV__ && !success) {
      console.log('[TimeTracking] Could not start timer (another may be running)');
    }
  }, [projectId, startTimer]);

  // Handle stop button
  const handleStop = useCallback(async () => {
    const session = await stopTimer();
    if (session) {
      setLastSession(session);
      setShowStoppedModal(true);
    }
  }, [stopTimer]);

  // Handle save from stopped modal
  const handleSaveSession = useCallback((note?: string) => {
    if (lastSession && note) {
      updateSessionNote(lastSession.id, note);
    }
    setShowStoppedModal(false);
    setLastSession(null);
  }, [lastSession, updateSessionNote]);

  // Handle manual entry (unified: note OR duration OR both)
  const handleManualSave = useCallback(async (hours: number, minutes: number, note?: string) => {
    const totalMinutes = hours * 60 + minutes;
    // Pass null if no duration, otherwise pass the total minutes
    await addManualSession(projectId, new Date(), totalMinutes > 0 ? totalMinutes : null, note);
    setShowManualModal(false);
  }, [projectId, addManualSession]);

  // ============================================================================
  // RENDER: COMPLETED STATE
  // ============================================================================

  if (isCompleted) {
    return (
      <View style={styles.container}>
        <View style={styles.completedRow}>
          <Clock size={18} color={Colors.sage} />
          <Text style={styles.completedLabel}>Time spent:</Text>
          <Text style={styles.completedValue}>{totalTimeDisplay}</Text>
        </View>
      </View>
    );
  }

  // ============================================================================
  // RENDER: RUNNING STATE
  // ============================================================================

  if (isRunningForThisProject) {
    return (
      <View style={styles.container}>
        <View style={styles.runningCard}>
          {/* Left: Timer display */}
          <View style={styles.timerSection}>
            <View style={styles.runningBadge}>
              <View style={styles.runningDot} />
              <Text style={styles.runningBadgeText}>REC</Text>
            </View>
            <Text style={styles.elapsedTime}>{elapsedDisplay}</Text>
            <Text style={styles.totalTimeSmall}>Total: {totalTimeDisplay}</Text>
          </View>

          {/* Right: Stop button */}
          <TouchableOpacity
            style={styles.stopButton}
            onPress={handleStop}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Stop timer"
          >
            <Square size={20} color={Colors.white} fill={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============================================================================
  // RENDER: IDLE STATE
  // ============================================================================

  return (
    <View style={styles.container}>
      <View style={styles.idleRow}>
        <View style={styles.timeInfo}>
          <Text style={styles.timeLabel}>Total:</Text>
          <Text style={styles.timeValue}>{totalTimeDisplay}</Text>
        </View>
        <Button
          title="Start"
          size="small"
          icon={<Play size={16} color={Colors.white} fill={Colors.white} />}
          onPress={handleStart}
          disabled={isTimerRunning && !isRunningForThisProject}
        />
      </View>

      {/* Add work entry link */}
      <TouchableOpacity
        style={styles.manualLink}
        onPress={() => setShowManualModal(true)}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Add work entry"
      >
        <Plus size={14} color={Colors.sage} />
        <Text style={styles.manualLinkText}>Add entry</Text>
      </TouchableOpacity>

      <ManualSessionModal
        visible={showManualModal}
        onSave={handleManualSave}
        onClose={() => setShowManualModal(false)}
      />

      <StoppedModal
        visible={showStoppedModal}
        session={lastSession}
        onSave={handleSaveSession}
        onClose={() => {
          setShowStoppedModal(false);
          setLastSession(null);
        }}
      />
    </View>
  );
}

// =============================================================================
// MODALS
// =============================================================================

interface StoppedModalProps {
  visible: boolean;
  session: ProjectTimeSession | null;
  onSave: (note?: string) => void;
  onClose: () => void;
}

function StoppedModal({ visible, session, onSave, onClose }: StoppedModalProps) {
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setNote('');
      setShowNoteInput(false);
    }
  }, [visible]);

  const durationText = session?.durationMinutes
    ? formatDuration(session.durationMinutes)
    : '0m';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetContent}>
            <Clock size={28} color={Colors.deepSage} />
            <Text style={styles.sheetTitle}>Worked {durationText}</Text>

            {showNoteInput ? (
              <TextInput
                style={styles.noteInputSmall}
                placeholder="What did you work on?"
                placeholderTextColor={Colors.warmGray}
                value={note}
                onChangeText={setNote}
                multiline
                autoFocus
              />
            ) : (
              <Text style={styles.sheetSubtitle}>Add a note?</Text>
            )}

            <View style={styles.sheetButtons}>
              {showNoteInput ? (
                <>
                  <TouchableOpacity style={styles.btnSecondary} onPress={() => setShowNoteInput(false)}>
                    <Text style={styles.btnSecondaryText}>Skip</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnPrimary} onPress={() => onSave(note)}>
                    <Text style={styles.btnPrimaryText}>Save</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity style={styles.btnSecondary} onPress={() => setShowNoteInput(true)}>
                    <Text style={styles.btnSecondaryText}>Add note</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnPrimary} onPress={() => onSave()}>
                    <Text style={styles.btnPrimaryText}>Save</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface ManualSessionModalProps {
  visible: boolean;
  onSave: (hours: number, minutes: number, note?: string) => void;
  onClose: () => void;
}

function ManualSessionModal({ visible, onSave, onClose }: ManualSessionModalProps) {
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

  // Filter to only allow numeric input
  const handleHoursChange = (text: string) => {
    const numeric = text.replace(/[^0-9]/g, '');
    setHours(numeric);
    setValidationError(false);
  };

  const handleMinutesChange = (text: string) => {
    const numeric = text.replace(/[^0-9]/g, '');
    // Clamp minutes to max 59
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

    // Validation: at least note OR duration required
    if (!hasNote && !hasDuration) {
      setValidationError(true);
      return;
    }

    onSave(h, m, note.trim() || undefined);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.bottomSheetLarge}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetContent}>
            <Text style={styles.modalTitle}>Add Work Entry</Text>

            {/* Note field first - primary focus */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>What did you work on?</Text>
              <TextInput
                style={[styles.noteInput, validationError && styles.inputError]}
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
                style={styles.addTimeButton}
                onPress={() => setShowDuration(true)}
                activeOpacity={0.7}
              >
                <Plus size={16} color={Colors.deepSage} />
                <Text style={styles.addTimeText}>Add time</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.formGroup}>
                <View style={styles.durationHeader}>
                  <Text style={styles.formLabel}>Duration (optional)</Text>
                  <TouchableOpacity onPress={() => {
                    setShowDuration(false);
                    setHours('0');
                    setMinutes('0');
                  }}>
                    <Text style={styles.removeDurationText}>Remove</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.durationRow}>
                  <View style={styles.durationInputContainer}>
                    <TextInput
                      style={styles.durationInputField}
                      value={hours}
                      onChangeText={handleHoursChange}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text style={styles.durationUnit}>hr</Text>
                  </View>
                  <Text style={styles.durationSep}>:</Text>
                  <View style={styles.durationInputContainer}>
                    <TextInput
                      style={styles.durationInputField}
                      value={minutes}
                      onChangeText={handleMinutesChange}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text style={styles.durationUnit}>min</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Validation error */}
            {validationError && (
              <Text style={styles.errorText}>Please add a note or time worked</Text>
            )}

            <View style={styles.sheetButtons}>
              <TouchableOpacity style={styles.btnSecondary} onPress={onClose}>
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleSave}>
                <Text style={styles.btnPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: normalizeBorder(0.5),
    borderBottomColor: `rgba(0, 0, 0, ${normalizeBorderOpacity(0.15)})`,
  },

  // Completed State
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 12,
  },
  completedLabel: {
    ...Typography.body,
    color: Colors.warmGray,
    fontSize: 15,
  },
  completedValue: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 17,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  // Idle State
  idleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeLabel: {
    ...Typography.body,
    color: Colors.warmGray,
    fontSize: 15,
  },
  timeValue: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 17,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  manualLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  manualLinkText: {
    ...Typography.caption,
    color: Colors.sage,
    fontSize: 13,
  },

  // Running State
  runningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.linen,
    borderRadius: 12,
    padding: 16,
    borderWidth: normalizeBorder(1),
    borderColor: 'rgba(229, 57, 53, 0.25)',
  },
  timerSection: {
    gap: 2,
  },
  runningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  runningDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E53935',
  },
  runningBadgeText: {
    ...Typography.caption,
    color: '#E53935',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  elapsedTime: {
    ...Typography.title1,
    color: Colors.charcoal,
    fontSize: 32,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  totalTimeSmall: {
    ...Typography.caption,
    color: Colors.warmGray,
    fontSize: 12,
  },
  stopButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  bottomSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  bottomSheetLarge: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  sheetContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    ...Typography.title2,
    color: Colors.charcoal,
    fontSize: 18,
    fontWeight: '600',
  },
  sheetSubtitle: {
    ...Typography.body,
    color: Colors.warmGray,
    fontSize: 14,
  },
  sheetButtons: {
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

  // Form
  modalTitle: {
    ...Typography.title2,
    color: Colors.charcoal,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  formGroup: {
    width: '100%',
    gap: 6,
  },
  formLabel: {
    ...Typography.caption,
    color: Colors.charcoal,
    fontSize: 13,
    fontWeight: '500',
  },
  formInput: {
    backgroundColor: Colors.linen,
    borderRadius: 10,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  formPlaceholder: {
    ...Typography.body,
    color: Colors.charcoal,
    fontSize: 15,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationInputContainer: {
    flex: 1,
    backgroundColor: Colors.linen,
    borderRadius: 10,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.border,
    paddingVertical: 10,
    alignItems: 'center',
  },
  durationInputField: {
    ...Typography.title2,
    color: Colors.charcoal,
    fontSize: 22,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    minWidth: 40,
    padding: 0,
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
  durationValue: {
    ...Typography.title2,
    color: Colors.charcoal,
    fontSize: 22,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
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
  noteInput: {
    ...Typography.body,
    backgroundColor: Colors.linen,
    borderRadius: 10,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  noteInputSmall: {
    ...Typography.body,
    backgroundColor: Colors.linen,
    borderRadius: 10,
    borderWidth: normalizeBorder(1),
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 60,
    width: '100%',
    textAlignVertical: 'top',
  },

  // Add time button (toggles duration section)
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
  removeDurationText: {
    ...Typography.caption,
    color: Colors.error,
    fontSize: 13,
    fontWeight: '500',
  },
  inputError: {
    borderColor: Colors.error,
    borderWidth: normalizeBorder(1.5),
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
});
