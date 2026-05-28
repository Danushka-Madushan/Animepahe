import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import SearchBar from '../components/SearchBar';
import SearchResultItem from '../components/SearchResultItem';
import EpisodesScreen from './EpisodesScreen';
import { SearchItem } from '../@types/types';

const HomeScreen: React.FC = () => {
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<{ id: string; name: string } | null>(null);

  const handleSearchResults = (results: SearchItem[]) => {
    setSearchResults(results);
  };

  const handleNavigateToEpisodes = () => {
    if (searchResults.length > 0) {
      const firstResult = searchResults[0];
      setSelectedSeries({
        id: firstResult.session,
        name: firstResult.title,
      });
    }
  };

  const handleSelectSeries = (item: SearchItem) => {
    setSelectedSeries({
      id: item.session,
      name: item.title,
    });
  };

  const handleBack = () => {
    setSelectedSeries(null);
  };

  if (selectedSeries) {
    return (
      <EpisodesScreen
        seriesId={selectedSeries.id}
        seriesName={selectedSeries.name}
        onBack={handleBack}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <span style={styles.logoText}>🎬</span>
          </View>
        </View>
      </View>
      
      <SearchBar
        onSearchResults={handleSearchResults}
        onNavigateToEpisodes={handleNavigateToEpisodes}
      />

      {searchResults.length > 0 && (
        <View style={styles.resultsContainer}>
          {searchResults.map((item) => (
            <SearchResultItem
              key={item.id}
              item={item}
              onPress={() => handleSelectSeries(item)}
            />
          ))}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  logoText: {
    fontSize: 30,
  },
  resultsContainer: {
    flex: 1,
  },
});

export default HomeScreen;
