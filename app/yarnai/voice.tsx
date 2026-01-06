import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, MicOff, Volume2, MessageSquare } from 'lucide-react-native';
import {
  useAudioRecorder,
  IOSOutputFormat,
  AudioQuality,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { useLanguage } from '@/providers/LanguageProvider';
import { normalizeBorder, cardShadow, modalShadow } from '@/constants/pixelRatio';
import { MAX_FONT_SIZE_MULTIPLIER } from '@/constants/accessibility';
import { UniversalHeader } from '@/components/UniversalHeader';

interface Conversation {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  safeArea: {
    backgroundColor: Colors.headerBg,
  },
  headerWrapper: {
    backgroundColor: Colors.headerBg,
    paddingVertical: 12,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    ...Typography.largeTitle,
    color: Colors.charcoal,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  recordingSection: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 32,
    marginBottom: 24,
    alignItems: 'center',
    ...Platform.select({
      ...modalShadow,
      default: {},
    }),
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  recordButtonIdle: {
    backgroundColor: Colors.deepTeal,
  },
  recordButtonActive: {
    backgroundColor: Colors.voiceRecording,
  },
  recordButtonProcessing: {
    backgroundColor: Colors.warmGray,
  },
  recordButtonText: {
    ...Typography.caption,
    color: Colors.white,
    marginTop: 8,
    fontWeight: '600' as const,
  },
  statusText: {
    ...Typography.body,
    color: Colors.charcoal,
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionText: {
    ...Typography.caption,
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 18,
  },
  conversationSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
  },
  conversationTitle: {
    ...Typography.title2,
    color: Colors.charcoal,
    marginBottom: 16,
  },
  conversationItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: normalizeBorder(1),
    borderBottomColor: Colors.beige,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  conversationIcon: {
    marginRight: 8,
  },
  conversationSender: {
    ...Typography.caption,
    fontWeight: '600' as const,
  },
  userSender: {
    color: Colors.deepTeal,
  },
  assistantSender: {
    color: Colors.voiceAssistant,
  },
  conversationText: {
    ...Typography.body,
    color: Colors.charcoal,
    lineHeight: 22,
  },
  conversationTime: {
    ...Typography.caption,
    color: Colors.warmGray,
    marginTop: 4,
  },
  emptyConversation: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.warmGray,
    textAlign: 'center',
  },
  webNotSupported: {
    backgroundColor: Colors.warningBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  webNotSupportedText: {
    ...Typography.body,
    color: Colors.warningText,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default function VoiceAssistant() {
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation] = useState<Conversation[]>([]);
  const audioRecorder = useAudioRecorder({
    extension: '.m4a',
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    android: {
      outputFormat: 'mpeg4',
      audioEncoder: 'aac',
    },
    ios: {
      outputFormat: IOSOutputFormat.MPEG4AAC,
      audioQuality: AudioQuality.HIGH,
    },
    web: {
      mimeType: 'audio/webm',
      bitsPerSecond: 128000,
    },
  });

  const startRecording = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        t('yarnai.voiceAssistantNotAvailable'),
        t('yarnai.voiceAssistantNotAvailableMessage')
      );
      return;
    }

    try {
      // Request audio permissions using expo-audio
      const { granted } = await requestRecordingPermissionsAsync();

      if (!granted) {
        Alert.alert('Permission Denied', 'Audio recording permission is required');
        return;
      }

      // Set audio mode for recording
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });

      if (__DEV__) console.log('Starting recording..');
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      if (__DEV__) console.log('Recording started');
    } catch (err) {
      if (__DEV__) console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!audioRecorder.isRecording) return;

    if (__DEV__) console.log('Stopping recording..');
    setIsProcessing(true);

    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (__DEV__) console.log('Recording stopped and stored at', uri);

      if (uri) {
        await transcribeAudio(uri);
      }
    } catch (error) {
      if (__DEV__) console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to process recording');
    } finally {
      setIsProcessing(false);
    }
  };

  const transcribeAudio = async (_uri: string) => {
    // Feature disabled - Voice Assistant coming soon
    Alert.alert(
      t('common.comingSoon'),
      t('yarnai.voiceAssistantNotAvailableMessage')
    );
  };


  const handleRecordPress = () => {
    if (audioRecorder.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getRecordButtonStyle = () => {
    if (isProcessing) return styles.recordButtonProcessing;
    if (audioRecorder.isRecording) return styles.recordButtonActive;
    return styles.recordButtonIdle;
  };

  const getStatusText = () => {
    if (isProcessing) return t('yarnai.voiceAssistantProcessing');
    if (audioRecorder.isRecording) return t('yarnai.voiceAssistantListening');
    return t('yarnai.voiceAssistantTapToStart');
  };

  const getRecordIcon = () => {
    if (isProcessing) {
      return <ActivityIndicator size="large" color={Colors.white} />;
    }
    if (audioRecorder.isRecording) {
      return <MicOff size={48} color={Colors.white} />;
    }
    return <Mic size={48} color={Colors.white} />;
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.headerWrapper}>
          <UniversalHeader
            title={t('yarnai.voiceAssistantTitle')}
            showBack={true}
            showHelp={true}
          />
        </View>
      </SafeAreaView>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}>{t('yarnai.voiceAssistantPageTitle')}</Text>
          <Text style={styles.subtitle} maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}>
            {t('yarnai.voiceAssistantSubtitle')}
          </Text>
        </View>

        {Platform.OS === 'web' && (
          <View style={styles.webNotSupported}>
            <Text style={styles.webNotSupportedText}>
              {t('yarnai.voiceAssistantWebWarning')}
            </Text>
          </View>
        )}

        <View style={styles.recordingSection}>
          <TouchableOpacity
            style={[styles.recordButton, getRecordButtonStyle()]}
            onPress={handleRecordPress}
            disabled={isProcessing || Platform.OS === 'web'}
            activeOpacity={0.8}
          >
            {getRecordIcon()}
          </TouchableOpacity>
          
          <Text style={styles.statusText}>{getStatusText()}</Text>
          <Text style={styles.instructionText}>
            {Platform.OS === 'web' 
              ? t('yarnai.voiceAssistantWebInstructions')
              : t('yarnai.voiceAssistantInstructions')
            }
          </Text>
        </View>

        <View style={styles.conversationSection}>
          <Text style={styles.conversationTitle}>{t('yarnai.voiceAssistantConversation')}</Text>
          
          {conversation.length === 0 ? (
            <View style={styles.emptyConversation}>
              <MessageSquare 
                size={32} 
                color={Colors.warmGray} 
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyText}>
                {t('yarnai.voiceAssistantEmpty')}
              </Text>
            </View>
          ) : (
            conversation.map((item) => (
              <View key={item.id} style={styles.conversationItem}>
                <View style={styles.conversationHeader}>
                  {item.type === 'user' ? (
                    <Mic 
                      size={16} 
                      color={Colors.deepTeal} 
                      style={styles.conversationIcon}
                    />
                  ) : (
                    <Volume2
                      size={16}
                      color={Colors.voiceAssistant}
                      style={styles.conversationIcon}
                    />
                  )}
                  <Text 
                    style={[
                      styles.conversationSender,
                      item.type === 'user' ? styles.userSender : styles.assistantSender,
                    ]}
                  >
                    {item.type === 'user' ? t('yarnai.voiceAssistantYouSaid') : t('yarnai.voiceAssistantYarnAIReplied')}
                  </Text>
                </View>
                <Text style={styles.conversationText} maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}>{item.text}</Text>
                <Text style={styles.conversationTime}>
                  {formatTime(item.timestamp)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}