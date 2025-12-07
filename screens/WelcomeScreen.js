import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

export default function WelcomeScreen({ navigation }) {

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0a2e1a', '#05140a', '#000000']}
        style={styles.gradient}
      >
        {/* Ping graphic */}
        <View style={styles.pingContainer}>
          <View style={styles.pingRing}>
            <View style={styles.pingRingInner}>
              <View style={styles.pingCircle1} />
              <View style={styles.pingCircle2} />
              <View style={styles.pingCircle3} />
              <View style={styles.pingCenter} />
            </View>
          </View>
        </View>

        {/* App title */}
        <Text style={styles.title}>ping!</Text>
        <Text style={styles.tagline}>the future of connection is now.</Text>

        {/* Buttons */}
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={() => navigation.navigate('CreateAccount')}
        >
          <Text style={styles.getStartedText}>get started</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signInContainer}>
          <Text style={styles.signInText}>
            already have an account? <Text style={styles.signInLink}>sign in</Text>
          </Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  pingContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pingRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#000000',
    borderWidth: 8,
    borderColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  pingRingInner: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pingCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#00ff88',
    opacity: 0.6,
  },
  pingCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#00ff88',
    opacity: 0.8,
  },
  pingCircle3: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00ff88',
    opacity: 1,
  },
  pingCenter: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cccccc',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    fontFamily: 'System',
  },
  tagline: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 50,
    fontFamily: 'System',
  },
  getStartedButton: {
    backgroundColor: '#a8e6cf',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 30,
    marginBottom: 20,
    minWidth: 200,
    alignItems: 'center',
  },
  getStartedText: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
  },
  signInContainer: {
    marginTop: 10,
  },
  signInText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'System',
  },
  signInLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

