import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import YoutubePlayer from 'react-native-youtube-iframe';
import { ModalHeader } from '@/components/ModalHeader';
import { Colors } from '@/constants/colors';
import { useLanguage } from '@/providers/LanguageProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PLAYER_HEIGHT = (SCREEN_WIDTH * 9) / 16; // 16:9 aspect ratio

export default function VideoPlayer() {
  const { videoId, title } = useLocalSearchParams<{ videoId: string; title: string }>();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const onReady = useCallback(() => {
    setIsLoading(false);
  }, []);

  const onError = useCallback((error: string) => {
    if (__DEV__) console.log('YouTube Player Error:', error);
    setIsLoading(false);
    setHasError(true);
  }, []);

  const onChangeState = useCallback((state: string) => {
    if (__DEV__) console.log('YouTube Player State:', state);
  }, []);

  return (
    <View style={styles.screen}>
      <ModalHeader title={title || t('help.videoGuide')} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.white} />
            <Text style={styles.loadingText}>{t('help.openingVideo')}</Text>
          </View>
        )}

        {hasError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{t('help.videoNotAvailable')}</Text>
            <Text style={styles.errorSubtext}>{t('help.videoErrorHint')}</Text>
          </View>
        ) : (
          <View style={styles.playerContainer}>
            <YoutubePlayer
              height={PLAYER_HEIGHT}
              width={SCREEN_WIDTH}
              videoId={videoId || ''}
              play={false}
              onReady={onReady}
              onError={onError}
              onChangeState={onChangeState}
              webViewProps={{
                allowsInlineMediaPlayback: true,
                mediaPlaybackRequiresUserAction: false,
              }}
            />
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  playerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.black,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.black,
    zIndex: 10,
  },
  loadingText: {
    color: Colors.white,
    fontSize: 14,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.black,
    padding: 24,
  },
  errorText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
});
