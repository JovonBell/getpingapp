import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getProfile } from '../utils/profileStorage';
import { getProfileFromSupabase, getCurrentUser } from '../utils/supabaseStorage';

// Default profile data
const DEFAULT_PROFILE = {
  name: 'John Doe',
  jobTitle: 'Software Engineer',
  company: 'Tech Corp',
  location: 'San Francisco, CA',
  bio: 'Passionate about building great products and connecting with people.',
  email: 'john.doe@example.com',
  phone: '(555) 123-4567',
  avatar: null,
  socialLinks: {
    linkedin: 'https://linkedin.com/in/johndoe',
    twitter: 'https://twitter.com/johndoe',
    instagram: 'https://instagram.com/johndoe',
  },
};

export default function ProfileScreen({ navigation, route }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load profile data
  const loadProfile = async () => {
    setLoading(true);

    try {
      // Try to get user and load from Supabase first
      const { success: userSuccess, user } = await getCurrentUser();

      if (userSuccess && user) {
        const { success: profileSuccess, profile: supabaseProfile } = await getProfileFromSupabase(user.id);

        if (profileSuccess && supabaseProfile) {
          setProfile(supabaseProfile);
          // Also save to local storage for offline access
          await getProfile(); // This will cache it locally
          setLoading(false);
          return;
        }
      }

      // Fallback to local storage if Supabase fails or user not authenticated
      const savedProfile = await getProfile();
      setProfile(savedProfile || DEFAULT_PROFILE);
    } catch (error) {
      console.error('Error loading profile:', error);
      // Fallback to local storage
      const savedProfile = await getProfile();
      setProfile(savedProfile || DEFAULT_PROFILE);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Reload profile when navigating back from edit
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (route.params?.updated) {
        loadProfile();
      }
    });

    return unsubscribe;
  }, [navigation, route.params?.updated]);

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0a2e1a', '#05140a', '#000000']}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00ff88" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const openLink = (url) => {
    if (url) {
      Linking.openURL(url).catch(err => console.error('Error opening link:', err));
    }
  };

  const openEmail = () => {
    Linking.openURL(`mailto:${profile.email}`);
  };

  const openPhone = () => {
    Linking.openURL(`tel:${profile.phone}`);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a2e1a', '#05140a', '#000000']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('ProfileEdit', { profile })}
          >
            <Ionicons name="create-outline" size={24} color="#00ff88" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {profile.avatar ? (
                <Image source={{ uri: profile.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={60} color="#ffffff" />
                </View>
              )}
            </View>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.jobTitle}>{profile.jobTitle}</Text>

            <View style={styles.metaInfo}>
              {profile.company && (
                <View style={styles.metaItem}>
                  <Ionicons name="briefcase-outline" size={16} color="#00ff88" />
                  <Text style={styles.metaText}>{profile.company}</Text>
                </View>
              )}
              {profile.location && (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={16} color="#00ff88" />
                  <Text style={styles.metaText}>{profile.location}</Text>
                </View>
              )}
            </View>

            {profile.bio && (
              <Text style={styles.bio}>{profile.bio}</Text>
            )}
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>

            {profile.email && (
              <TouchableOpacity style={styles.contactItem} onPress={openEmail}>
                <View style={styles.contactLeft}>
                  <View style={styles.contactIcon}>
                    <Ionicons name="mail-outline" size={20} color="#00ff88" />
                  </View>
                  <View>
                    <Text style={styles.contactLabel}>Email</Text>
                    <Text style={styles.contactValue}>{profile.email}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            )}

            {profile.phone && (
              <TouchableOpacity style={styles.contactItem} onPress={openPhone}>
                <View style={styles.contactLeft}>
                  <View style={styles.contactIcon}>
                    <Ionicons name="call-outline" size={20} color="#00ff88" />
                  </View>
                  <View>
                    <Text style={styles.contactLabel}>Phone</Text>
                    <Text style={styles.contactValue}>{profile.phone}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          {/* Social Links */}
          {profile.socialLinks && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Social</Text>

              {profile.socialLinks.linkedin && (
                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={() => openLink(profile.socialLinks.linkedin)}
                >
                  <View style={styles.contactLeft}>
                    <View style={styles.contactIcon}>
                      <Ionicons name="logo-linkedin" size={20} color="#00ff88" />
                    </View>
                    <Text style={styles.contactLabel}>LinkedIn</Text>
                  </View>
                  <Ionicons name="open-outline" size={20} color="#666" />
                </TouchableOpacity>
              )}

              {profile.socialLinks.twitter && (
                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={() => openLink(profile.socialLinks.twitter)}
                >
                  <View style={styles.contactLeft}>
                    <View style={styles.contactIcon}>
                      <Ionicons name="logo-twitter" size={20} color="#00ff88" />
                    </View>
                    <Text style={styles.contactLabel}>Twitter</Text>
                  </View>
                  <Ionicons name="open-outline" size={20} color="#666" />
                </TouchableOpacity>
              )}

              {profile.socialLinks.instagram && (
                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={() => openLink(profile.socialLinks.instagram)}
                >
                  <View style={styles.contactLeft}>
                    <View style={styles.contactIcon}>
                      <Ionicons name="logo-instagram" size={20} color="#00ff88" />
                    </View>
                    <Text style={styles.contactLabel}>Instagram</Text>
                  </View>
                  <Ionicons name="open-outline" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Actions */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="share-outline" size={20} color="#1a1a1a" />
              <Text style={styles.actionButtonText}>Share Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButtonSecondary}>
              <Ionicons name="person-add-outline" size={20} color="#00ff88" />
              <Text style={styles.actionButtonTextSecondary}>Invite Friend</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#00ff88',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2a4a3a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#00ff88',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 18,
    color: '#999',
    marginBottom: 12,
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#999',
    fontSize: 14,
  },
  bio: {
    color: '#cccccc',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3a2a',
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a4a3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  contactValue: {
    color: '#999',
    fontSize: 14,
    marginTop: 2,
  },
  actionButton: {
    backgroundColor: '#a8e6cf',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#00ff88',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonTextSecondary: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 16,
    fontSize: 16,
  },
});
