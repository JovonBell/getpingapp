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
  const TERMS_URL = 'https://getping.today/terms';
  const PRIVACY_URL = 'https://getping.today/privacy';

  const features = [
    { icon: 'person-circle-outline', title: 'Digital Business Card', desc: 'Share who you are instantly' },
    { icon: 'radio-outline', title: 'NFC Smart Ring', desc: 'Program and tap to connect' },
    { icon: 'share-outline', title: 'Instant Sharing', desc: 'One tap, one connection' },
  ];

  const legalItems = [
    { label: 'Terms of Service', url: TERMS_URL },
    { label: 'Privacy Policy', url: PRIVACY_URL },
    { label: 'Licenses', url: 'https://getping.today/licenses' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A1A12', '#060E09', '#020804', '#000000']}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <View style={styles.backButtonInner}>
              <Ionicons name="arrow-back" size={20} color="#ffffff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoGlow}>
              <Text style={styles.logo}>ping!</Text>
            </View>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>v1.0.0</Text>
            </View>
          </View>

          {/* Description Card */}
          <View style={styles.glassCard}>
            <Text style={styles.description}>
              Ping is your digital business card powered by NFC smart ring technology. Share your profile instantly with a tap and make every connection count.
            </Text>
          </View>

          {/* Mission Card */}
          <View style={styles.glassCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardAccent} />
              <Text style={styles.cardTitle}>Our Mission</Text>
            </View>
            <Text style={styles.cardText}>
              To make sharing who you are effortless {'\u2014'} one tap, one ring, one profile.
            </Text>
          </View>

          {/* Features */}
          <View style={styles.sectionSpacing}>
            <View style={styles.cardHeader}>
              <View style={styles.cardAccent} />
              <Text style={styles.cardTitle}>Features</Text>
            </View>
            {features.map((f, i) => (
              <View style={styles.featureCard} key={i}>
                <View style={styles.featureIconWrap}>
                  <Ionicons name={f.icon} size={22} color="#4FFFB0" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Legal */}
          <View style={styles.sectionSpacing}>
            <View style={styles.cardHeader}>
              <View style={styles.cardAccent} />
              <Text style={styles.cardTitle}>Legal</Text>
            </View>
            <View style={styles.legalCard}>
              {legalItems.map((item, i) => (
                <TouchableOpacity
                  style={[styles.legalItem, i < legalItems.length - 1 && styles.legalItemBorder]}
                  key={i}
                  onPress={() => openUrl(item.url)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.legalText}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.copyright}>
            {'\u00A9'} 2025 Ping App. All rights reserved.
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
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoGlow: {
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    marginBottom: 10,
  },
  logo: {
    fontSize: 52,
    fontWeight: '700',
    color: '#4FFFB0',
    letterSpacing: -1,
  },
  versionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(79, 255, 176, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.12)',
  },
  versionText: {
    color: 'rgba(79, 255, 176, 0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  cardAccent: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#4FFFB0',
  },
  cardTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  cardText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    lineHeight: 22,
  },
  description: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
  sectionSpacing: {
    marginBottom: 24,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
  },
  featureIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(79, 255, 176, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDesc: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
  },
  legalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  legalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  legalItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  legalText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: '500',
  },
  copyright: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
});
