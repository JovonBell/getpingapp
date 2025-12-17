import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Shows weekly activity summary
 * @param {object} summary - Activity summary data
 * @param {object} nextReminder - Next upcoming reminder (optional)
 */
export default function WeeklyActivityCard({ summary = {}, nextReminder = null }) {
  const {
    contactsReachedOut = 0,
    relationshipsImproved = 0,
    relationshipsCooling = 0,
  } = summary;

  const stats = [
    {
      icon: 'checkmark-circle',
      label: 'contacts reached out to',
      value: contactsReachedOut,
      color: '#4FFFB0',
    },
    {
      icon: 'trending-up',
      label: 'relationships improved',
      value: relationshipsImproved,
      color: '#4FFFB0',
    },
    {
      icon: 'trending-down',
      label: 'relationships cooling',
      value: relationshipsCooling,
      color: relationshipsCooling > 0 ? '#FF8C42' : '#666666',
    },
  ];

  const hasActivity = contactsReachedOut > 0 || relationshipsImproved > 0 || relationshipsCooling > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>THIS WEEK</Text>

      {!hasActivity ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={24} color="#666666" />
          <Text style={styles.emptyText}>No activity tracked yet this week</Text>
          <Text style={styles.emptySubtext}>Start reaching out to your contacts!</Text>
        </View>
      ) : (
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statRow}>
              <Ionicons name={stat.icon} size={16} color={stat.color} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      )}

      {nextReminder && (
        <View style={styles.reminderRow}>
          <Ionicons name="calendar" size={16} color="#FFD93D" />
          <Text style={styles.reminderText}>
            Next: {nextReminder.title}
            {nextReminder.dueLabel && (
              <Text style={styles.reminderDue}> ({nextReminder.dueLabel})</Text>
            )}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'rgba(79, 255, 176, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.2)',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
    letterSpacing: 1,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#888888',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  statsContainer: {
    gap: 10,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
    marginRight: 6,
    minWidth: 20,
  },
  statLabel: {
    fontSize: 14,
    color: '#cccccc',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  reminderText: {
    flex: 1,
    fontSize: 13,
    color: '#ffffff',
    marginLeft: 8,
  },
  reminderDue: {
    color: '#FFD93D',
  },
});
