import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, MessageSquare, User, Bot } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { useLanguage } from '@/providers/LanguageProvider';
import { normalizeBorder, cardShadow } from '@/constants/pixelRatio';
import { MAX_FONT_SIZE_MULTIPLIER } from '@/constants/accessibility';
import { UniversalHeader } from '@/components/UniversalHeader';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { width: _width } = Dimensions.get('window');

const CHAT_API_URL = 'https://toolkit.rork.com/text/llm/';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
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
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messagesList: {
    flexGrow: 1,
  },
  message: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
  },
  userBubble: {
    backgroundColor: Colors.deepTeal,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageIcon: {
    marginRight: 8,
  },
  messageSender: {
    ...Typography.caption,
    fontWeight: '600' as const,
  },
  userSender: {
    color: Colors.white,
  },
  assistantSender: {
    color: Colors.deepTeal,
  },
  messageText: {
    ...Typography.body,
    lineHeight: 22,
  },
  userText: {
    color: Colors.white,
  },
  assistantText: {
    color: Colors.charcoal,
  },
  messageTime: {
    ...Typography.caption,
    marginTop: 8,
    opacity: 0.7,
  },
  userTime: {
    color: Colors.white,
  },
  assistantTime: {
    color: Colors.warmGray,
  },
  inputContainer: {
    backgroundColor: Colors.white,
    borderTopWidth: normalizeBorder(1),
    borderTopColor: Colors.beige,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.beige,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Typography.body,
    color: Colors.charcoal,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: Colors.deepTeal,
    borderRadius: 22,
    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.warmGray,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    ...Typography.title2,
    color: Colors.charcoal,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  suggestedQuestions: {
    width: '100%',
  },
  suggestionButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
  },
  suggestionText: {
    ...Typography.body,
    color: Colors.charcoal,
    textAlign: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  typingIndicator: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  typingBubble: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    ...Typography.body,
    color: Colors.warmGray,
    marginLeft: 8,
  },
});

export default function YarnAIChat() {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const suggestedQuestions = [
    t('yarnai.chatSuggestedQuestion1'),
    t('yarnai.chatSuggestedQuestion2'),
    t('yarnai.chatSuggestedQuestion3'),
    t('yarnai.chatSuggestedQuestion4'),
    t('yarnai.chatSuggestedQuestion5'),
  ];

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

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
              content: 'You are YarnAI, a helpful assistant specialized in yarn crafts, crochet, knitting, and fiber arts. Provide helpful, accurate, and encouraging advice about yarn projects, techniques, patterns, and troubleshooting. Keep responses friendly and accessible for crafters of all skill levels.',
            },
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
            {
              role: 'user',
              content: userMessage.content,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.completion) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.completion,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('No response from AI');
      }
    } catch (error: any) {
      console.error('Chat API Error:', error);
      Alert.alert(
        t('common.error'),
        `Failed to get response: ${error.message || 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputText(question);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  React.useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.headerWrapper}>
          <UniversalHeader
            title={t('yarnai.chatTitle')}
            showBack={true}
            showHelp={true}
          />
        </View>
      </SafeAreaView>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.messagesContainer}>
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <MessageSquare 
                  size={48} 
                  color={Colors.deepTeal} 
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyTitle} maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}>{t('yarnai.chatWelcomeTitle')}</Text>
                <Text style={styles.emptySubtitle} maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}>
                  {t('yarnai.chatWelcomeSubtitle')}
                </Text>
                <View style={styles.suggestedQuestions}>
                  {suggestedQuestions.map((question, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionButton}
                      onPress={() => handleSuggestedQuestion(question)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.suggestionText}>{question}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <>
                {messages.map((message) => (
                  <View
                    key={message.id}
                    style={[
                      styles.message,
                      message.role === 'user' ? styles.userMessage : styles.assistantMessage,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                      ]}
                    >
                      <View style={styles.messageHeader}>
                        {message.role === 'user' ? (
                          <User size={16} color={Colors.white} style={styles.messageIcon} />
                        ) : (
                          <Bot size={16} color={Colors.deepTeal} style={styles.messageIcon} />
                        )}
                        <Text
                          style={[
                            styles.messageSender,
                            message.role === 'user' ? styles.userSender : styles.assistantSender,
                          ]}
                        >
                          {message.role === 'user' ? t('yarnai.chatYou') : t('yarnai.chatYarnAI')}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.messageText,
                          message.role === 'user' ? styles.userText : styles.assistantText,
                        ]}
                        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                      >
                        {message.content}
                      </Text>
                      <Text
                        style={[
                          styles.messageTime,
                          message.role === 'user' ? styles.userTime : styles.assistantTime,
                        ]}
                      >
                        {formatTime(message.timestamp)}
                      </Text>
                    </View>
                  </View>
                ))}
                
                {isLoading && (
                  <View style={styles.typingIndicator}>
                    <View style={styles.typingBubble}>
                      <ActivityIndicator size="small" color={Colors.deepTeal} />
                      <Text style={styles.typingText}>{t('yarnai.chatTyping')}</Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder={t('yarnai.chatPlaceholder')}
            placeholderTextColor={Colors.warmGray}
            value={inputText}
            onChangeText={setInputText}
            multiline
            editable={!isLoading}
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Send size={20} color={Colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}