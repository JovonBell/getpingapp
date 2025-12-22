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
import { useTheme } from '../../contexts/ThemeContext';

const THEMES = [
  {
    id: 'default',
    name: 'Cosmic Green',
    description: 'Default neon green theme',
    color: '#4FFFB0',
  },
  {
    id: 'blue',
    name: 'Electric Blue',
    description: 'Cool blue theme',
    color: '#4F9FFF',
  },
  {
    id: 'purple',
    name: 'Nebula Purple',
    description: 'Mystical purple theme',
    color: '#B04FFF',
  },
  {
    id: 'pink',
    name: 'Rose Pink',
    description: 'Soft pink theme',
    color: '#FF4F9F',
  },
  {
    id: 'orange',
    name: 'Solar Orange',
    description: 'Warm orange theme',
    color: '#FF9F4F',
  },
];

export default function ThemeSettingsScreen({ navigation }) {
  const { currentTheme, changeTheme, theme } = useTheme();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a2e1a', '#05140a', '#000000']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Theme</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.description}>
            Choose your color theme for the app
          </Text>

          {THEMES.map((themeOption) => (
            <TouchableOpacity
              key={themeOption.id}
              style={[
                styles.themeItem,
                currentTheme === themeOption.id && styles.themeItemSelected,
              ]}
              onPress={() => changeTheme(themeOption.id)}
            >
              <View style={styles.themeLeft}>
                <View
                  style={[
                    styles.colorPreview,
                    { backgroundColor: themeOption.color },
                  ]}
                />
                <View style={styles.themeInfo}>
                  <Text style={styles.themeName}>{themeOption.name}</Text>
                  <Text style={styles.themeDescription}>{themeOption.description}</Text>
                </View>
              </View>
              {currentTheme === themeOption.id && (
                <Ionicons name="checkmark-circle" size={24} color={themeOption.color} />
              )}
            </TouchableOpacity>
          ))}
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
  description: {
    color: '#999',
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  themeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 12,
    backgroundColor: '#1a2a1a',
  },
  themeItemSelected: {
    borderColor: '#4FFFB0',
  },
  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  themeDescription: {
    color: '#999',
    fontSize: 13,
  },
});
