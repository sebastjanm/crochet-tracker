/**
 * TimeTrackingMockup - Compact inline time tracking UI
 *
 * UI-ONLY mockup for layout review. No real functionality.
 * Tap the row to cycle states in dev mode.
 */

import { useState } from 'react';
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

type MockState = 'idle' | 'running';

interface TimeTrackingMockupProps {
  initialState?: MockState;
}

export function TimeTrackingMockup({ initialState = 'idle' }: TimeTrackingMockupProps) {
  const [mockState, setMockState] = useState<MockState>(initialState);
  const [showStoppedModal, setShowStoppedModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);

  // Toggle state (dev preview)
  const toggleState = () => {
    if (mockState === 'idle') {
      setMockState('running');
    } else {
      setMockState('idle');
      setShowStoppedModal(true);
    }
  };

  if (mockState === 'running') {
    return (
      <View style={styles.container}>
        {/* Running State - Clean Card */}
        <View style={styles.runningCard}>
          {/* Left: Timer display */}
          <View style={styles.timerSection}>
            <View style={styles.runningBadge}>
              <View style={styles.runningDot} />
              <Text style={styles.runningBadgeText}>REC</Text>
            </View>
            <Text style={styles.elapsedTime}>23:14</Text>
            <Text style={styles.totalTimeSmall}>Total: 12:45</Text>
          </View>

          {/* Right: Stop button */}
          <TouchableOpacity
            style={styles.stopButton}
            onPress={toggleState}
            activeOpacity={0.7}
          >
            <Square size={20} color={Colors.white} fill={Colors.white} />
          </TouchableOpacity>
        </View>

        <StoppedModal
          visible={showStoppedModal}
          onClose={() => setShowStoppedModal(false)}
        />
      </View>
    );
  }

  // Idle State - Compact Row
  return (
    <View style={styles.container}>
      <View style={styles.idleRow}>
        <View style={styles.timeInfo}>
          <Text style={styles.timeLabel}>Total:</Text>
          <Text style={styles.timeValue}>0:00</Text>
        </View>
        <Button
          title="Start"
          size="small"
          icon={<Play size={16} color={Colors.white} fill={Colors.white} />}
          onPress={toggleState}
        />
      </View>

      {/* Manual entry - subtle link */}
      <TouchableOpacity
        style={styles.manualLink}
        onPress={() => setShowManualModal(true)}
        activeOpacity={0.7}
      >
        <Plus size={14} color={Colors.sage} />
        <Text style={styles.manualLinkText}>Add manually</Text>
      </TouchableOpacity>

      <ManualSessionModal
        visible={showManualModal}
        onClose={() => setShowManualModal(false)}
      />
    </View>
  );
}

// =============================================================================
// MODALS
// =============================================================================

function StoppedModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetContent}>
            <Clock size={28} color={Colors.deepSage} />
            <Text style={styles.sheetTitle}>Worked 42 minutes</Text>
            <Text style={styles.sheetSubtitle}>Add a note?</Text>
            <View style={styles.sheetButtons}>
              <TouchableOpacity style={styles.btnSecondary} onPress={onClose}>
                <Text style={styles.btnSecondaryText}>Add note</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={onClose}>
                <Text style={styles.btnPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ManualSessionModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.bottomSheetLarge}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetContent}>
            <Text style={styles.modalTitle}>Add Work Session</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Date</Text>
              <View style={styles.formInput}>
                <Text style={styles.formPlaceholder}>Today</Text>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Duration</Text>
              <View style={styles.durationRow}>
                <View style={styles.durationInput}>
                  <Text style={styles.durationValue}>0</Text>
                  <Text style={styles.durationUnit}>hr</Text>
                </View>
                <Text style={styles.durationSep}>:</Text>
                <View style={styles.durationInput}>
                  <Text style={styles.durationValue}>30</Text>
                  <Text style={styles.durationUnit}>min</Text>
                </View>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Note</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="What did you work on?"
                placeholderTextColor={Colors.warmGray}
                multiline
                editable={false}
              />
            </View>

            <View style={styles.sheetButtons}>
              <TouchableOpacity style={styles.btnSecondary} onPress={onClose}>
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={onClose}>
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
});
