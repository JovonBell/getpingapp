import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../utils/supabaseStorage';
import { loadCirclesWithMembers } from '../utils/circlesStorage';

export default function DiagnosticsScreen({ navigation }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test, status, message) => {
    setResults(prev => [...prev, { test, status, message, time: new Date().toLocaleTimeString() }]);
  };

  const runDiagnostics = async () => {
    setResults([]);
    setLoading(true);

    try {
      // Test 1: Check Auth
      addResult('Auth Session', 'testing', 'Checking authentication...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        addResult('Auth Session', 'error', `Session error: ${sessionError.message}`);
      } else if (!session) {
        addResult('Auth Session', 'error', 'No active session found');
      } else {
        addResult('Auth Session', 'success', `User ID: ${session.user.id.substring(0, 8)}...`);

        // Test 2: Check User from helper
        addResult('Get Current User', 'testing', 'Getting current user...');
        const { success: userSuccess, user, error: userError } = await getCurrentUser();
        if (!userSuccess) {
          addResult('Get Current User', 'error', userError || 'Failed to get user');
        } else {
          addResult('Get Current User', 'success', `User: ${user.email}`);
        }

        // Test 3: Check profiles table
        addResult('Profiles Table', 'testing', 'Checking profiles table...');
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileErr) {
          addResult('Profiles Table', 'error', `Error: ${profileErr.message}`);
        } else if (!profile) {
          addResult('Profiles Table', 'warning', 'No profile found');
        } else {
          addResult('Profiles Table', 'success', `Profile found: ${profile.name || 'No name'}`);
        }

        // Test 4: Check circles table
        addResult('Circles Table', 'testing', 'Checking circles table...');
        const { data: circles, error: circlesErr } = await supabase
          .from('circles')
          .select('*')
          .eq('user_id', session.user.id);
        
        if (circlesErr) {
          addResult('Circles Table', 'error', `Error: ${circlesErr.message}`);
          if (circlesErr.message.includes('does not exist')) {
            addResult('Circles Table', 'error', '🚨 TABLES NOT CREATED! Run migrations in Supabase Dashboard!');
          }
        } else {
          addResult('Circles Table', 'success', `Found ${circles?.length || 0} circles`);
          if (circles && circles.length > 0) {
            circles.forEach(c => {
              addResult('Circle Detail', 'info', `"${c.name}" (tier ${c.tier})`);
            });
          }
        }

        // Test 5: Check imported_contacts table
        addResult('Imported Contacts Table', 'testing', 'Checking imported_contacts...');
        const { data: contacts, error: contactsErr } = await supabase
          .from('imported_contacts')
          .select('*')
          .eq('user_id', session.user.id);
        
        if (contactsErr) {
          addResult('Imported Contacts Table', 'error', `Error: ${contactsErr.message}`);
        } else {
          addResult('Imported Contacts Table', 'success', `Found ${contacts?.length || 0} contacts`);
        }

        // Test 6: Check circle_members table
        if (circles && circles.length > 0) {
          addResult('Circle Members Table', 'testing', 'Checking circle_members...');
          const circleIds = circles.map(c => c.id);
          const { data: members, error: membersErr } = await supabase
            .from('circle_members')
            .select('*')
            .in('circle_id', circleIds);
          
          if (membersErr) {
            addResult('Circle Members Table', 'error', `Error: ${membersErr.message}`);
          } else {
            addResult('Circle Members Table', 'success', `Found ${members?.length || 0} members`);
          }
        }

        // Test 7: Use the actual loading function
        addResult('Load Circles Function', 'testing', 'Testing loadCirclesWithMembers()...');
        const loadResult = await loadCirclesWithMembers(session.user.id);
        if (loadResult.success) {
          addResult('Load Circles Function', 'success', `Loaded ${loadResult.circles?.length || 0} circles successfully`);
        } else {
          addResult('Load Circles Function', 'error', `Failed: ${loadResult.error}`);
        }
      }
    } catch (err) {
      addResult('Diagnostics', 'error', `Exception: ${err.message}`);
    }

    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#4FFFB0';
      case 'error': return '#ff6b6b';
      case 'warning': return '#ffaa00';
      case 'testing': return '#888';
      default: return '#fff';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'testing': return '⏳';
      default: return 'ℹ️';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a2e1a', '#05140a', '#000000']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Diagnostics</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.runButton} 
            onPress={runDiagnostics}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.runButtonText}>Run Database Tests</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.resultsContainer}>
          {results.map((result, idx) => (
            <View key={idx} style={styles.resultItem}>
              <Text style={styles.resultIcon}>{getStatusIcon(result.status)}</Text>
              <View style={styles.resultContent}>
                <Text style={styles.resultTest}>{result.test}</Text>
                <Text style={[styles.resultMessage, { color: getStatusColor(result.status) }]}>
                  {result.message}
                </Text>
                <Text style={styles.resultTime}>{result.time}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {results.length > 0 && (
          <View style={styles.instructions}>
            <Text style={styles.instructionsTitle}>📋 Next Steps:</Text>
            {results.some(r => r.message.includes('does not exist')) && (
              <Text style={styles.instructionsText}>
                🚨 DATABASE TABLES MISSING!{'\n'}
                1. Open Supabase Dashboard → SQL Editor{'\n'}
                2. Run all migration files in order{'\n'}
                3. See CRITICAL_FIX_CIRCLES_PERSISTENCE.md
              </Text>
            )}
            {results.some(r => r.status === 'success' && r.test === 'Circles Table') && (
              <Text style={[styles.instructionsText, { color: '#4FFFB0' }]}>
                ✅ Database is set up correctly!{'\n'}
                Circles should persist across app restarts.
              </Text>
            )}
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: { marginRight: 20 },
  backText: { color: '#4FFFB0', fontSize: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  buttonContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  runButton: {
    backgroundColor: '#4FFFB0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  runButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4FFFB0',
  },
  resultIcon: { fontSize: 20, marginRight: 12 },
  resultContent: { flex: 1 },
  resultTest: { color: '#fff', fontWeight: 'bold', marginBottom: 4 },
  resultMessage: { fontSize: 13, marginBottom: 2 },
  resultTime: { fontSize: 11, color: '#888' },
  instructions: {
    backgroundColor: 'rgba(79, 255, 176, 0.1)',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4FFFB0',
  },
  instructionsTitle: {
    color: '#4FFFB0',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionsText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
});



