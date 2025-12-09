import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FirstCircleCelebrationScreen({ navigation, route }) {
  const contacts = route?.params?.contacts || [];
  const circleName = route?.params?.circleName || 'My First Circle';

  const [showCongrats, setShowCongrats] = React.useState(true);
  const [showProfilePrompt, setShowProfilePrompt] = React.useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const starAnimations = useRef([...Array(30)].map(() => new Animated.Value(0))).current;

  // Fixed star positions
  const starPositions = useRef(
    [...Array(30)].map(() => ({
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT,
    }))
  ).current;

  // Colors for contacts
  const colors = ['#4FFFB0', '#ffaa00', '#ff6b6b', '#4ecdc4'];

  // Single-ring radius
  const RING_RADIUS = 105;

  // Calculate positions for contacts on the ring
  const getContactPosition = (index, total) => {
    const angleOffset = (index * (360 / total)) * (Math.PI / 180);
    const radius = RING_RADIUS;

    return {
      x: 200 + radius * Math.cos(angleOffset),
      y: 200 + radius * Math.sin(angleOffset),
      radius: 8,
      color: colors[index % colors.length],
    };
  };

  useEffect(() => {
    // Animate stars twinkling
    const animations = starAnimations.map((anim, i) => {
      return Animated.loop(
        Animated.timing(anim, {
          toValue: 1,
          duration: 3000 + (i * 100),
          useNativeDriver: true,
        })
      );
    });

    animations.forEach(anim => anim.start());

    // Fade in and scale up the popup
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: 400,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse for the center glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Auto-dismiss congratulations popup after 5 seconds
    const timer = setTimeout(() => {
      handleNextStep();
    }, 5000);

    return () => {
      animations.forEach(anim => anim.stop());
      clearTimeout(timer);
    };
  }, []);

  const handleNextStep = () => {
    // Fade out congrats, show profile setup prompt
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowCongrats(false);
      setShowProfilePrompt(true);
      // Fade back in with profile prompt
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleSetupProfile = () => {
    navigation.navigate('ProfileEdit', { 
      fromFirstCircle: true,
      contacts,
      circleName,
    });
  };

  const handleViewCircle = () => {
    navigation.navigate('Home', {
      screen: 'HomeTab',
      params: { contacts, circleName },
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a2e1a', '#05140a', '#000000']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>ping!</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="person" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Fixed star background */}
        <View style={styles.starsFixed}>
          {starAnimations.map((anim, i) => (
            <Animated.View
              key={i}
              style={[
                styles.star,
                {
                  left: starPositions[i].x,
                  top: starPositions[i].y,
                  opacity: anim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.2, 0.8, 0.2],
                  }),
                },
              ]}
            />
          ))}
        </View>

        {/* Orbit visualization in background */}
        <View style={styles.orbitContainer}>
          <Svg height="500" width={SCREEN_WIDTH} viewBox="0 0 400 400">
            {/* Center glow with pulse */}
            <Animated.G style={{ transform: [{ scale: pulseAnim }] }}>
              <Circle cx="200" cy="200" r="40" fill="#4FFFB0" opacity="0.3" />
              <Circle cx="200" cy="200" r="25" fill="#4FFFB0" opacity="0.5" />
              <Circle cx="200" cy="200" r="15" fill="#ffffff" />
            </Animated.G>

            {/* Concentric circles */}
            <Circle cx="200" cy="200" r="70" stroke="#4FFFB0" strokeWidth="1" fill="none" opacity="0.3" />
            <Circle cx="200" cy="200" r="105" stroke="#4FFFB0" strokeWidth="1" fill="none" opacity="0.2" />
            <Circle cx="200" cy="200" r="140" stroke="#4FFFB0" strokeWidth="1" fill="none" opacity="0.1" />

            {/* Contact nodes on the circle */}
            {contacts.map((contact, index) => {
              const pos = getContactPosition(index, contacts.length);
              return (
                <React.Fragment key={contact.id}>
                  {/* Line from center to contact */}
                  <Line
                    x1="200"
                    y1="200"
                    x2={pos.x}
                    y2={pos.y}
                    stroke={pos.color}
                    strokeWidth="1"
                    opacity="0.3"
                  />
                  {/* Contact glow */}
                  <Circle
                    cx={pos.x}
                    cy={pos.y}
                    r={pos.radius + 4}
                    fill={pos.color}
                    opacity="0.2"
                  />
                  {/* Contact node */}
                  <Circle
                    cx={pos.x}
                    cy={pos.y}
                    r={pos.radius}
                    fill={pos.color}
                    opacity="0.9"
                  />
                </React.Fragment>
              );
            })}
          </Svg>
        </View>

        {/* Congratulations popup */}
        {showCongrats && (
          <Animated.View
            style={[
              styles.popupContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.popup}>
              <Text style={styles.popupTitle}>Congratulations on creating{'\n'}your first circle!</Text>
              <Text style={styles.popupDescription}>
                This is the start to a much stronger, more visual look at your network.
              </Text>

              <TouchableOpacity
                style={styles.viewButton}
                onPress={handleNextStep}
                activeOpacity={0.8}
              >
                <Text style={styles.viewButtonText}>Next →</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Profile setup prompt */}
        {showProfilePrompt && (
          <Animated.View
            style={[
              styles.promptContainer,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.profilePrompt}
              onPress={handleSetupProfile}
              activeOpacity={0.9}
            >
              <Text style={styles.promptTitle}>Set up your profile →</Text>
              <Text style={styles.promptSubtitle}>Add your socials and{'\n'}complete your profile.</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    marginBottom: 20,
    zIndex: 10,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#2a4a3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starsFixed: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#ffffff',
    borderRadius: 1,
    opacity: 0.5,
  },
  orbitContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.2,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  popupContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  popup: {
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4FFFB0',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  popupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 32,
  },
  popupDescription: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  promptContainer: {
    position: 'absolute',
    top: '30%',
    left: 40,
    zIndex: 100,
  },
  profilePrompt: {
    backgroundColor: 'rgba(42, 74, 58, 0.95)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#4FFFB0',
    padding: 20,
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 15,
    maxWidth: 280,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  promptSubtitle: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
  },
  viewButton: {
    backgroundColor: '#4FFFB0',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});

