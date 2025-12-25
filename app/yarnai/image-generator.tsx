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
  Image,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isTablet = width >= 768;
import { ImageIcon, RotateCcw } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { useLanguage } from '@/hooks/language-context';
import { cardShadow, normalizeBorder, normalizeBorderOpacity } from '@/constants/pixelRatio';
import { MAX_FONT_SIZE_MULTIPLIER } from '@/constants/accessibility';

const IMAGE_API_URL = 'https://toolkit.rork.com/images/generate/';

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
  const [isGenerating, setIsGenerating] = useState(false);

  const examplePrompts = [
    t('yarnai.imageGeneratorExample1'),
    t('yarnai.imageGeneratorExample2'),
    t('yarnai.imageGeneratorExample3'),
    t('yarnai.imageGeneratorExample4'),
    t('yarnai.imageGeneratorExample5'),
  ];

  const generateImage = async () => {
    if (!prompt.trim()) {
      Alert.alert(t('common.error'), t('yarnai.imageGeneratorError'));
      return;
    }

    setIsGenerating(true);
    setGeneratedImage('');

    try {
      console.log('Generating image with DALL-E 3, prompt:', prompt);
      
      const response = await fetch(IMAGE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Create a beautiful, high-quality image of: ${prompt}. Focus on yarn, crochet, or knitting projects with vibrant colors and clear details. Professional photography style.`,
          size: '1024x1024'
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Image API Error Response:', errorData);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Image API response received');
      
      if (data.image && data.image.base64Data) {
        const base64Image = `data:${data.image.mimeType};base64,${data.image.base64Data}`;
        setGeneratedImage(base64Image);
        console.log('Image generated successfully');
      } else {
        console.error('Unexpected response format:', data);
        throw new Error('No image data in response');
      }
      
    } catch (error: any) {
      console.error('Image Generation Error:', error);
      Alert.alert(
        t('common.error'), 
        `Failed to generate image: ${error.message || 'Unknown error'}`
      );
    } finally {
      setIsGenerating(false);
    }
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
                resizeMode="cover"
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