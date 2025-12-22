import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const FAQ_ITEMS = [
  {
    question: 'How do I add a new contact?',
    answer: 'Tap the Add tab at the bottom of the screen, then enter contact details or scan their NFC ring.',
  },
  {
    question: 'What are ring tiers?',
    answer: 'Ring tiers represent how close you are to a contact. Ring 1 is closest, Ring 5 is farthest.',
  },
  {
    question: 'How do I organize my network?',
    answer: 'Drag contacts between rings or use tags to categorize your connections.',
  },
  {
    question: 'Can I export my contacts?',
    answer: 'Yes! Go to Profile Settings > Download My Data to export all your information.',
  },
  {
    question: 'How does the NFC ring work?',
    answer: 'Tap your Ping ring to another user\'s phone or ring to instantly share contact information.',
  },
];

export default function HelpCenterScreen({ navigation }) {
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
          <Text style={styles.headerTitle}>Help Center</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

          {FAQ_ITEMS.map((item, index) => (
            <View key={index} style={styles.faqItem}>
              <View style={styles.questionRow}>
                <Ionicons name="help-circle-outline" size={20} color="#4FFFB0" />
                <Text style={styles.question}>{item.question}</Text>
              </View>
              <Text style={styles.answer}>{item.answer}</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.contactButton}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#1a1a1a" />
            <Text style={styles.contactButtonText}>Still need help?</Text>
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
  sectionTitle: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  faqItem: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#1a2a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a3a2a',
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  question: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  answer: {
    color: '#999',
    fontSize: 14,
    lineHeight: 20,
    paddingLeft: 32,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4FFFB0',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 40,
    gap: 8,
  },
  contactButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
});
