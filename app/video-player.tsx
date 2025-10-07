import React from 'react';
import { View, StyleSheet, Text, Platform, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { X } from 'lucide-react-native';
import Colors from '@/constants/colors';

let WebView: any = null;
try {
  if (Platform.OS !== 'web') {
    const { WebView: RNWebView } = require('react-native-webview');
    WebView = RNWebView;
  }
} catch (error) {
  console.log('WebView not available:', error);
}

export default function VideoPlayer() {
  const { videoId, title } = useLocalSearchParams<{ videoId: string; title: string }>();

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1`;

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: title || 'Video Guide',
          presentation: 'modal',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <X size={24} color={Colors.charcoal} />
            </TouchableOpacity>
          ),
        }} 
      />
      <View style={styles.container}>
        {Platform.OS === 'web' ? (
          <View style={styles.webContainer}>
            <iframe
              src={embedUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              } as React.CSSProperties}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </View>
        ) : WebView ? (
          <WebView
            source={{ uri: embedUrl }}
            style={styles.webview}
            allowsFullscreenVideo
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            mediaPlaybackRequiresUserAction={false}
          />
        ) : (
          <View style={styles.fallback}>
            <Text style={styles.fallbackText}>Video player not available</Text>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerButton: {
    padding: 8,
  },
  webview: {
    flex: 1,
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  fallbackText: {
    color: Colors.white,
    fontSize: 16,
  },
});