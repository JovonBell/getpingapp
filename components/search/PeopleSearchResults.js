/**
 * PeopleSearchResults - Display discovered people in 3D/list view
 * 
 * Shows Exa search results with:
 * - LinkedIn profile data
 * - Add to ring action
 * - Six degrees path discovery
 */

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function PeopleSearchResults({
  results = [],
  loading = false,
  error = null,
  onPersonTap,
  onAddToRing,
  onFindPath,
  style,
}) {
  const [expandedId, setExpandedId] = useState(null);

  const handlePersonTap = useCallback((person) => {
    if (expandedId === person.id) {
      setExpandedId(null);
    } else {
      setExpandedId(person.id);
    }
    onPersonTap?.(person);
  }, [expandedId, onPersonTap]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, style]}>
        <ActivityIndicator size="large" color="#4FFFB0" />
        <Text style={styles.loadingText}>Searching 1B+ profiles...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent, style]}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent, style]}>
        <Ionicons name="search-outline" size={48} color="#666" />
        <Text style={styles.emptyText}>No people found</Text>
        <Text style={styles.emptyHint}>Try a different search query</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Results header */}
      <View style={styles.header}>
        <Text style={styles.resultCount}>{results.length} people found</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={18} color="#4FFFB0" />
        </TouchableOpacity>
      </View>

      {/* Results list */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PersonCard
            person={item}
            isExpanded={expandedId === item.id}
            onPress={() => handlePersonTap(item)}
            onAddToRing={() => onAddToRing?.(item)}
            onFindPath={() => onFindPath?.(item)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

function PersonCard({ person, isExpanded, onPress, onAddToRing, onFindPath }) {
  // Get initials for avatar fallback
  const initials = person.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '??';

  return (
    <TouchableOpacity
      style={[styles.card, isExpanded && styles.cardExpanded]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Main content row */}
      <View style={styles.cardContent}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {person.avatar ? (
            <Image source={{ uri: person.avatar }} style={styles.avatar} />
          ) : (
            <LinearGradient
              colors={['#4FFFB0', '#00B894']}
              style={styles.avatarFallback}
            >
              <Text style={styles.initials}>{initials}</Text>
            </LinearGradient>
          )}
          {person.linkedinUrl && (
            <View style={styles.linkedinBadge}>
              <Ionicons name="logo-linkedin" size={10} color="#fff" />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{person.name}</Text>
          {person.currentRole && (
            <Text style={styles.role} numberOfLines={1}>{person.currentRole}</Text>
          )}
          {person.company && (
            <Text style={styles.company} numberOfLines={1}>
              at {person.company}
            </Text>
          )}
          {person.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color="#666" />
              <Text style={styles.location}>{person.location}</Text>
            </View>
          )}
        </View>

        {/* Expand indicator */}
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#666"
        />
      </View>

      {/* Expanded content */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* Summary/highlights */}
          {person.summary && (
            <Text style={styles.summary} numberOfLines={3}>
              {person.summary}
            </Text>
          )}

          {/* Highlights tags */}
          {person.highlights?.length > 0 && (
            <View style={styles.highlightsRow}>
              {person.highlights.slice(0, 3).map((highlight, i) => (
                <View key={i} style={styles.highlightTag}>
                  <Text style={styles.highlightText} numberOfLines={1}>
                    {highlight.slice(0, 50)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onAddToRing}
            >
              <Ionicons name="add-circle-outline" size={18} color="#4FFFB0" />
              <Text style={styles.actionText}>Add to Ring</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.pathButton]}
              onPress={onFindPath}
            >
              <Ionicons name="git-network-outline" size={18} color="#000" />
              <Text style={styles.pathButtonText}>Find Path</Text>
            </TouchableOpacity>
          </View>

          {/* Source link */}
          {person.linkedinUrl && (
            <TouchableOpacity style={styles.sourceLink}>
              <Ionicons name="open-outline" size={14} color="#4FFFB0" />
              <Text style={styles.sourceLinkText}>View on LinkedIn</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
    marginTop: 16,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 12,
  },
  emptyHint: {
    color: '#555',
    fontSize: 13,
    marginTop: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultCount: {
    color: '#888',
    fontSize: 13,
  },
  filterButton: {
    padding: 8,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  separator: {
    height: 12,
  },
  card: {
    backgroundColor: 'rgba(20, 25, 22, 0.9)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.1)',
  },
  cardExpanded: {
    borderColor: 'rgba(79, 255, 176, 0.3)',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
  linkedinBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0A66C2',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#141916',
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  role: {
    color: '#4FFFB0',
    fontSize: 13,
    marginBottom: 1,
  },
  company: {
    color: '#888',
    fontSize: 13,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    color: '#666',
    fontSize: 12,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  summary: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  highlightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  highlightTag: {
    backgroundColor: 'rgba(79, 255, 176, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  highlightText: {
    color: '#4FFFB0',
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(79, 255, 176, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.3)',
  },
  actionText: {
    color: '#4FFFB0',
    fontSize: 13,
    fontWeight: '600',
  },
  pathButton: {
    backgroundColor: '#4FFFB0',
    borderColor: '#4FFFB0',
  },
  pathButtonText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 8,
  },
  sourceLinkText: {
    color: '#4FFFB0',
    fontSize: 12,
  },
});
