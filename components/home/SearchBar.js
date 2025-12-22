import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getHealthColor } from '../../utils/scoring/healthScoring';

export default function SearchBar({ 
  contacts = [], 
  circles = [],
  healthMap = {},
  ringedContacts = [],
  onSelectContact,
  visible = true,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const filteredContacts = useMemo(() => {
    if (searchQuery.length === 0) return [];
    const query = searchQuery.toLowerCase();
    return contacts.filter(contact =>
      contact?.name?.toLowerCase?.().includes(query)
    );
  }, [searchQuery, contacts]);

  const handleFocus = () => setShowResults(true);
  const handleBlur = () => setTimeout(() => setShowResults(false), 200);

  if (!visible) return null;

  return (
    <View style={styles.searchWrapper}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#4FFFB0" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="search your circle"
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </View>

      {showResults && searchQuery.length > 0 && (
        <View style={styles.searchResults}>
          {filteredContacts.length > 0 ? (
            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const ringedEntry = ringedContacts.find(entry => entry.contact?.id === item?.id);
                const circleName = ringedEntry ? circles[ringedEntry.ringIndex]?.name : null;
                const health = healthMap[item?.importedContactId];
                const healthColor = health ? getHealthColor(health.status) : '#4FFFB0';
                const healthStatus = health?.status || 'healthy';
                const needsAttention = healthStatus === 'cold' || healthStatus === 'at_risk';

                return (
                  <TouchableOpacity
                    style={styles.searchResultItem}
                    onPress={() => {
                      const ringedIndex = ringedContacts.findIndex(entry => entry.contact?.id === item?.id);
                      if (ringedIndex >= 0) {
                        onSelectContact(item, ringedIndex);
                        setSearchQuery('');
                        setShowResults(false);
                      }
                    }}
                  >
                    <View style={[
                      styles.resultAvatar,
                      { backgroundColor: healthColor + '20', borderWidth: 2, borderColor: healthColor }
                    ]}>
                      <Text style={styles.resultAvatarText}>{item.initials}</Text>
                    </View>
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultName}>{item.name}</Text>
                      <View style={styles.resultMetaRow}>
                        {circleName && (
                          <View style={styles.resultCircleBadge}>
                            <Text style={styles.resultCircleText}>{circleName}</Text>
                          </View>
                        )}
                        <View style={[styles.resultHealthBadge, { backgroundColor: healthColor + '25' }]}>
                          <View style={[styles.resultHealthDot, { backgroundColor: healthColor }]} />
                          <Text style={[styles.resultHealthText, { color: healthColor }]}>
                            {healthStatus === 'healthy' ? 'Healthy' :
                             healthStatus === 'cooling' ? 'Cooling' :
                             healthStatus === 'at_risk' ? 'At Risk' : 'Cold'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {needsAttention && (
                      <Text style={styles.resultAttentionBadge}>
                        {healthStatus === 'cold' ? '❄️' : '⚠️'}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              }}
              style={styles.searchResultsList}
            />
          ) : (
            <Text style={styles.noResults}>No contacts found</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrapper: {
    position: 'relative',
    zIndex: 100,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderWidth: 2,
    borderColor: '#4FFFB0',
    borderRadius: 25,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 12,
  },
  searchResults: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: '#1a2a1a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4FFFB0',
    maxHeight: 250,
    zIndex: 1000,
  },
  searchResultsList: {
    maxHeight: 250,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3a2a',
  },
  resultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultAvatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  resultCircleBadge: {
    backgroundColor: 'rgba(79, 255, 176, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  resultCircleText: {
    color: '#4FFFB0',
    fontSize: 10,
    fontWeight: '500',
  },
  resultHealthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  resultHealthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  resultHealthText: {
    fontSize: 10,
    fontWeight: '600',
  },
  resultAttentionBadge: {
    fontSize: 14,
    marginLeft: 8,
  },
  noResults: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
