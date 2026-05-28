import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { SearchItem } from '../@types/types';

interface SearchResultItemProps {
  item: SearchItem;
  onPress: () => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ item, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={{ uri: item.poster }} style={styles.poster} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.year}>{item.year}</Text>
          <Text style={styles.type}>{item.type}</Text>
          <Text style={styles.episodes}>{item.episodes} EP</Text>
        </View>
        <Text style={styles.score}>⭐ {item.score}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    margin: 8,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  poster: {
    width: 100,
    height: 150,
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  year: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  type: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  episodes: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  score: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SearchResultItem;
