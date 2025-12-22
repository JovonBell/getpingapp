import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { saveProfile } from '../../utils/storage/profileStorage';
import { saveProfileToSupabase, uploadAvatar, getCurrentUser } from '../../utils/storage/supabaseStorage';
import { normalizeEmail, normalizePhone, sha256 } from '../../utils/contactsImport';
import { upsertUserIdentities } from '../../utils/storage/identitiesStorage';

export default function ProfileEditScreen({ navigation, route }) {
  // Get current profile data from route params or use defaults
  const currentProfile = route?.params?.profile || {};
  const fromFirstCircle = route?.params?.fromFirstCircle || false;
  const contacts = route?.params?.contacts || [];
  const circleName = route?.params?.circleName || '';

  const [name, setName] = useState(currentProfile.name || '');
  const [jobTitle, setJobTitle] = useState(currentProfile.jobTitle || '');
  const [company, setCompany] = useState(currentProfile.company || '');
  const [location, setLocation] = useState(currentProfile.location || '');
  const [bio, setBio] = useState(currentProfile.bio || '');
  const [email, setEmail] = useState(currentProfile.email || '');
  const [phone, setPhone] = useState(currentProfile.phone || '');
  const [avatar, setAvatar] = useState(currentProfile.avatar || null);

  // Social links
  const [linkedin, setLinkedin] = useState(currentProfile.socialLinks?.linkedin || '');
  const [twitter, setTwitter] = useState(currentProfile.socialLinks?.twitter || '');
  const [instagram, setInstagram] = useState(currentProfile.socialLinks?.instagram || '');
  const [tiktok, setTiktok] = useState(currentProfile.socialLinks?.tiktok || '');
  const [website, setWebsite] = useState(currentProfile.socialLinks?.website || '');
  const [school, setSchool] = useState(currentProfile.school || '');

  const [nameFocused, setNameFocused] = useState(false);
  const [jobTitleFocused, setJobTitleFocused] = useState(false);
  const [companyFocused, setCompanyFocused] = useState(false);
  const [locationFocused, setLocationFocused] = useState(false);
  const [bioFocused, setBioFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [linkedinFocused, setLinkedinFocused] = useState(false);
  const [twitterFocused, setTwitterFocused] = useState(false);
  const [instagramFocused, setInstagramFocused] = useState(false);
  const [websiteFocused, setWebsiteFocused] = useState(false);

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to change your profile picture.');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    // Request permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera permissions to take a photo.');
      return;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Library',
          onPress: pickImage,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleSave = async () => {
    // Validate required fields
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter your name.');
      return;
    }

    try {
      // Get current user
      const { success: userSuccess, user } = await getCurrentUser();

      let avatarUrl = avatar;

      // Upload avatar if it's a local file (not a URL)
      if (avatar && !avatar.startsWith('http') && userSuccess && user) {
        const uploadResult = await uploadAvatar(avatar, user.id);
        if (uploadResult.success) {
          avatarUrl = uploadResult.url;
        }
      }

      // Prepare profile data
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

      // Save to local storage first (for offline support)
      await saveProfile(updatedProfile);

      // Save to Supabase if user is authenticated
      if (userSuccess && user) {
        const supabaseResult = await saveProfileToSupabase(updatedProfile, user.id);

        if (!supabaseResult.success) {
          console.warn('Failed to sync to Supabase:', supabaseResult.error);
          // Still show success since local save worked
        }

        // Keep identity hashes up to date for contact matching
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

      Alert.alert(
        'Success',
        'Your profile has been updated!',
        [
          {
            text: 'OK',
            onPress: () => {
              if (fromFirstCircle) {
                // Coming from first circle setup, go to Home with circle data
                navigation.navigate('Home', {
                  screen: 'HomeTab',
                  params: { contacts, circleName },
                });
              } else {
                // Regular profile edit, go back to Profile screen
                navigation.navigate('Profile', { updated: true });
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert(
        'Error',
        'Failed to save profile. Please try again.',
        [{ text: 'OK' }]
      );
    }
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
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Picture */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={showImageOptions} style={styles.avatarContainer}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={60} color="#ffffff" />
                </View>
              )}
              <View style={styles.editIconContainer}>
                <Ionicons name="camera" size={20} color="#ffffff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>Tap to change photo</Text>
          </View>

          {/* Basic Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={[styles.input, nameFocused && styles.inputFocused]}
                placeholder="Enter your name"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Job Title</Text>
              <TextInput
                style={[styles.input, jobTitleFocused && styles.inputFocused]}
                placeholder="e.g., Software Engineer"
                placeholderTextColor="#666"
                value={jobTitle}
                onChangeText={setJobTitle}
                onFocus={() => setJobTitleFocused(true)}
                onBlur={() => setJobTitleFocused(false)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Company</Text>
              <TextInput
                style={[styles.input, companyFocused && styles.inputFocused]}
                placeholder="Enter your company"
                placeholderTextColor="#666"
                value={company}
                onChangeText={setCompany}
                onFocus={() => setCompanyFocused(true)}
                onBlur={() => setCompanyFocused(false)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={[styles.input, locationFocused && styles.inputFocused]}
                placeholder="City, Country"
                placeholderTextColor="#666"
                value={location}
                onChangeText={setLocation}
                onFocus={() => setLocationFocused(true)}
                onBlur={() => setLocationFocused(false)}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.socialLabel}>
                <Ionicons name="school-outline" size={20} color="#00ff88" />
                <Text style={styles.label}>School or Program</Text>
              </View>
              <TextInput
                style={[styles.input]}
                placeholder="Add your school or program"
                placeholderTextColor="#666"
                value={school}
                onChangeText={setSchool}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea, bioFocused && styles.inputFocused]}
                placeholder="Tell us about yourself"
                placeholderTextColor="#666"
                value={bio}
                onChangeText={setBio}
                onFocus={() => setBioFocused(true)}
                onBlur={() => setBioFocused(false)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, emailFocused && styles.inputFocused]}
                placeholder="your.email@example.com"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={[styles.input, phoneFocused && styles.inputFocused]}
                placeholder="(555) 123-4567"
                placeholderTextColor="#666"
                value={phone}
                onChangeText={setPhone}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Social Links */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social Links</Text>

            <View style={styles.inputContainer}>
              <View style={styles.socialLabel}>
                <Ionicons name="logo-linkedin" size={20} color="#00ff88" />
                <Text style={styles.label}>LinkedIn</Text>
              </View>
              <TextInput
                style={[styles.input, linkedinFocused && styles.inputFocused]}
                placeholder="linkedin.com/in/yourprofile"
                placeholderTextColor="#666"
                value={linkedin}
                onChangeText={setLinkedin}
                onFocus={() => setLinkedinFocused(true)}
                onBlur={() => setLinkedinFocused(false)}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.socialLabel}>
                <Ionicons name="logo-twitter" size={20} color="#00ff88" />
                <Text style={styles.label}>Twitter</Text>
              </View>
              <TextInput
                style={[styles.input, twitterFocused && styles.inputFocused]}
                placeholder="twitter.com/yourhandle"
                placeholderTextColor="#666"
                value={twitter}
                onChangeText={setTwitter}
                onFocus={() => setTwitterFocused(true)}
                onBlur={() => setTwitterFocused(false)}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.socialLabel}>
                <Ionicons name="logo-instagram" size={20} color="#00ff88" />
                <Text style={styles.label}>Instagram</Text>
              </View>
              <TextInput
                style={[styles.input, instagramFocused && styles.inputFocused]}
                placeholder="instagram.com/yourhandle"
                placeholderTextColor="#666"
                value={instagram}
                onChangeText={setInstagram}
                onFocus={() => setInstagramFocused(true)}
                onBlur={() => setInstagramFocused(false)}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.socialLabel}>
                <Ionicons name="logo-tiktok" size={20} color="#00ff88" />
                <Text style={styles.label}>TikTok</Text>
              </View>
              <TextInput
                style={[styles.input]}
                placeholder="@yourtiktok"
                placeholderTextColor="#666"
                value={tiktok}
                onChangeText={setTiktok}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.socialLabel}>
                <Ionicons name="globe-outline" size={20} color="#00ff88" />
                <Text style={styles.label}>Website (optional)</Text>
              </View>
              <TextInput
                style={[styles.input, websiteFocused && styles.inputFocused]}
                placeholder="yourwebsite.com"
                placeholderTextColor="#666"
                value={website}
                onChangeText={setWebsite}
                onFocus={() => setWebsiteFocused(true)}
                onBlur={() => setWebsiteFocused(false)}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Save Button at bottom */}
          <TouchableOpacity style={styles.saveButtonBottom} onPress={handleSave}>
            <Text style={styles.saveButtonBottomText}>Save Changes</Text>
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
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00ff88',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
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
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00ff88',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#000000',
  },
  changePhotoText: {
    color: '#999',
    fontSize: 14,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#cccccc',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  socialLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a3a2a',
    borderWidth: 1,
    borderColor: '#2a3a2a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
  },
  inputFocused: {
    borderColor: '#00ff88',
    borderWidth: 2,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  saveButtonBottom: {
    backgroundColor: '#a8e6cf',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonBottomText: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: '600',
  },
});
