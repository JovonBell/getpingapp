import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Animated,
  Modal,
  Dimensions,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HomeScreen({ navigation, route }) {
  const selectedContacts = route?.params?.contacts || [];
  const [rotation, setRotation] = useState(0);
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const zoomScale = useRef(new Animated.Value(1)).current;
  const starAnimations = useRef([...Array(30)].map(() => new Animated.Value(0))).current;

  // Fixed star positions (generated once and never change)
  const starPositions = useRef(
    [...Array(30)].map(() => ({
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * 400,
    }))
  ).current;

  // Filter contacts based on search
  const filteredContacts = searchQuery.length > 0
    ? selectedContacts.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Colors for contacts
  const colors = ['#00ff88', '#ffaa00', '#ff6b6b', '#4ecdc4'];

  // Concentric circle radii - smaller to fit on screen
  const RING_RADII = [70, 105, 140];

  // Calculate positions for contacts - evenly distributed on each ring
  const getContactPosition = (index, total) => {
    let ring, angleOffset;

    // Evenly distribute contacts across rings
    const contactsPerRing = Math.ceil(total / 3);

    if (index < contactsPerRing) {
      // First ring
      ring = 0;
      const countInRing = Math.min(contactsPerRing, total);
      angleOffset = (index * (360 / countInRing)) * (Math.PI / 180);
    } else if (index < contactsPerRing * 2) {
      // Second ring
      ring = 1;
      const countInRing = Math.min(contactsPerRing, total - contactsPerRing);
      angleOffset = ((index - contactsPerRing) * (360 / countInRing)) * (Math.PI / 180) + (Math.PI / 12);
    } else {
      // Third ring
      ring = 2;
      const countInRing = total - (contactsPerRing * 2);
      angleOffset = ((index - contactsPerRing * 2) * (360 / countInRing)) * (Math.PI / 180) + (Math.PI / 6);
    }

    const radius = RING_RADII[ring];

    return {
      x: 200 + radius * Math.cos(angleOffset + rotation * (Math.PI / 180)),
      y: 200 + radius * Math.sin(angleOffset + rotation * (Math.PI / 180)),
      radius: 8,
      color: colors[index % colors.length],
      ring,
    };
  };

  // Animate flowing stars
  useEffect(() => {
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

    return () => animations.forEach(anim => anim.stop());
  }, []);

  // Pinch to zoom and rotation gesture handlers
  const lastScale = useRef(1);
  const lastDistance = useRef(0);
  const lastTouchX = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = (event) => {
    if (event.nativeEvent.touches.length === 2) {
      // Two finger pinch
      isDragging.current = false;
      const touch1 = event.nativeEvent.touches[0];
      const touch2 = event.nativeEvent.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.pageX - touch1.pageX, 2) + Math.pow(touch2.pageY - touch1.pageY, 2)
      );
      lastDistance.current = distance;
    } else if (event.nativeEvent.touches.length === 1) {
      // Single finger drag for rotation
      isDragging.current = true;
      lastTouchX.current = event.nativeEvent.touches[0].pageX;
    }
  };

  const handleTouchMove = (event) => {
    if (event.nativeEvent.touches.length === 2) {
      // Pinch to zoom
      isDragging.current = false;
      const touch1 = event.nativeEvent.touches[0];
      const touch2 = event.nativeEvent.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.pageX - touch1.pageX, 2) + Math.pow(touch2.pageY - touch1.pageY, 2)
      );

      if (lastDistance.current > 0) {
        const scale = distance / lastDistance.current;
        const newScale = lastScale.current * scale;

        // Limit zoom between 0.5x and 3x
        if (newScale >= 0.5 && newScale <= 3) {
          zoomScale.setValue(newScale);
          lastScale.current = newScale;
        }
      }

      lastDistance.current = distance;
    } else if (event.nativeEvent.touches.length === 1 && isDragging.current) {
      // Drag to rotate
      const currentX = event.nativeEvent.touches[0].pageX;
      const deltaX = currentX - lastTouchX.current;

      // Update rotation based on drag
      setRotation(rotation + deltaX * 0.5);
      lastTouchX.current = currentX;
    }
  };

  const handleTouchEnd = () => {
    lastDistance.current = 0;
    isDragging.current = false;
  };

  const handleContactPress = (contact, index) => {
    setSelectedContact({ ...contact, index });

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closePopup = () => {
    setSelectedContact(null);
  };

  const handleSearchFocus = () => {
    setShowSearchResults(true);
  };

  const handleSearchBlur = () => {
    setTimeout(() => setShowSearchResults(false), 200);
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
            <TouchableOpacity
              style={styles.messageButton}
              onPress={() => navigation.navigate('Messages')}
            >
              <Ionicons name="chatbubble-outline" size={24} color="#ffffff" />
              <View style={styles.messageBadge}>
                <Text style={styles.messageBadgeText}>!</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profilePic}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="person" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#00ff88" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="search your circle"
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
            />
          </View>

          {/* Search Results Dropdown */}
          {showSearchResults && searchQuery.length > 0 && (
            <View style={styles.searchResults}>
              {filteredContacts.length > 0 ? (
                <FlatList
                  data={filteredContacts}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      style={styles.searchResultItem}
                      onPress={() => {
                        handleContactPress(item, selectedContacts.indexOf(item));
                        setSearchQuery('');
                        setShowSearchResults(false);
                      }}
                    >
                      <View style={[styles.resultAvatar, { backgroundColor: colors[index % colors.length] }]}>
                        <Text style={styles.resultAvatarText}>{item.initials}</Text>
                      </View>
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultName}>{item.name}</Text>
                        <Text style={styles.resultPhone}>{item.phone}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  style={styles.searchResultsList}
                />
              ) : (
                <Text style={styles.noResults}>No contacts found</Text>
              )}
            </View>
          )}
        </View>

        {/* Network Visualization */}
        <View style={styles.networkContainer}>
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

          {/* Rotatable network visualization */}
          <View
            style={styles.networkView}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Animated.View style={[styles.svgContainer, { transform: [{ scale: zoomScale }] }]}>
              <Svg height="400" width={SCREEN_WIDTH} viewBox="0 0 400 400">
                  {/* Center glow */}
                  <Circle cx="200" cy="200" r="40" fill="#00ff88" opacity="0.3" />
                  <Circle cx="200" cy="200" r="25" fill="#00ff88" opacity="0.5" />
                  <Circle cx="200" cy="200" r="15" fill="#ffffff" />

                  {/* Concentric circles */}
                  <Circle cx="200" cy="200" r="70" stroke="#00ff88" strokeWidth="1" fill="none" opacity="0.3" />
                  <Circle cx="200" cy="200" r="105" stroke="#00ff88" strokeWidth="1" fill="none" opacity="0.2" />
                  <Circle cx="200" cy="200" r="140" stroke="#00ff88" strokeWidth="1" fill="none" opacity="0.1" />

                  {/* Lines connecting contacts to center and each other */}
                  {selectedContacts.map((contact, index) => {
                    const pos = getContactPosition(index, selectedContacts.length);
                    return (
                      <React.Fragment key={`lines-${contact.id}`}>
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
                        {/* Lines to nearby contacts on same or adjacent rings */}
                        {selectedContacts.slice(0, index).map((otherContact, otherIndex) => {
                          const otherPos = getContactPosition(otherIndex, selectedContacts.length);
                          const ringDiff = Math.abs(pos.ring - otherPos.ring);

                          if (ringDiff <= 1 && Math.random() > 0.5) {
                            return (
                              <Line
                                key={`${contact.id}-${otherContact.id}`}
                                x1={pos.x}
                                y1={pos.y}
                                x2={otherPos.x}
                                y2={otherPos.y}
                                stroke="#00ff88"
                                strokeWidth="0.5"
                                opacity="0.15"
                              />
                            );
                          }
                          return null;
                        })}
                      </React.Fragment>
                    );
                  })}

                  {/* Contact nodes */}
                  {selectedContacts.map((contact, index) => {
                    const pos = getContactPosition(index, selectedContacts.length);
                    return (
                      <React.Fragment key={contact.id}>
                        {/* Contact node */}
                        <Circle
                          cx={pos.x}
                          cy={pos.y}
                          r={pos.radius}
                          fill={pos.color}
                          opacity="0.9"
                          onPress={() => handleContactPress(contact, index)}
                        />
                        {/* Contact initials */}
                        <SvgText
                          x={pos.x}
                          y={pos.y + 20}
                          fill="#ffffff"
                          fontSize="10"
                          textAnchor="middle"
                          opacity="0.8"
                        >
                          {contact.initials}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}

                  {/* Labels for ring tiers */}
                  <SvgText x="320" y="280" fill="#999" fontSize="12" textAnchor="end">
                    Close Friends
                  </SvgText>
                  <SvgText x="320" y="260" fill="#999" fontSize="12" textAnchor="end">
                    Family
                  </SvgText>
                  <SvgText x="320" y="240" fill="#999" fontSize="12" textAnchor="end">
                    Network
                  </SvgText>
                </Svg>
              </Animated.View>
            </View>
          </View>

        <Text style={styles.tapInstruction}>drag to rotate • tap a connection • pinch to zoom</Text>

        {/* Contact Detail Popup */}
        <Modal
          visible={selectedContact !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={closePopup}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={closePopup}
          >
            <View style={styles.popup}>
              <View style={styles.popupHeader}>
                <View style={[
                  styles.popupAvatar,
                  { backgroundColor: selectedContact ? colors[selectedContact.index % colors.length] : '#00ff88' }
                ]}>
                  <Text style={styles.popupAvatarText}>
                    {selectedContact?.initials || 'NA'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={closePopup}>
                  <Ionicons name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.popupName}>{selectedContact?.name}</Text>
              <Text style={styles.popupPhone}>{selectedContact?.phone}</Text>

              <TouchableOpacity style={styles.callButton}>
                <Ionicons name="call-outline" size={20} color="#1a1a1a" />
                <Text style={styles.callButtonText}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.messageButtonSecondary}>
                <Ionicons name="chatbubble-outline" size={20} color="#00ff88" />
                <Text style={styles.messageButtonTextSecondary}>Send Message</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    marginBottom: 20,
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
  profilePic: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#2a4a3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrapper: {
    position: 'relative',
    zIndex: 100,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderWidth: 2,
    borderColor: '#00ff88',
    borderRadius: 25,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 12,
  },
  searchResults: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: '#1a2a1a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00ff88',
    maxHeight: 250,
    zIndex: 1000,
  },
  searchResultsList: {
    maxHeight: 250,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3a2a',
  },
  resultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultAvatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  resultPhone: {
    color: '#999',
    fontSize: 14,
  },
  noResults: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  networkContainer: {
    flex: 1,
    position: 'relative',
  },
  starsFixed: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  networkView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#ffffff',
    borderRadius: 1,
    opacity: 0.5,
  },
  tapInstruction: {
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 12,
    marginBottom: 20,
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    backgroundColor: '#1a2a1a',
    borderRadius: 20,
    padding: 24,
    width: SCREEN_WIDTH - 80,
    borderWidth: 2,
    borderColor: '#00ff88',
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  popupAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupAvatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  popupName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  popupPhone: {
    color: '#999',
    fontSize: 16,
    marginBottom: 20,
  },
  callButton: {
    backgroundColor: '#00ff88',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  callButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
  messageButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#00ff88',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  messageButtonTextSecondary: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: '600',
  },
});
