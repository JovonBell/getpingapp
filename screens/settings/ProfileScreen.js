import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Share,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getProfile } from '../../utils/storage/profileStorage';
import { getProfileFromSupabase, getCurrentUser } from '../../utils/storage/supabaseStorage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DEFAULT_PROFILE = {
  name: '',
  jobTitle: '',
  company: '',
  location: '',
  bio: '',
  email: '',
  phone: '',
  avatar: null,
  socialLinks: {},
};

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { success: userSuccess, user } = await getCurrentUser();
      if (userSuccess && user) {
        setUserId(user.id);
        const { success: profileSuccess, profile: supabaseProfile } = await getProfileFromSupabase(user.id);
        if (profileSuccess && supabaseProfile) {
          setProfile(supabaseProfile);
          setLoading(false);
          return;
        }
      }
      const localResult = await getProfile();
      setProfile(localResult.profile || DEFAULT_PROFILE);
    } catch (error) {
      console.error('Error loading profile:', error);
      const localResult = await getProfile();
      setProfile(localResult.profile || DEFAULT_PROFILE);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my ping! profile: https://getping.today/${userId}`,
        url: `https://getping.today/${userId}`,
      });
    } catch (e) {
      console.warn('[ProfileScreen] Share failed:', e?.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0A0A0F', '#080D0A', '#050805', '#000000']} locations={[0, 0.3, 0.6, 1]} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4FFFB0" />
          </View>
        </LinearGradient>
      </View>
    );
  }

  const openLink = (url) => {
    const str = typeof url === 'string' ? url : typeof url === 'object' && url?.url ? url.url : '';
    if (!str) return;
    const full = str.startsWith('http') ? str : `https://${str}`;
    Linking.openURL(full).catch(err => console.error('Error opening link:', err));
  };
  const openEmail = () => { if (profile.email) Linking.openURL(`mailto:${profile.email}`); };
  const openPhone = () => { if (profile.phone) Linking.openURL(`tel:${profile.phone}`); };

  const hasSocials = profile.socialLinks && (
    profile.socialLinks.linkedin || profile.socialLinks.twitter ||
    profile.socialLinks.instagram || profile.socialLinks.tiktok ||
    profile.socialLinks.website
  );

  const hasContact = profile.email || profile.phone;

  // Empty state
  if (!profile?.name) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0A0A0F', '#080D0A', '#050805', '#000000']} locations={[0, 0.3, 0.6, 1]} style={styles.gradient}>
          <View style={styles.emptyState}>
            <View style={styles.emptyAvatarRing}>
              <View style={styles.emptyAvatarInner}>
                <Ionicons name="person-outline" size={48} color="#4FFFB0" />
              </View>
            </View>
            <Text style={styles.emptyTitle}>Create your card</Text>
            <Text style={styles.emptySubtitle}>
              Set up your digital business card so{'\n'}people can find and connect with you.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('ProfileEdit', { profile })}
            >
              <LinearGradient
                colors={['#4FFFB0', '#00D68F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.emptyButtonGradient}
              >
                <Ionicons name="add" size={20} color="#0A0A0F" />
                <Text style={styles.emptyButtonText}>Set up profile</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#080D0A', '#050805', '#000000']} locations={[0, 0.3, 0.6, 1]} style={styles.gradient}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Card */}
          <View style={styles.card}>
            <LinearGradient
              colors={['#141E1A', '#0F1A15', '#0A1210']}
              style={styles.cardGradient}
            >
              {/* Card top accent line */}
              <LinearGradient
                colors={['#4FFFB0', '#00D68F', '#4FFFB0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cardAccent}
              />

              {/* Edit button */}
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('ProfileEdit', { profile })}
              >
                <Ionicons name="create-outline" size={18} color="#4FFFB0" />
              </TouchableOpacity>

              {/* Avatar + Identity */}
              <View style={styles.identitySection}>
                <View style={styles.avatarOuter}>
                  {profile.avatar ? (
                    <Image source={{ uri: profile.avatar }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={44} color="#4FFFB0" />
                    </View>
                  )}
                </View>

                <Text style={styles.name}>{profile.name}</Text>
                {profile.jobTitle ? (
                  <Text style={styles.jobTitle}>{profile.jobTitle}</Text>
                ) : null}

                <View style={styles.metaRow}>
                  {profile.company ? (
                    <View style={styles.metaChip}>
                      <Ionicons name="briefcase-outline" size={13} color="#4FFFB0" />
                      <Text style={styles.metaChipText}>{profile.company}</Text>
                    </View>
                  ) : null}
                  {profile.location ? (
                    <View style={styles.metaChip}>
                      <Ionicons name="location-outline" size={13} color="#4FFFB0" />
                      <Text style={styles.metaChipText}>{profile.location}</Text>
                    </View>
                  ) : null}
                </View>

                {profile.bio ? (
                  <Text style={styles.bio}>{profile.bio}</Text>
                ) : null}
              </View>

              {/* Divider */}
              {(hasContact || hasSocials) ? (
                <View style={styles.divider} />
              ) : null}

              {/* Contact row */}
              {hasContact ? (
                <View style={styles.contactRow}>
                  {profile.email ? (
                    <TouchableOpacity style={styles.contactPill} onPress={openEmail}>
                      <Ionicons name="mail-outline" size={16} color="#4FFFB0" />
                      <Text style={styles.contactPillText} numberOfLines={1}>{profile.email}</Text>
                    </TouchableOpacity>
                  ) : null}
                  {profile.phone ? (
                    <TouchableOpacity style={styles.contactPill} onPress={openPhone}>
                      <Ionicons name="call-outline" size={16} color="#4FFFB0" />
                      <Text style={styles.contactPillText}>{profile.phone}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}

              {/* Social icons row */}
              {hasSocials ? (
                <View style={styles.socialRow}>
                  {profile.socialLinks.linkedin ? (
                    <TouchableOpacity style={styles.socialIcon} onPress={() => openLink(profile.socialLinks.linkedin)}>
                      <Ionicons name="logo-linkedin" size={22} color="#fff" />
                    </TouchableOpacity>
                  ) : null}
                  {profile.socialLinks.twitter ? (
                    <TouchableOpacity style={styles.socialIcon} onPress={() => openLink(profile.socialLinks.twitter)}>
                      <Ionicons name="logo-twitter" size={22} color="#fff" />
                    </TouchableOpacity>
                  ) : null}
                  {profile.socialLinks.instagram ? (
                    <TouchableOpacity style={styles.socialIcon} onPress={() => openLink(profile.socialLinks.instagram)}>
                      <Ionicons name="logo-instagram" size={22} color="#fff" />
                    </TouchableOpacity>
                  ) : null}
                  {profile.socialLinks.tiktok ? (
                    <TouchableOpacity style={styles.socialIcon} onPress={() => openLink(profile.socialLinks.tiktok)}>
                      <Ionicons name="logo-tiktok" size={22} color="#fff" />
                    </TouchableOpacity>
                  ) : null}
                  {profile.socialLinks.website ? (
                    <TouchableOpacity style={styles.socialIcon} onPress={() => openLink(profile.socialLinks.website)}>
                      <Ionicons name="globe-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}

              {/* ping! watermark */}
              <Text style={styles.watermark}>ping!</Text>
            </LinearGradient>
          </View>

          {/* Share button */}
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <LinearGradient
              colors={['#4FFFB0', '#00D68F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shareGradient}
            >
              <Ionicons name="share-outline" size={20} color="#0A0A0F" />
              <Text style={styles.shareText}>Share your card</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Edit link */}
          <TouchableOpacity
            style={styles.editLink}
            onPress={() => navigation.navigate('ProfileEdit', { profile })}
          >
            <Ionicons name="create-outline" size={18} color="#4FFFB0" />
            <Text style={styles.editLinkText}>Edit profile</Text>
          </TouchableOpacity>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyAvatarRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(79, 255, 176, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  emptyAvatarInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(79, 255, 176, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyButtonText: {
    color: '#0A0A0F',
    fontSize: 17,
    fontWeight: '700',
  },

  // Card
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 10,
    // Shadow
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  cardGradient: {
    paddingTop: 0,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.1)',
  },
  cardAccent: {
    height: 3,
    marginHorizontal: -24,
    marginBottom: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  editButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(79, 255, 176, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  // Identity
  identitySection: {
    alignItems: 'center',
    paddingTop: 8,
  },
  avatarOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 3,
    backgroundColor: 'rgba(79, 255, 176, 0.15)',
    marginBottom: 16,
  },
  avatar: {
    width: 94,
    height: 94,
    borderRadius: 47,
  },
  avatarPlaceholder: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: 'rgba(79, 255, 176, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 16,
    color: '#8B9DA0',
    fontWeight: '500',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(79, 255, 176, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.08)',
  },
  metaChipText: {
    color: '#8B9DA0',
    fontSize: 13,
    fontWeight: '500',
  },
  bio: {
    color: '#A0A8B0',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 4,
    paddingHorizontal: 8,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: 'rgba(79, 255, 176, 0.08)',
    marginVertical: 18,
    marginHorizontal: -4,
  },

  // Contact pills
  contactRow: {
    gap: 8,
    marginBottom: 14,
  },
  contactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(79, 255, 176, 0.04)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.06)',
  },
  contactPillText: {
    color: '#C0C8D0',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  // Social icons
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 6,
    marginBottom: 8,
  },
  socialIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },

  // Watermark
  watermark: {
    textAlign: 'center',
    color: 'rgba(79, 255, 176, 0.15)',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 16,
  },

  // Share button
  shareButton: {
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  shareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  shareText: {
    color: '#0A0A0F',
    fontSize: 17,
    fontWeight: '700',
  },

  // Edit link
  editLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    marginBottom: 40,
    paddingVertical: 12,
  },
  editLinkText: {
    color: '#4FFFB0',
    fontSize: 15,
    fontWeight: '600',
  },
});
