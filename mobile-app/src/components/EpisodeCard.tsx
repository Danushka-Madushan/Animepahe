import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, ScrollView, Linking } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import useAxios from '../hooks/useAxios';
import { ANIME, KWIK } from '../config/config';
import { Episode, DownloadLink } from '../@types/types';

interface EpisodeCardProps {
  episode: Episode;
  seriesName: string;
  seriesId: string;
}

const EpisodeCard: React.FC<EpisodeCardProps> = ({ episode, seriesName, seriesId }) => {
  const { isLoading, request } = useAxios();
  const [modalVisible, setModalVisible] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [downloadLinks, setDownloadLinks] = useState<DownloadLink[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const fetchEpisodeLinks = async () => {
    const response = await request<DownloadLink[]>({
      server: ANIME,
      endpoint: `/?method=episode&session=${seriesId}&ep=${episode.session}`,
      method: 'GET',
    });

    if (response && Array.isArray(response)) {
      setDownloadLinks(response);
      setModalVisible(true);
    }
  };

  const handleStream = async (link: string) => {
    setIsStreaming(true);
    const response = await request<{ content: { url: string } }>({
      server: KWIK,
      endpoint: '/',
      method: 'POST',
      data: {
        service: 'kwik',
        action: 'fetch',
        content: { kwik: link },
      },
    });

    if (response && response.content && response.content.url) {
      setStreamUrl(response.content.url);
    }
    setIsStreaming(false);
  };

  const handleOpenExternal = (link: string) => {
    Linking.openURL(link);
  };

  return (
    <>
      <TouchableOpacity style={styles.container} onPress={fetchEpisodeLinks}>
        <Image source={{ uri: episode.snapshot }} style={styles.snapshot} />
        <View style={styles.overlay}>
          <Text style={styles.episodeText}>EP {episode.episode}</Text>
          {isLoading && <ActivityIndicator color="#7c3aed" />}
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setModalVisible(false);
          setStreamUrl(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{seriesName} - Episode {episode.episode}</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); setStreamUrl(null); }}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {streamUrl ? (
              <Video
                source={{ uri: streamUrl }}
                style={styles.video}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping={false}
                shouldPlay={true}
              />
            ) : (
              <>
                <Text style={styles.sectionTitle}>Stream or Download</Text>
                <ScrollView style={styles.linksContainer}>
                  {downloadLinks.map((item, index) => (
                    <View key={index} style={styles.linkRow}>
                      <Text style={styles.linkName}>{item.name}</Text>
                      <View style={styles.buttonRow}>
                        <TouchableOpacity
                          style={[styles.button, styles.streamButton]}
                          onPress={() => handleStream(item.link)}
                          disabled={isStreaming}
                        >
                          <Text style={styles.buttonText}>
                            {isStreaming ? 'Loading...' : '▶ Stream'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.button, styles.downloadButton]}
                          onPress={() => handleOpenExternal(item.link)}
                        >
                          <Text style={styles.buttonText}>⬇ Download</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 160,
    height: 240,
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1F2937',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  snapshot: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  episodeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    color: '#9CA3AF',
    fontSize: 24,
    padding: 4,
  },
  video: {
    width: '100%',
    height: 250,
    backgroundColor: '#000',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    padding: 16,
    paddingBottom: 8,
  },
  linksContainer: {
    paddingHorizontal: 16,
  },
  linkRow: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  linkName: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  streamButton: {
    backgroundColor: '#7c3aed',
  },
  downloadButton: {
    backgroundColor: '#10B981',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default EpisodeCard;
