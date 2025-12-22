/**
 * AISuggestionCard - Inline AI conversation suggestion
 * 
 * Shows contextual conversation starters with:
 * - "Use this" button to copy/send
 * - "Regenerate" to get new suggestion
 * - Source indicator (AI, recent activity, etc.)
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchPingQuestion, rateSuggestion } from '../../utils/api/pingAI';

export default function AISuggestionCard({
  contactId,
  contactName,
  lastInteraction,
  sharedInterests,
  recentActivity,
  goalType,
  onUseSuggestion,
  onDismiss,
  style,
}) {
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [suggestionId, setSuggestionId] = useState(null);

  const loadSuggestion = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchPingQuestion(contactId, {
        lastInteraction,
        sharedInterests,
        recentActivity,
        goalType,
      });
      
      setSuggestion(result);
      setSuggestionId(Date.now().toString()); // Simple ID for now
    } catch (err) {
      console.error('[AISuggestionCard] Error:', err);
      setError('Failed to generate suggestion');
    } finally {
      setLoading(false);
    }
  }, [contactId, lastInteraction, sharedInterests, recentActivity, goalType]);

  useEffect(() => {
    loadSuggestion();
  }, [loadSuggestion]);

  const handleUse = () => {
    if (suggestion?.suggestion) {
      rateSuggestion(suggestionId, 5, true);
      onUseSuggestion?.(suggestion.suggestion);
    }
  };

  const handleRegenerate = () => {
    rateSuggestion(suggestionId, 2, false);
    loadSuggestion();
  };

  const handleDismiss = () => {
    rateSuggestion(suggestionId, 1, false);
    onDismiss?.();
  };

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadSuggestion}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="sparkles" size={16} color="#4FFFB0" />
          <Text style={styles.headerText}>PING AI INSIGHT</Text>
        </View>
        {onDismiss && (
          <TouchableOpacity onPress={handleDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={18} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestion Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#4FFFB0" />
          <Text style={styles.loadingText}>Generating suggestion for {contactName}...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.suggestionText}>"{suggestion?.suggestion}"</Text>
          
          {/* Source indicator */}
          {suggestion?.source && suggestion.source !== 'fallback' && (
            <View style={styles.sourceContainer}>
              <Ionicons 
                name={getSourceIcon(suggestion.source)} 
                size={12} 
                color="#666" 
              />
              <Text style={styles.sourceText}>
                {getSourceLabel(suggestion.source, suggestion.reasoning)}
              </Text>
            </View>
          )}
        </>
      )}

      {/* Action Buttons */}
      {!loading && (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.useButton} 
            onPress={handleUse}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={16} color="#000" />
            <Text style={styles.useButtonText}>Use this</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.regenerateButton} 
            onPress={handleRegenerate}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={18} color="#4FFFB0" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function getSourceIcon(source) {
  switch (source) {
    case 'linkedin':
      return 'logo-linkedin';
    case 'twitter':
      return 'logo-twitter';
    case 'calendar':
      return 'calendar-outline';
    case 'ai':
      return 'sparkles';
    default:
      return 'bulb-outline';
  }
}

function getSourceLabel(source, reasoning) {
  if (reasoning) return reasoning;
  
  switch (source) {
    case 'linkedin':
      return 'Based on recent LinkedIn activity';
    case 'twitter':
      return 'Based on recent tweets';
    case 'calendar':
      return 'Based on shared calendar';
    case 'ai':
      return 'AI-generated';
    default:
      return 'Personalized for you';
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(20, 30, 25, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.2)',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerText: {
    color: '#4FFFB0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  loadingText: {
    color: '#888',
    fontSize: 13,
  },
  suggestionText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  sourceText: {
    color: '#666',
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  useButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4FFFB0',
    paddingVertical: 12,
    borderRadius: 12,
  },
  useButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '600',
  },
  regenerateButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(79, 255, 176, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.3)',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: 6,
  },
  retryText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
  },
});
