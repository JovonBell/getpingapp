import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { saveProfile } from '../../utils/storage/profileStorage';
import { saveProfileToSupabase, uploadAvatar, getCurrentUser, normalizeEmail, normalizePhone, sha256 } from '../../utils/storage/supabaseStorage';
import { upsertUserIdentities } from '../../utils/storage/identitiesStorage';

export default function ProfileEditScreen({ navigation, route }) {
  const currentProfile = route?.params?.profile || {};

  const [name, setName] = useState(currentProfile.name || '');
  const [jobTitle, setJobTitle] = useState(currentProfile.jobTitle || '');
  const [company, setCompany] = useState(currentProfile.company || '');
  const [location, setLocation] = useState(currentProfile.location || '');
  const [bio, setBio] = useState(currentProfile.bio || '');
  const [email, setEmail] = useState(currentProfile.email || '');
  const [phone, setPhone] = useState(currentProfile.phone || '');
  const [avatar, setAvatar] = useState(currentProfile.avatar || null);

  const toStr = (v) => (typeof v === 'string' ? v : typeof v === 'object' && v?.url ? v.url : '');
  const [linkedin, setLinkedin] = useState(toStr(currentProfile.socialLinks?.linkedin));
  const [twitter, setTwitter] = useState(toStr(currentProfile.socialLinks?.twitter));
  const [instagram, setInstagram] = useState(toStr(currentProfile.socialLinks?.instagram));
  const [tiktok, setTiktok] = useState(toStr(currentProfile.socialLinks?.tiktok));
  const [website, setWebsite] = useState(toStr(currentProfile.socialLinks?.website));
  const [school, setSchool] = useState(currentProfile.school || '');

  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    // Always try to auto-populate from auth data (Google/Apple)
    getCurrentUser().then(({ success, user }) => {
      if (success && user) {
        const meta = user.user_metadata || {};
        const authName = meta.full_name || meta.name || '';
        if (authName && !name) setName(authName);
        // Always fill email from auth if empty — Google sign-in provides this
        if (user.email && !email) setEmail(user.email);
        if (meta.avatar_url && !avatar) setAvatar(meta.avatar_url);
        console.log('[ProfileEdit] Pre-filled from auth:', { name: authName, email: user.email, hasAvatar: !!meta.avatar_url });
      }
    }).catch((e) => {
      console.warn('[ProfileEdit] Could not pre-fill from auth:', e?.message);
    });
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to change your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setAvatar(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera permissions to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setAvatar(result.assets[0].uri);
  };

  const showImageOptions = () => {
    Alert.alert('Profile Picture', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Library', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ], { cancelable: true });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter your name.');
      return;
    }

    try {
      const { success: userSuccess, user } = await getCurrentUser();
      let avatarUrl = avatar;

      if (avatar && !avatar.startsWith('http') && userSuccess && user) {
        const uploadResult = await uploadAvatar(avatar, user.id);
        if (uploadResult.success) avatarUrl = uploadResult.url;
      }

      const updatedProfile = {
        name: name.trim(),
        jobTitle: jobTitle.trim(),
        company: company.trim(),
        location: location.trim(),
        bio: bio.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatar: avatarUrl,
        school: school.trim(),
        socialLinks: {
          linkedin: linkedin.trim(),
          twitter: twitter.trim(),
          instagram: instagram.trim(),
          tiktok: tiktok.trim(),
          website: website.trim(),
        },
        updatedAt: new Date().toISOString(),
      };

      await saveProfile(updatedProfile);

      if (userSuccess && user) {
        const supabaseResult = await saveProfileToSupabase(updatedProfile, user.id);
        if (!supabaseResult.success) console.warn('Failed to sync to Supabase:', supabaseResult.error);

        try {
          const email = normalizeEmail(updatedProfile.email);
          const phone = normalizePhone(updatedProfile.phone);
          const emailHashes = email ? [await sha256(email)] : [];
          const phoneHashes = phone ? [await sha256(phone)] : [];
          await upsertUserIdentities(user.id, { emailHashes, phoneHashes });
        } catch (e) {
          console.warn('Failed to upsert identity hashes (continuing):', e?.message || e);
        }
      }

      Alert.alert('Success', 'Your profile has been updated!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.', [{ text: 'OK' }]);
    }
  };

  const renderInput = (label, value, onChangeText, options = {}) => {
    const { placeholder, icon, iconColor, keyboardType, autoCapitalize, multiline, numberOfLines } = options;
    const isFocused = focusedField === label;

    return (
      <View style={styles.inputContainer}>
        {icon ? (
          <View style={styles.socialLabel}>
            <View style={styles.socialIconWrap}>
              <Ionicons name={icon} size={16} color={iconColor || '#4FFFB0'} />
            </View>
            <Text style={styles.label}>{label}</Text>
          </View>
        ) : (
          <Text style={styles.label}>{label}</Text>
        )}
        <TextInput
          style={[
            styles.input,
            multiline && styles.textArea,
            isFocused && styles.inputFocused,
          ]}
          placeholder={placeholder || ''}
          placeholderTextColor="rgba(255,255,255,0.2)"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocusedField(label)}
          onBlur={() => setFocusedField(null)}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A1A12', '#060E09', '#020804', '#000000']}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <View style={styles.headerButtonInner}>
              <Ionicons name="close" size={20} color="#ffffff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={showImageOptions} style={styles.avatarContainer} activeOpacity={0.8}>
              <View style={styles.avatarRing}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={48} color="rgba(255,255,255,0.3)" />
                  </View>
                )}
              </View>
              <View style={styles.editIconContainer}>
                <Ionicons name="camera" size={16} color="#0A0A0F" />
              </View>
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>Tap to change photo</Text>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Basic Information</Text>
            </View>
            {renderInput('Full Name *', name, setName, { placeholder: 'Enter your name' })}
            {renderInput('Job Title', jobTitle, setJobTitle, { placeholder: 'e.g., Software Engineer' })}
            {renderInput('Company', company, setCompany, { placeholder: 'Enter your company' })}
            {renderInput('Location', location, setLocation, { placeholder: 'City, Country' })}
            {renderInput('School or Program', school, setSchool, {
              placeholder: 'Add your school or program',
              icon: 'school-outline',
              autoCapitalize: 'words',
            })}
            {renderInput('Bio', bio, setBio, {
              placeholder: 'Tell us about yourself',
              multiline: true,
              numberOfLines: 4,
            })}
          </View>

          {/* Contact Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Contact Information</Text>
            </View>
            {renderInput('Email (optional)', email, setEmail, {
              placeholder: 'your.email@example.com',
              keyboardType: 'email-address',
              autoCapitalize: 'none',
            })}
            {renderInput('Phone (optional)', phone, setPhone, {
              placeholder: '(555) 123-4567',
              keyboardType: 'phone-pad',
            })}
          </View>

          {/* Social Links */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Social Links</Text>
            </View>
            {renderInput('LinkedIn', linkedin, setLinkedin, { placeholder: 'linkedin.com/in/yourprofile', icon: 'logo-linkedin', autoCapitalize: 'none' })}
            {renderInput('Twitter', twitter, setTwitter, { placeholder: 'twitter.com/yourhandle', icon: 'logo-twitter', autoCapitalize: 'none' })}
            {renderInput('Instagram', instagram, setInstagram, { placeholder: 'instagram.com/yourhandle', icon: 'logo-instagram', autoCapitalize: 'none' })}
            {renderInput('TikTok', tiktok, setTiktok, { placeholder: '@yourtiktok', icon: 'logo-tiktok', autoCapitalize: 'none' })}
            {renderInput('Website', website, setWebsite, { placeholder: 'yourwebsite.com', icon: 'globe-outline', autoCapitalize: 'none' })}
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButtonBottom} onPress={handleSave} activeOpacity={0.85}>
            <LinearGradient
              colors={['#4FFFB0', '#00D68F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}
            >
              <Text style={styles.saveButtonBottomText}>Save Changes</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
        </KeyboardAvoidingView>
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
  headerButton: {
    width: 50,
  },
  headerButtonInner: {
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
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4FFFB0',
    textAlign: 'right',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 64,
    borderWidth: 2,
    borderColor: 'rgba(79, 255, 176, 0.3)',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(79, 255, 176, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#4FFFB0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#060E09',
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  changePhotoText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  sectionAccent: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#4FFFB0',
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '500',
  },
  socialLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  socialIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(79, 255, 176, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
  },
  inputFocused: {
    borderColor: 'rgba(79, 255, 176, 0.3)',
    backgroundColor: 'rgba(79, 255, 176, 0.04)',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  saveButtonBottom: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 50,
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
  },
  saveButtonBottomText: {
    color: '#0A0A0F',
    fontSize: 17,
    fontWeight: '700',
  },
});
