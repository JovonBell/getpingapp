import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getImportedContacts, saveImportedContacts } from '../utils/contactsStorage';

export default function AddContactScreen({ navigation, route }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [showTierPicker, setShowTierPicker] = useState(false);

  const handleAddToCircle = () => {
    if (!name.trim() || !phone.trim()) {
      alert('Please enter at least a name and phone number');
      return;
    }
    setShowTierPicker(true);
  };

  const handleTierSelect = (tier) => {
    // Create initials from name
    const nameParts = name.trim().split(' ');
    const initials = nameParts.length > 1
      ? nameParts[0][0] + nameParts[nameParts.length - 1][0]
      : nameParts[0][0] + (nameParts[0][1] || '');

    // Create new contact
    const newContact = {
      id: Date.now().toString(),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      initials: initials.toUpperCase(),
      tier: tier,
    };

    // Persist into imported contacts store (the app-wide universe)
    (async () => {
      const { contacts: existing } = await getImportedContacts();
      const updated = [...(existing || []), newContact];
      await saveImportedContacts(updated);
      setShowTierPicker(false);
      setName('');
      setPhone('');
      setEmail('');
      navigation.goBack();
    })();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a2e1a', '#05140a', '#000000']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add Contact</Text>
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => navigation.navigate('Messages')}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#ffffff" />
            <View style={styles.messageBadge}>
              <Text style={styles.messageBadgeText}>!</Text>
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person-add" size={40} color="#00ff88" />
            </View>
            <TouchableOpacity style={styles.addPhotoButton}>
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter name"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              placeholderTextColor="#666"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleAddToCircle}>
            <Text style={styles.saveButtonText}>Add to Circle</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Tier Selection Modal */}
        <Modal
          visible={showTierPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowTierPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.tierPickerBox}>
              <Text style={styles.tierPickerTitle}>Select Circle Tier</Text>
              <Text style={styles.tierPickerSubtitle}>Choose how close this contact is to you</Text>

              <View style={styles.tierOptions}>
                <TouchableOpacity
                  style={styles.tierOption}
                  onPress={() => handleTierSelect('close')}
                >
                  <View style={styles.tierCircleContainer}>
                    <View style={[styles.tierCircle, styles.tierCircleClose]} />
                  </View>
                  <Text style={styles.tierLabel}>Close Circle</Text>
                  <Text style={styles.tierDescription}>Inner ring</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.tierOption}
                  onPress={() => handleTierSelect('medium')}
                >
                  <View style={styles.tierCircleContainer}>
                    <View style={[styles.tierCircle, styles.tierCircleMedium]} />
                  </View>
                  <Text style={styles.tierLabel}>Medium</Text>
                  <Text style={styles.tierDescription}>Middle ring</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.tierOption}
                  onPress={() => handleTierSelect('distant')}
                >
                  <View style={styles.tierCircleContainer}>
                    <View style={[styles.tierCircle, styles.tierCircleDistant]} />
                  </View>
                  <Text style={styles.tierLabel}>Distant</Text>
                  <Text style={styles.tierDescription}>Outer ring</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowTierPicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  messageButton: {
    position: 'relative',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#2a4a3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2a4a3a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  addPhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  addPhotoText: {
    color: '#4FFFB0',
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#2a3a2a',
    borderWidth: 1,
    borderColor: '#4FFFB0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
  },
  saveButton: {
    backgroundColor: '#4FFFB0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  tierPickerBox: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#0a1a0a',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#4FFFB0',
    padding: 24,
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  tierPickerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  tierPickerSubtitle: {
    color: '#999',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  tierOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
    marginBottom: 24,
  },
  tierOption: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(79, 255, 176, 0.05)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(79, 255, 176, 0.2)',
  },
  tierCircleContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  tierCircle: {
    backgroundColor: '#4FFFB0',
    borderRadius: 30,
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  tierCircleClose: {
    width: 24,
    height: 24,
  },
  tierCircleMedium: {
    width: 38,
    height: 38,
  },
  tierCircleDistant: {
    width: 52,
    height: 52,
  },
  tierLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  tierDescription: {
    color: '#999',
    fontSize: 11,
    textAlign: 'center',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#999',
    fontSize: 16,
  },
});
