import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Play, ChevronLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { Card } from '@/components/Card';
import { useLanguage } from '@/hooks/language-context';

interface VideoGuide {
  id: string;
  title: string;
  description: string;
  duration: string;
  youtubeId: string;
  category: string;
}



export default function VideoGuides() {
  const { t } = useLanguage();

  const videoGuides: VideoGuide[] = useMemo(() => [
    {
      id: '1',
      category: t('help.gettingStarted'),
      title: t('help.video1Title'),
      description: t('help.video1Description'),
      duration: '2:30',
      youtubeId: 'dQw4w9WgXcQ',
    },
    {
      id: '2',
      category: t('help.gettingStarted'),
      title: t('help.video2Title'),
      description: t('help.video2Description'),
      duration: '3:15',
      youtubeId: 'dQw4w9WgXcQ',
    },
    {
      id: '3',
      category: t('help.projects'),
      title: t('help.video3Title'),
      description: t('help.video3Description'),
      duration: '1:45',
      youtubeId: 'dQw4w9WgXcQ',
    },
    {
      id: '4',
      category: t('help.projects'),
      title: t('help.video4Title'),
      description: t('help.video4Description'),
      duration: '2:20',
      youtubeId: 'dQw4w9WgXcQ',
    },
    {
      id: '5',
      category: t('help.inventory'),
      title: t('help.video5Title'),
      description: t('help.video5Description'),
      duration: '3:00',
      youtubeId: 'dQw4w9WgXcQ',
    },
    {
      id: '6',
      category: t('help.inventory'),
      title: t('help.video6Title'),
      description: t('help.video6Description'),
      duration: '1:30',
      youtubeId: 'dQw4w9WgXcQ',
    },
  ], [t]);

  const openVideo = (youtubeId: string, title: string) => {
    router.push({
      pathname: '/video-player',
      params: { videoId: youtubeId, title },
    });
  };

  const groupedVideos = videoGuides.reduce((acc, video) => {
    if (!acc[video.category]) {
      acc[video.category] = [];
    }
    acc[video.category].push(video);
    return acc;
  }, {} as Record<string, VideoGuide[]>);

  return (
    <View style={styles.backgroundContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerWrapper}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
              accessibilityLabel={t('common.back')}
              accessibilityRole="button"
            >
              <ChevronLeft size={24} color={Colors.deepSage} strokeWidth={2.5} />
              <Text style={styles.backLabel}>{t('common.back')}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>{t('help.videosTitle')}</Text>
          <Text style={styles.subtitle}>
            {t('help.videosSubtitle')}
          </Text>
        </View>
      </SafeAreaView>

      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {Object.entries(groupedVideos).map(([category, videos]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            <View style={styles.videosGrid}>
              {videos.map((video) => (
                <TouchableOpacity
                  key={video.id}
                  onPress={() => openVideo(video.youtubeId, video.title)}
                  activeOpacity={0.7}
                  style={styles.videoItem}
                >
                  <Card style={styles.videoCard}>
                    <View style={styles.videoContent}>
                      <View style={styles.thumbnailContainer}>
                        <View style={styles.playButton}>
                          <Play size={24} color={Colors.white} fill={Colors.white} />
                        </View>
                        <View style={styles.durationBadge}>
                          <Text style={styles.durationText}>{video.duration}</Text>
                        </View>
                      </View>
                      <View style={styles.videoInfo}>
                        <Text style={styles.videoTitle}>{video.title}</Text>
                        <Text style={styles.videoDescription}>{video.description}</Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    backgroundColor: Colors.headerBg,
  },
  safeArea: {
    backgroundColor: Colors.headerBg,
  },
  headerWrapper: {
    backgroundColor: Colors.headerBg,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.linen,
  },
  backLabel: {
    fontSize: 16,
    color: Colors.deepSage,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.beige,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.charcoal,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.warmGray,
    lineHeight: 24,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.deepTeal,
    marginBottom: 16,
  },
  videosGrid: {
    gap: 16,
  },
  videoItem: {
    width: '100%',
  },
  videoCard: {
    padding: 16,
  },
  videoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  thumbnailContainer: {
    width: 80,
    height: 60,
    backgroundColor: Colors.deepTeal,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '600',
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.charcoal,
    marginBottom: 4,
  },
  videoDescription: {
    fontSize: 14,
    color: Colors.warmGray,
    lineHeight: 18,
  },
});