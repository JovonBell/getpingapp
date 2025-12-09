import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  FlatList,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HomeScreen({ navigation, route }) {
  // Get contacts from route params or use dummy data for testing
  const routeContacts = route?.params?.contacts || [];
  const selectedContacts = routeContacts.length > 0 ? routeContacts : [
    { id: '1', name: 'Alice Johnson', phone: '(555) 123-4567', initials: 'AJ' },
    { id: '2', name: 'Bob Smith', phone: '(555) 234-5678', initials: 'BS' },
    { id: '3', name: 'Carol White', phone: '(555) 345-6789', initials: 'CW' },
    { id: '4', name: 'David Brown', phone: '(555) 456-7890', initials: 'DB' },
    { id: '5', name: 'Emma Davis', phone: '(555) 567-8901', initials: 'ED' },
    { id: '6', name: 'Frank Miller', phone: '(555) 678-9012', initials: 'FM' },
    { id: '7', name: 'Grace Lee', phone: '(555) 789-0123', initials: 'GL' },
    { id: '8', name: 'Henry Wilson', phone: '(555) 890-1234', initials: 'HW' },
  ];
  // Helper to get first name from full name
  const getFirstName = (fullName) => fullName.split(' ')[0];

  const [rotation, setRotation] = useState(0);
  const [selectedContact, setSelectedContact] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);

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
  const colors = ['#4FFFB0', '#ffaa00', '#ff6b6b', '#4ecdc4'];

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
  const lastTouchAngle = useRef(0);
  const isDragging = useRef(false);

  // Center of the circle visualization
  const circleCenterX = SCREEN_WIDTH / 2;
  const circleCenterY = 250; // Approximate center of network visualization

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
      const touch = event.nativeEvent.touches[0];
      // Store initial touch position (not angle)
      lastTouchAngle.current = { x: touch.pageX, y: touch.pageY };
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
      // NEW APPROACH: Use cross product for intuitive rotation
      const touch = event.nativeEvent.touches[0];

      // Get touch position relative to circle center
      const touchX = touch.pageX;
      const touchY = touch.pageY;

      // Vector from center to current touch
      const radiusX = touchX - circleCenterX;
      const radiusY = touchY - circleCenterY;

      // Get movement delta
      const deltaX = touch.pageX - (lastTouchAngle.current.x || touch.pageX);
      const deltaY = touch.pageY - (lastTouchAngle.current.y || touch.pageY);

      // Cross product determines rotation direction
      // Positive = clockwise, Negative = counterclockwise
      const crossProduct = radiusX * deltaY - radiusY * deltaX;

      // Calculate rotation magnitude based on distance from center
      const distance = Math.sqrt(radiusX * radiusX + radiusY * radiusY);
      const rotationDelta = (crossProduct / (distance * distance)) * 200; // Sensitivity multiplier

      setRotation(prev => prev + rotationDelta);

      // Store current position for next frame
      lastTouchAngle.current = { x: touch.pageX, y: touch.pageY };
    }
  };

  const handleTouchEnd = () => {
    lastDistance.current = 0;
    isDragging.current = false;
  };

  const handleContactPress = (contact, index) => {
    // Calculate position of the contact dot
    const pos = getContactPosition(index, selectedContacts.length);

    // Convert SVG coordinates to screen coordinates
    // SVG is centered in the screen, viewBox is 400x400
    const svgCenterX = SCREEN_WIDTH / 2;
    const svgCenterY = 250; // Adjust for header and search bar

    // Scale factor (SVG viewBox is 400, so scale accordingly)
    const scale = SCREEN_WIDTH / 400;

    // Calculate screen position
    const screenX = svgCenterX + (pos.x - 200) * scale;
    const screenY = svgCenterY + (pos.y - 200) * scale;

    // Position popup with better bounds checking
    const popupWidth = 160;
    const popupHeight = 120;
    const padding = 10;
    const searchBarBottom = 180; // Approximate bottom of search bar

    let popupX = screenX + 20;
    let popupY = screenY - 60;

    // Check right edge
    if (popupX + popupWidth > SCREEN_WIDTH - padding) {
      popupX = screenX - popupWidth - 20;
    }

    // Check left edge
    if (popupX < padding) {
      popupX = padding;
    }

    // Check top edge (avoid search bar)
    if (popupY < searchBarBottom) {
      popupY = searchBarBottom + padding;
    }

    // Check bottom edge
    const bottomNavHeight = 90;
    if (popupY + popupHeight > SCREEN_HEIGHT - bottomNavHeight - padding) {
      popupY = SCREEN_HEIGHT - bottomNavHeight - popupHeight - padding;
    }

    setPopupPosition({ x: popupX, y: popupY });
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
    setShowMoreInfo(false);
  };

  const handleSeeMoreInfo = () => {
    setShowMoreInfo(true);
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
            <Ionicons name="search" size={20} color="#4FFFB0" style={styles.searchIcon} />
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
                  <Circle cx="200" cy="200" r="40" fill="#4FFFB0" opacity="0.3" />
                  <Circle cx="200" cy="200" r="25" fill="#4FFFB0" opacity="0.5" />
                  <Circle cx="200" cy="200" r="15" fill="#ffffff" />

                  {/* Concentric circles */}
                  <Circle cx="200" cy="200" r="70" stroke="#4FFFB0" strokeWidth="1" fill="none" opacity="0.3" />
                  <Circle cx="200" cy="200" r="105" stroke="#4FFFB0" strokeWidth="1" fill="none" opacity="0.2" />
                  <Circle cx="200" cy="200" r="140" stroke="#4FFFB0" strokeWidth="1" fill="none" opacity="0.1" />

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
                                stroke="#4FFFB0"
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
                          onPress={() => handleContactPress(contact, index)}
                        />
                        {/* Contact first name */}
                        <SvgText
                          x={pos.x}
                          y={pos.y + 20}
                          fill="#ffffff"
                          fontSize="10"
                          textAnchor="middle"
                          opacity="0.8"
                        >
                          {getFirstName(contact.name)}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}
                </Svg>
              </Animated.View>
            </View>
          </View>

        <Text style={styles.tapInstruction}>drag to rotate • tap a connection • pinch to zoom</Text>

        {/* Small Contact Popup Box */}
        {selectedContact !== null && !showMoreInfo && (
          <TouchableOpacity
            style={styles.popupOverlay}
            activeOpacity={1}
            onPress={closePopup}
          >
            <View
              style={[
                styles.popupBox,
                {
                  left: popupPosition.x,
                  top: popupPosition.y,
                }
              ]}
            >
              <Text style={styles.popupName}>{selectedContact?.name}</Text>
              <Text style={styles.popupPhone}>{selectedContact?.phone}</Text>

              <View style={styles.popupActions}>
                <TouchableOpacity
                  style={styles.popupButton}
                  onPress={() => {
                    closePopup();
                    navigation.navigate('Messages', { contact: selectedContact });
                  }}
                >
                  <Ionicons name="chatbubble" size={20} color="#4FFFB0" />
                  <Text style={styles.popupButtonText}>Message</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.popupButton}
                  onPress={handleSeeMoreInfo}
                >
                  <Ionicons name="information-circle" size={20} color="#4FFFB0" />
                  <Text style={styles.popupButtonText}>More Info</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* More Info Side Panel */}
        <Modal
          visible={showMoreInfo}
          transparent={true}
          animationType="slide"
          onRequestClose={closePopup}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.overlayDismiss}
              activeOpacity={1}
              onPress={closePopup}
            />
            <View style={styles.sidePanel}>
              <View style={styles.panelHeader}>
                <TouchableOpacity style={styles.closeButton} onPress={closePopup}>
                  <Ionicons name="close" size={28} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <View style={styles.panelContent}>
                <View style={[
                  styles.panelAvatar,
                  { backgroundColor: selectedContact ? colors[selectedContact.index % colors.length] : '#4FFFB0' }
                ]}>
                  <Text style={styles.panelAvatarText}>
                    {selectedContact?.initials || 'NA'}
                  </Text>
                </View>

                <Text style={styles.panelName}>{selectedContact?.name}</Text>
                <View style={styles.panelInfo}>
                  <Ionicons name="call-outline" size={16} color="#999" />
                  <Text style={styles.panelPhone}>{selectedContact?.phone}</Text>
                </View>

                <View style={styles.panelActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="call" size={24} color="#4FFFB0" />
                    <Text style={styles.actionLabel}>Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      closePopup();
                      navigation.navigate('Messages', { contact: selectedContact });
                    }}
                  >
                    <Ionicons name="chatbubble" size={24} color="#4FFFB0" />
                    <Text style={styles.actionLabel}>Message</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="person" size={24} color="#4FFFB0" />
                    <Text style={styles.actionLabel}>Profile</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.panelDivider} />

                <View style={styles.panelDetails}>
                  <Text style={styles.detailsTitle}>Connection Details</Text>

                  <View style={styles.detailRow}>
                    <Ionicons name="radio-button-on" size={20} color="#4FFFB0" />
                    <Text style={styles.detailLabel}>Ring Tier: Close Friends</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={20} color="#4FFFB0" />
                    <Text style={styles.detailLabel}>Connected: 3 months ago</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="chatbubbles-outline" size={20} color="#4FFFB0" />
                    <Text style={styles.detailLabel}>Last interaction: 2 days ago</Text>
                  </View>
                </View>
              </View>
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
    borderColor: '#4FFFB0',
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
    borderColor: '#4FFFB0',
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
  popupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  popupBox: {
    position: 'absolute',
    width: 160,
    backgroundColor: '#0a1a0a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4FFFB0',
    padding: 12,
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  popupName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  popupPhone: {
    color: '#999',
    fontSize: 11,
    marginBottom: 10,
  },
  popupActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  popupButton: {
    alignItems: 'center',
    gap: 4,
  },
  popupButtonText: {
    color: '#ffffff',
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayDismiss: {
    flex: 1,
  },
  sidePanel: {
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: '#0a1a0a',
    borderLeftWidth: 2,
    borderLeftColor: '#4FFFB0',
    shadowColor: '#4FFFB0',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 4,
  },
  panelContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  panelAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#4FFFB0',
  },
  panelAvatarText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  panelName: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  panelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  panelPhone: {
    color: '#999',
    fontSize: 16,
  },
  panelActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  actionLabel: {
    color: '#ffffff',
    fontSize: 13,
  },
  panelDivider: {
    height: 1,
    backgroundColor: '#2a3a2a',
    marginBottom: 24,
  },
  panelDetails: {
    gap: 16,
  },
  detailsTitle: {
    color: '#4FFFB0',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    color: '#ffffff',
    fontSize: 15,
  },
});
