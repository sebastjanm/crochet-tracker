import React, { useState } from 'react';
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
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ImageIcon, RotateCcw } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { useLanguage } from '@/providers/LanguageProvider';
import { cardShadow } from '@/constants/pixelRatio';
import { MAX_FONT_SIZE_MULTIPLIER } from '@/constants/accessibility';
import { UniversalHeader } from '@/components/UniversalHeader';

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
  },
  title: {
    ...Typography.largeTitle,
    color: Colors.charcoal,
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.warmGray,
    lineHeight: 22,
  },
  inputSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
  },
  inputLabel: {
    ...Typography.title3,
    color: Colors.charcoal,
    marginBottom: 12,
  },
  input: {
    backgroundColor: Colors.beige,
    borderRadius: 12,
    padding: 16,
    ...Typography.body,
    color: Colors.charcoal,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: Colors.deepTeal,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonDisabled: {
    backgroundColor: Colors.warmGray,
  },
  generateButtonText: {
    ...Typography.button,
    color: Colors.white,
    marginLeft: 8,
  },
  resultSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ...cardShadow,
      default: {},
    }),
  },
  resultTitle: {
    ...Typography.title2,
    color: Colors.charcoal,
    marginBottom: 16,
  },
  generatedImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: Colors.beige,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.beige,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    ...Typography.button,
    color: Colors.charcoal,
    marginLeft: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.deepTeal,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...Typography.button,
    color: Colors.white,
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.warmGray,
    marginTop: 16,
    textAlign: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  examplePrompts: {
    marginTop: 12,
  },
  exampleTitle: {
    ...Typography.caption,
    color: Colors.warmGray,
    marginBottom: 8,
    fontWeight: '600' as const,
  },
  examplePrompt: {
    backgroundColor: Colors.cream,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  examplePromptText: {
    ...Typography.caption,
    color: Colors.charcoal,
    fontStyle: 'italic',
  },
});

export default function ImageGenerator() {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [isGenerating] = useState(false);

  const examplePrompts = [
    t('yarnai.imageGeneratorExample1'),
    t('yarnai.imageGeneratorExample2'),
    t('yarnai.imageGeneratorExample3'),
    t('yarnai.imageGeneratorExample4'),
    t('yarnai.imageGeneratorExample5'),
  ];

  const generateImage = async () => {
    // Feature disabled - Image Generator coming soon
    Alert.alert(
      t('common.comingSoon'),
      t('yarnai.imageGeneratorComingSoon')
    );
  };

  const handleExamplePrompt = (examplePrompt: string) => {
    setPrompt(examplePrompt);
  };

  const handleTryAgain = () => {
    setGeneratedImage('');
  };

  const handleNewPrompt = () => {
    setGeneratedImage('');
    setPrompt('');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.headerWrapper}>
          <UniversalHeader
            title={t('yarnai.imageGeneratorTitle')}
            showBack={true}
            showHelp={true}
          />
        </View>
      </SafeAreaView>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}>{t('yarnai.imageGeneratorPageTitle')}</Text>
            <Text style={styles.subtitle} maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}>
              {t('yarnai.imageGeneratorSubtitle')}
            </Text>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>{t('yarnai.imageGeneratorLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('yarnai.imageGeneratorPlaceholder')}
              placeholderTextColor={Colors.warmGray}
              value={prompt}
              onChangeText={setPrompt}
              multiline
              editable={!isGenerating}
            />

            <TouchableOpacity 
              style={[
                styles.generateButton,
                (isGenerating || !prompt.trim()) && styles.generateButtonDisabled
              ]}
              onPress={generateImage}
              disabled={isGenerating || !prompt.trim()}
              activeOpacity={0.8}
            >
              {isGenerating ? (
                <>
                  <ActivityIndicator size="small" color={Colors.white} />
                  <Text style={styles.generateButtonText}>{t('yarnai.imageGeneratorGenerating')}</Text>
                </>
              ) : (
                <>
                  <ImageIcon size={20} color={Colors.white} />
                  <Text style={styles.generateButtonText}>{t('yarnai.imageGeneratorButton')}</Text>
                </>
              )}
            </TouchableOpacity>

            {!generatedImage && (
              <View style={styles.examplePrompts}>
                <Text style={styles.exampleTitle}>{t('yarnai.imageGeneratorExamples')}</Text>
                {examplePrompts.map((example, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.examplePrompt}
                    onPress={() => handleExamplePrompt(example)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.examplePromptText}>&quot;{example}&quot;</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {isGenerating && (
            <View style={styles.resultSection}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.deepTeal} />
                <Text style={styles.loadingText}>
                  {t('yarnai.imageGeneratorCreating')}
                </Text>
              </View>
            </View>
          )}

          {generatedImage && (
            <View style={styles.resultSection}>
              <Text style={styles.resultTitle}>{t('yarnai.imageGeneratorResult')}</Text>
              <Image
                source={{ uri: generatedImage }}
                style={styles.generatedImage}
                contentFit="cover"
              />
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.secondaryButton}
                  onPress={handleTryAgain}
                  activeOpacity={0.8}
                >
                  <RotateCcw size={16} color={Colors.charcoal} />
                  <Text style={styles.secondaryButtonText}>{t('yarnai.imageGeneratorTryAgain')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={handleNewPrompt}
                  activeOpacity={0.8}
                >
                  <ImageIcon size={16} color={Colors.white} />
                  <Text style={styles.primaryButtonText}>{t('yarnai.imageGeneratorNewImage')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}