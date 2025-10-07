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
import { Stack } from 'expo-router';
import { Lightbulb, RotateCcw, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { useLanguage } from '@/hooks/language-context';

const CHAT_API_URL = 'https://toolkit.rork.com/text/llm/';

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
    minHeight: 100,
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
  resultTitle: {
    ...Typography.title2,
    color: Colors.charcoal,
    marginBottom: 16,
  },
  ideaCard: {
    backgroundColor: Colors.cream,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  ideaTitle: {
    ...Typography.title3,
    color: Colors.charcoal,
    marginBottom: 8,
  },
  ideaDescription: {
    ...Typography.body,
    color: Colors.warmGray,
    lineHeight: 22,
    marginBottom: 8,
  },
  ideaDetails: {
    ...Typography.caption,
    color: Colors.deepTeal,
    fontWeight: '600' as const,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
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
  promptSuggestions: {
    marginTop: 12,
  },
  suggestionTitle: {
    ...Typography.caption,
    color: Colors.warmGray,
    marginBottom: 8,
    fontWeight: '600' as const,
  },
  suggestionChip: {
    backgroundColor: Colors.cream,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  suggestionChipText: {
    ...Typography.caption,
    color: Colors.charcoal,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

interface ProjectIdea {
  title: string;
  description: string;
  difficulty: string;
  timeEstimate: string;
  materials: string;
}

export default function ProjectIdeas() {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [ideas, setIdeas] = useState<ProjectIdea[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const promptSuggestions = [
    t('yarnai.projectIdeasSuggestion1'),
    t('yarnai.projectIdeasSuggestion2'),
    t('yarnai.projectIdeasSuggestion3'),
    t('yarnai.projectIdeasSuggestion4'),
    t('yarnai.projectIdeasSuggestion5'),
    t('yarnai.projectIdeasSuggestion6'),
    t('yarnai.projectIdeasSuggestion7'),
    t('yarnai.projectIdeasSuggestion8'),
  ];

  const generateIdeas = async () => {
    if (!prompt.trim()) {
      Alert.alert(t('common.error'), t('yarnai.projectIdeasError'));
      return;
    }

    setIsGenerating(true);
    setIdeas([]);

    try {
      console.log('Generating project ideas, prompt:', prompt);
      
      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a creative yarn craft expert. Generate 3-4 specific project ideas based on the user's request. 

For each project, provide:
- A catchy project title
- A detailed description (2-3 sentences)
- Difficulty level (Beginner/Intermediate/Advanced)
- Time estimate (e.g., "2-3 hours", "Weekend project", "1-2 weeks")
- Key materials needed

Format your response as a JSON array with objects containing: title, description, difficulty, timeEstimate, materials

Example:
[
  {
    "title": "Cozy Cable Knit Scarf",
    "description": "A classic cable knit scarf perfect for cold weather. Features a beautiful twisted cable pattern that looks complex but uses basic techniques. Great for practicing cable knitting skills.",
    "difficulty": "Intermediate",
    "timeEstimate": "1-2 weeks",
    "materials": "Worsted weight yarn (300g), Cable needle, Size 8 knitting needles"
  }
]`,
            },
            {
              role: 'user',
              content: `Generate creative yarn project ideas for: ${prompt}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.completion) {
        try {
          // Try to parse JSON from the response
          const jsonMatch = data.completion.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsedIdeas = JSON.parse(jsonMatch[0]);
            setIdeas(parsedIdeas);
          } else {
            // Fallback: parse the response manually
            throw new Error('Could not parse JSON response');
          }
        } catch (parseError) {
          console.error('JSON parsing error:', parseError);
          // Create a single idea from the text response
          setIdeas([{
            title: 'Creative Project Idea',
            description: data.completion,
            difficulty: 'Various',
            timeEstimate: 'Varies',
            materials: 'See description for details',
          }]);
        }
      } else {
        throw new Error('No response from AI');
      }
    } catch (error: any) {
      console.error('Ideas Generation Error:', error);
      Alert.alert(
        t('common.error'),
        `Failed to generate ideas: ${error.message || 'Unknown error'}`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestionChip = (suggestion: string) => {
    const currentPrompt = prompt.trim();
    if (currentPrompt) {
      setPrompt(`${currentPrompt}, ${suggestion.toLowerCase()}`);
    } else {
      setPrompt(suggestion.toLowerCase());
    }
  };

  const handleTryAgain = () => {
    setIdeas([]);
  };

  const handleNewPrompt = () => {
    setIdeas([]);
    setPrompt('');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: t('yarnai.projectIdeasTitle'),
          headerStyle: { backgroundColor: Colors.cream },
          headerTintColor: Colors.charcoal,
        }} 
      />
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t('yarnai.projectIdeasPageTitle')}</Text>
            <Text style={styles.subtitle}>
              {t('yarnai.projectIdeasSubtitle')}
            </Text>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>{t('yarnai.projectIdeasLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('yarnai.projectIdeasPlaceholder')}
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
              onPress={generateIdeas}
              disabled={isGenerating || !prompt.trim()}
              activeOpacity={0.8}
            >
              {isGenerating ? (
                <>
                  <ActivityIndicator size="small" color={Colors.white} />
                  <Text style={styles.generateButtonText}>{t('yarnai.projectIdeasGenerating')}</Text>
                </>
              ) : (
                <>
                  <Lightbulb size={20} color={Colors.white} />
                  <Text style={styles.generateButtonText}>{t('yarnai.projectIdeasButton')}</Text>
                </>
              )}
            </TouchableOpacity>

            {!ideas.length && (
              <View style={styles.promptSuggestions}>
                <Text style={styles.suggestionTitle}>{t('yarnai.projectIdeasSuggestions')}</Text>
                <View style={styles.suggestionsRow}>
                  {promptSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionChip}
                      onPress={() => handleSuggestionChip(suggestion)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.suggestionChipText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {isGenerating && (
            <View style={styles.resultSection}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.deepTeal} />
                <Text style={styles.loadingText}>
                  {t('yarnai.projectIdeasCreating')}
                </Text>
              </View>
            </View>
          )}

          {ideas.length > 0 && (
            <View style={styles.resultSection}>
              <Text style={styles.resultTitle}>{t('yarnai.projectIdeasResult')}</Text>
              {ideas.map((idea, index) => (
                <View key={index} style={styles.ideaCard}>
                  <Text style={styles.ideaTitle}>{idea.title}</Text>
                  <Text style={styles.ideaDescription}>{idea.description}</Text>
                  <Text style={styles.ideaDetails}>
                    {idea.difficulty} • {idea.timeEstimate} • {idea.materials}
                  </Text>
                </View>
              ))}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.secondaryButton}
                  onPress={handleTryAgain}
                  activeOpacity={0.8}
                >
                  <RotateCcw size={16} color={Colors.charcoal} />
                  <Text style={styles.secondaryButtonText}>{t('yarnai.projectIdeasTryAgain')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={handleNewPrompt}
                  activeOpacity={0.8}
                >
                  <Sparkles size={16} color={Colors.white} />
                  <Text style={styles.primaryButtonText}>{t('yarnai.projectIdeasNewIdeas')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}