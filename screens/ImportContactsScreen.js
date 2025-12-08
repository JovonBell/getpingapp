import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Ellipse } from 'react-native-svg';

export default function ImportContactsScreen({ navigation }) {
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
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.pagination}>
            <View style={styles.dotInactive} />
            <View style={styles.dotActive} />
            <View style={styles.dotInactive} />
          </View>

          <TouchableOpacity style={styles.skipButton}>
            <Text style={styles.skipText}>skip</Text>
          </TouchableOpacity>
        </View>

        {/* Network Visualization */}
        <View style={styles.visualContainer}>
          <Svg height="400" width="100%" viewBox="0 0 400 400">
            {/* Outer ring */}
            <Ellipse
              cx="200"
              cy="200"
              rx="180"
              ry="140"
              stroke="#ffffff"
              strokeWidth="2"
              fill="none"
              opacity="0.8"
            />

            {/* Inner circles and connections */}
            {/* Center glow */}
            <Circle cx="200" cy="200" r="30" fill="#00ff88" opacity="0.3" />
            <Circle cx="200" cy="200" r="20" fill="#00ff88" opacity="0.5" />
            <Circle cx="200" cy="200" r="10" fill="#00ff88" />

            {/* Network nodes - Ring 1 */}
            {[0, 60, 120, 180, 240, 300].map((angle, i) => {
              const x = 200 + 80 * Math.cos((angle * Math.PI) / 180);
              const y = 200 + 60 * Math.sin((angle * Math.PI) / 180);
              return (
                <React.Fragment key={`ring1-${i}`}>
                  <Line x1="200" y1="200" x2={x} y2={y} stroke="#00ff88" strokeWidth="1" opacity="0.3" />
                  <Circle cx={x} cy={y} r="8" fill="#00ff88" opacity="0.8" />
                </React.Fragment>
              );
            })}

            {/* Network nodes - Ring 2 */}
            {[30, 90, 150, 210, 270, 330].map((angle, i) => {
              const x = 200 + 130 * Math.cos((angle * Math.PI) / 180);
              const y = 200 + 100 * Math.sin((angle * Math.PI) / 180);
              return (
                <React.Fragment key={`ring2-${i}`}>
                  <Line x1="200" y1="200" x2={x} y2={y} stroke="#00ff88" strokeWidth="1" opacity="0.2" />
                  <Circle cx={x} cy={y} r="8" fill="#00ff88" opacity="0.6" />
                </React.Fragment>
              );
            })}

            {/* Network nodes - Ring 3 */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
              const x = 200 + 170 * Math.cos((angle * Math.PI) / 180);
              const y = 200 + 130 * Math.sin((angle * Math.PI) / 180);
              return (
                <React.Fragment key={`ring3-${i}`}>
                  <Line x1="200" y1="200" x2={x} y2={y} stroke="#00ff88" strokeWidth="1" opacity="0.15" />
                  <Circle cx={x} cy={y} r="8" fill="#00ff88" opacity="0.5" />
                </React.Fragment>
              );
            })}
          </Svg>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>import your contacts</Text>
          <Text style={styles.subtitle}>see how your network connects.</Text>

          <TouchableOpacity
            style={styles.importButton}
            onPress={() => navigation.navigate('SelectContacts', { selectAll: true })}
          >
            <Text style={styles.importButtonText}>import all contacts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => navigation.navigate('SelectContacts', { selectAll: false })}
          >
            <Text style={styles.manualButtonText}>or select manually</Text>
          </TouchableOpacity>

          <Text style={styles.privacy}>your contacts stay private.</Text>
        </View>
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#ffffff',
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
  },
  dotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  dotInactive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
    opacity: 0.3,
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#4a6b5a',
    borderRadius: 20,
  },
  skipText: {
    color: '#ffffff',
    fontSize: 14,
  },
  visualContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 40,
    textAlign: 'center',
  },
  importButton: {
    backgroundColor: '#a8e6cf',
    paddingVertical: 18,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  importButtonText: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: '600',
  },
  manualButton: {
    paddingVertical: 12,
    marginBottom: 30,
  },
  manualButtonText: {
    color: '#ffffff',
    fontSize: 16,
    opacity: 0.8,
  },
  privacy: {
    color: '#ffffff',
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
});
