import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen({ navigation }) {
  const openUrl = (url) => Linking.openURL(url).catch(() => {});
  const TERMS_URL = 'https://getping.app/terms';
  const PRIVACY_URL = 'https://getping.app/privacy';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a2e1a', '#05140a', '#000000']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>ping!</Text>
            <Text style={styles.version}>Version 1.0.0</Text>
          </View>

          <Text style={styles.description}>
            Ping is a revolutionary networking platform that combines NFC smart ring technology with intuitive relationship management. Visualize your network as a cosmic universe and keep track of your most important connections.
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Our Mission</Text>
            <Text style={styles.sectionText}>
              To transform how people build and maintain professional relationships by making networking effortless, intuitive, and meaningful.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            <View style={styles.feature}>
              <Ionicons name="radio-outline" size={20} color="#4FFFB0" />
              <Text style={styles.featureText}>NFC Smart Ring Integration</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="planet-outline" size={20} color="#4FFFB0" />
              <Text style={styles.featureText}>Network Visualization</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="layers-outline" size={20} color="#4FFFB0" />
              <Text style={styles.featureText}>Relationship Ring Tiers</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="chatbubbles-outline" size={20} color="#4FFFB0" />
              <Text style={styles.featureText}>Integrated Messaging</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Legal</Text>
            <TouchableOpacity style={styles.legalItem} onPress={() => openUrl(TERMS_URL)}>
              <Text style={styles.legalText}>Terms of Service</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.legalItem} onPress={() => openUrl(PRIVACY_URL)}>
              <Text style={styles.legalText}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.legalItem} onPress={() => openUrl('https://getping.app/licenses')}>
              <Text style={styles.legalText}>Licenses</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.copyright}>
            © 2025 Ping App. All rights reserved.
          </Text>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4FFFB0',
    marginBottom: 8,
  },
  version: {
    color: '#999',
    fontSize: 14,
  },
  description: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#4FFFB0',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionText: {
    color: '#999',
    fontSize: 15,
    lineHeight: 22,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  featureText: {
    color: '#ffffff',
    fontSize: 15,
  },
  legalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3a2a',
  },
  legalText: {
    color: '#ffffff',
    fontSize: 16,
  },
  copyright: {
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
});
