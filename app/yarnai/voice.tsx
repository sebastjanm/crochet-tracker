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
import { Stack } from 'expo-router';
import { Mic, MicOff, Volume2, MessageSquare } from 'lucide-react-native';
import { useAudioRecorder, IOSOutputFormat, AudioQuality } from 'expo-audio';
import * as Audio from 'expo-audio';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { useLanguage } from '@/hooks/language-context';

const STT_API_URL = 'https://toolkit.rork.com/stt/transcribe/';
const CHAT_API_URL = 'https://toolkit.rork.com/text/llm/';

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
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
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
    backgroundColor: '#EF4444',
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
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
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
    borderBottomWidth: 1,
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
    color: '#8B5CF6',
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
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  webNotSupportedText: {
    ...Typography.body,
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default function VoiceAssistant() {
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState<Conversation[]>([]);
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
      const { granted } = await Audio.requestRecordingPermissionsAsync();

      if (!granted) {
        Alert.alert('Permission Denied', 'Audio recording permission is required');
        return;
      }

      console.log('Starting recording..');
      await audioRecorder.record();
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!audioRecorder.isRecording) return;

    console.log('Stopping recording..');
    setIsProcessing(true);

    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      console.log('Recording stopped and stored at', uri);

      if (uri) {
        await transcribeAudio(uri);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to process recording');
    } finally {
      setIsProcessing(false);
    }
  };

  const transcribeAudio = async (uri: string) => {
    try {
      const formData = new FormData();
      
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      const audioFile = {
        uri,
        name: `recording.${fileType}`,
        type: `audio/${fileType}`,
      } as any;

      formData.append('audio', audioFile);

      const response = await fetch(STT_API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.text) {
        const userMessage: Conversation = {
          id: Date.now().toString(),
          type: 'user',
          text: data.text,
          timestamp: new Date(),
        };

        setConversation(prev => [...prev, userMessage]);
        await getAIResponse(data.text);
      } else {
        throw new Error('No transcription received');
      }
    } catch (error: any) {
      console.error('Transcription error:', error);
      Alert.alert('Error', `Failed to transcribe audio: ${error.message}`);
    }
  };

  const getAIResponse = async (userText: string) => {
    try {
      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are YarnAI, a helpful voice assistant specialized in yarn crafts, crochet, knitting, and fiber arts. Provide concise, helpful responses since this is a voice conversation. Keep responses under 100 words when possible.',
            },
            ...conversation.map(msg => ({
              role: msg.type === 'user' ? 'user' : 'assistant',
              content: msg.text,
            })),
            {
              role: 'user',
              content: userText,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`AI response failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.completion) {
        const assistantMessage: Conversation = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          text: data.completion,
          timestamp: new Date(),
        };

        setConversation(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('No AI response received');
      }
    } catch (error: any) {
      console.error('AI response error:', error);
      Alert.alert('Error', `Failed to get AI response: ${error.message}`);
    }
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
      <Stack.Screen 
        options={{ 
          title: t('yarnai.voiceAssistantTitle'),
          headerStyle: { backgroundColor: Colors.cream },
          headerTintColor: Colors.charcoal,
        }} 
      />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('yarnai.voiceAssistantPageTitle')}</Text>
          <Text style={styles.subtitle}>
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
                      color={'#8B5CF6'} 
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
                <Text style={styles.conversationText}>{item.text}</Text>
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