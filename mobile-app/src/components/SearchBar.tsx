import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import useAxios from '../hooks/useAxios';
import { ANIME } from '../config/config';
import { SearchItem } from '../@types/types';

interface SearchBarProps {
  onSearchResults: (results: SearchItem[]) => void;
  onNavigateToEpisodes: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearchResults, onNavigateToEpisodes }) => {
  const [query, setQuery] = useState('');
  const { isLoading, request } = useAxios();
  const [suggestions, setSuggestions] = useState<SearchItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    const response = await request<SearchItem[]>({
      server: ANIME,
      endpoint: `/?method=search&keyword=${encodeURIComponent(query)}`,
      method: 'GET',
    });

    if (response && Array.isArray(response)) {
      setSuggestions(response);
      setShowSuggestions(true);
      onSearchResults(response);
    }
  };

  const handleSelectItem = (item: SearchItem) => {
    setQuery(item.title);
    setShowSuggestions(false);
    onSearchResults([item]);
    onNavigateToEpisodes();
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search anime..."
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.button} onPress={handleSearch} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#7c3aed" />
          ) : (
            <Text style={styles.buttonText}>🔍</Text>
          )}
        </TouchableOpacity>
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.suggestionItem}
              onPress={() => handleSelectItem(item)}
            >
              <Text style={styles.suggestionText}>{item.title}</Text>
            </TouchableOpacity>
          )}
          style={styles.suggestionsList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  button: {
    padding: 8,
  },
  buttonText: {
    fontSize: 20,
  },
  suggestionsList: {
    marginTop: 8,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    maxHeight: 300,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  suggestionText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});

export default SearchBar;
