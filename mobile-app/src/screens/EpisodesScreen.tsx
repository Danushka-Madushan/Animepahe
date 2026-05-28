import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import useAxios from '../hooks/useAxios';
import { ANIME } from '../config/config';
import { Episode } from '../@types/types';
import EpisodeCard from '../components/EpisodeCard';

interface EpisodesScreenProps {
  seriesId: string;
  seriesName: string;
  onBack: () => void;
}

const EpisodesScreen: React.FC<EpisodesScreenProps> = ({ seriesId, seriesName, onBack }) => {
  const { isLoading, request } = useAxios();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchEpisodes = async (page: number) => {
    setLoadingMore(true);
    const response = await request<{ episodes: Episode[]; total_pages?: number }>({
      server: ANIME,
      endpoint: `/?method=series&session=${seriesId}&page=${page}`,
      method: 'GET',
    });

    if (response && response.episodes) {
      setEpisodes((prev) => [...prev, ...response.episodes]);
      if (response.total_pages) {
        setTotalPages(response.total_pages);
      }
    }
    setLoadingMore(false);
  };

  React.useEffect(() => {
    fetchEpisodes(1);
  }, []);

  const handleLoadMore = () => {
    if (currentPage < totalPages || totalPages === 0) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchEpisodes(nextPage);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{seriesName}</Text>
      </View>

      {isLoading && episodes.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>Loading episodes...</Text>
        </View>
      ) : (
        <FlatList
          data={episodes}
          keyExtractor={(item) => item.session}
          numColumns={2}
          renderItem={({ item }) => (
            <EpisodeCard
              episode={item}
              seriesName={seriesName}
              seriesId={seriesId}
            />
          )}
          contentContainerStyle={styles.episodesList}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color="#7c3aed" style={styles.footerLoader} />
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    color: '#7c3aed',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 16,
    fontSize: 16,
  },
  episodesList: {
    padding: 8,
  },
  footerLoader: {
    marginVertical: 16,
  },
});

export default EpisodesScreen;
