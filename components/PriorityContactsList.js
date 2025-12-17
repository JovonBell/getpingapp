import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getHealthColor } from '../utils/healthScoring';

/**
 * List of contacts that need attention (sorted by health score ascending)
 * @param {Array} contacts - Array of contacts with health data
 * @param {function} onContactPress - Callback when a contact is pressed
 * @param {function} onViewAll - Callback when "View All" is pressed
 * @param {number} maxItems - Maximum items to show
 */
export default function PriorityContactsList({
  contacts = [],
  onContactPress,
  onViewAll,
  maxItems = 5,
}) {
  const displayContacts = contacts.slice(0, maxItems);

  if (contacts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Ionicons name="checkmark-circle" size={20} color="#4FFFB0" />
          <Text style={styles.title}>ALL CAUGHT UP!</Text>
        </View>
        <Text style={styles.emptyText}>
          All your relationships are healthy. Great job maintaining your network!
        </Text>
      </View>
    );
  }

  const renderContact = ({ item }) => {
    const color = getHealthColor(item.status);
    const statusIcon = item.status === 'cold' ? 'snow' :
                       item.status === 'at_risk' ? 'warning' : 'time';

    return (
      <TouchableOpacity
        style={styles.contactRow}
        onPress={() => onContactPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, { borderColor: color }]}>
          <Text style={styles.avatarText}>{item.initials || '?'}</Text>
        </View>

        <View style={styles.contactInfo}>
          <Text style={styles.contactName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.statusRow}>
            <Ionicons name={statusIcon} size={12} color={color} />
            <Text style={[styles.daysText, { color }]}>
              {item.daysSinceContact} days since contact
            </Text>
          </View>
        </View>

        <View style={[styles.healthBadge, { backgroundColor: `${color}20` }]}>
          <Text style={[styles.healthScore, { color }]}>{item.healthScore}%</Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#666666" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="flame" size={20} color="#FF8C42" />
        <Text style={styles.title}>NEEDS YOUR ATTENTION</Text>
        <Text style={styles.countBadge}>{contacts.length}</Text>
      </View>

      <FlatList
        data={displayContacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {contacts.length > maxItems && (
        <TouchableOpacity style={styles.viewAllButton} onPress={onViewAll}>
          <Text style={styles.viewAllText}>View All ({contacts.length})</Text>
          <Ionicons name="arrow-forward" size={16} color="#4FFFB0" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'rgba(255, 140, 66, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.2)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
    letterSpacing: 1,
  },
  countBadge: {
    backgroundColor: '#FF8C42',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  emptyText: {
    fontSize: 14,
    color: '#4FFFB0',
    textAlign: 'center',
    paddingVertical: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  daysText: {
    fontSize: 12,
  },
  healthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  healthScore: {
    fontSize: 12,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4FFFB0',
  },
});
