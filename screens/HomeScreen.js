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
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import PlanetZoom3D from '../components/PlanetZoom3D';
import CircleZoom3D from '../components/CircleZoom3D';
import { getImportedContacts as loadImportedContacts } from '../utils/contactsStorage';
import { getCurrentUser } from '../utils/supabaseStorage';
import { loadCirclesWithMembers, deleteCircle } from '../utils/circlesStorage';
import { getUnreadMessageCount } from '../utils/messagesStorage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HomeScreen({ navigation, route }) {
  // Back-compat: older flow passes a single circle as { contacts, circleName }.
  const routeContacts = route?.params?.contacts || [];
  const routeCircleName = route?.params?.circleName || 'Your first Circle';
  const isFirstCircle = route?.params?.isFirstCircle || false;

  // Imported contacts can exist before a circle is created (from ImportConfirmationScreen).
  const [importedContacts, setImportedContacts] = useState(route?.params?.importedContacts || []);

  // Circles model: each circle is a ring with a name + contacts.
  const [circles, setCircles] = useState([]);
  const [circlesLoading, setCirclesLoading] = useState(true);
  const [justDeleted, setJustDeleted] = useState(false); // Prevent reload after delete
  const hasCircle = circles.length > 0;
  // Helper to get first name from full name
  const getFirstName = (fullName) => fullName.split(' ')[0];

  const [rotation, setRotation] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [circleCenterY, setCircleCenterY] = useState(250);
  
  // First circle celebration states
  const [showCongratsPopup, setShowCongratsPopup] = useState(isFirstCircle);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const congratsAnim = useRef(new Animated.Value(0)).current;
  const profilePromptAnim = useRef(new Animated.Value(0)).current;

  // 3D planet zoom overlay state
  const [planetOpen, setPlanetOpen] = useState(false);
  const [planetStartIndex, setPlanetStartIndex] = useState(0);
  const [activeCircleItems, setActiveCircleItems] = useState([]); // Contacts from the active circle only
  const [unreadCount, setUnreadCount] = useState(0);

  // Delete circle states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCircleToDelete, setSelectedCircleToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Circle zoom 3D view state (when tapping on a ring)
  const [circleZoomOpen, setCircleZoomOpen] = useState(false);
  const [selectedCircleForZoom, setSelectedCircleForZoom] = useState(null);

  // Load imported contacts from local storage (so the universe persists across restarts).
  useEffect(() => {
    let mounted = true;
    const boot = async () => {
      // If route provided contacts (just imported), keep them and also refresh from storage.
      const fromRoute = route?.params?.importedContacts;
      if (fromRoute && Array.isArray(fromRoute) && fromRoute.length > 0) {
        if (mounted) setImportedContacts(fromRoute);
        return;
      }
      const { contacts: stored } = await loadImportedContacts();
      if (mounted) setImportedContacts(stored || []);
    };
    boot();
    return () => {
      mounted = false;
    };
  }, [route?.params?.importedContacts]);

  // Load circles from Supabase (authoritative) when the Home tab is focused.
  useEffect(() => {
    let mounted = true;
    
    const load = async (force = false) => {
      // Skip reload if we just deleted (prevents bringing back deleted circles)
      if (justDeleted && !force) {
        console.log('[HomeScreen] Skipping reload - just deleted a circle');
        return;
      }
      
      console.log('[HomeScreen] Loading circles from Supabase...');
      setCirclesLoading(true);
      
      try {
        const { success: userSuccess, user } = await getCurrentUser();
        console.log('[HomeScreen] User check:', { userSuccess, userId: user?.id });
        
        if (!userSuccess || !user) {
          console.warn('[HomeScreen] No authenticated user found');
          if (mounted) {
            setCircles([]);
            setCirclesLoading(false);
          }
          return;
        }
        
        const res = await loadCirclesWithMembers(user.id);
        console.log('[HomeScreen] Circles loaded:', { success: res.success, count: res.circles?.length, error: res.error });
        
        if (mounted) {
          if (res.success) {
            setCircles(res.circles || []);
            console.log('[HomeScreen] ✅ Circles set to state:', res.circles?.length || 0);
          } else {
            console.error('[HomeScreen] Failed to load circles:', res.error);
          }
          setCirclesLoading(false);
        }
      } catch (e) {
        console.error('[HomeScreen] Exception loading circles:', e?.message || e);
        if (mounted) {
          setCirclesLoading(false);
        }
      }
    };

    load(true); // Force load on mount
    const unsub = navigation.addListener('focus', () => {
      console.log('[HomeScreen] Tab focused, reloading circles...');
      load();
    });
    
    return () => {
      mounted = false;
      unsub();
    };
  }, [navigation]);

  useEffect(() => {
    const loadUnread = async () => {
      const { success, user } = await getCurrentUser();
      if (!success || !user) return;
      const res = await getUnreadMessageCount(user.id);
      if (res.success) setUnreadCount(res.count);
    };
    loadUnread();
    const unsub = navigation.addListener('focus', loadUnread);
    return unsub;
  }, [navigation]);

  // Sync circles when coming back from VisualizeCircle (new multi-circle flow) or legacy params.
  const lastCirclesTokenRef = useRef(null);
  useEffect(() => {
    // SKIP if we just deleted - don't overwrite with old data
    if (justDeleted) {
      console.log('[HomeScreen] Skipping route params sync - justDeleted is true');
      return;
    }
    
    const nextCircles = route?.params?.circles;
    const token = route?.params?.circlesToken;
    if (nextCircles && Array.isArray(nextCircles) && token && token !== lastCirclesTokenRef.current) {
      lastCirclesTokenRef.current = token;
      setCircles(nextCircles);
      return;
    }

    // Legacy single-circle params (only initialize if we don't already have circles)
    // Generate a proper UUID-like ID for local state
    if (routeContacts && Array.isArray(routeContacts) && routeContacts.length > 0 && circles.length === 0) {
      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      setCircles([{ id: uuid, name: routeCircleName, contacts: routeContacts }]);
    }
  }, [route?.params?.circles, route?.params?.circlesToken, routeContacts, routeCircleName, circles.length, justDeleted]);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const zoomScale = useRef(new Animated.Value(1)).current;
  const networkViewRef = useRef(null);

  // Star positions and animations for upward flow
  const NUM_STARS = 40;
  const STAR_AREA_HEIGHT = 600; // Extended height for smooth wrapping
  const starAnimations = useRef([...Array(NUM_STARS)].map(() => new Animated.Value(0))).current;
  
  const starPositions = useRef(
    [...Array(NUM_STARS)].map(() => ({
      x: Math.random() * SCREEN_WIDTH,
      startY: Math.random() * STAR_AREA_HEIGHT, // Starting Y position
      speed: 0.3 + Math.random() * 0.7, // Random speed for each star (0.3 to 1.0)
      size: 1 + Math.random() * 2, // Random size
      opacity: 0.3 + Math.random() * 0.5, // Random base opacity
    }))
  ).current;

  const allCircleContacts = circles.reduce((acc, c) => acc.concat(c?.contacts || []), []);
  const allSearchContacts = hasCircle ? allCircleContacts : importedContacts;

  // Filter contacts based on search
  const filteredContacts = searchQuery.length > 0
    ? allSearchContacts.filter(contact =>
        contact?.name?.toLowerCase?.().includes(searchQuery.toLowerCase())
      )
    : [];

  // Colors for contacts
  const colors = ['#4FFFB0', '#ffaa00', '#ff6b6b', '#4ecdc4'];

  const BASE_RING_RADIUS = 70;
  const SINGLE_DOTTED_RADIUS = 150;
  const MAX_DOTTED_RADIUS = 165;

  // Keep rings within the 400x400 SVG viewBox even as more circles are added.
  // Increased spacing between rings for better visual separation
  let ringStep = circles.length <= 1 ? (SINGLE_DOTTED_RADIUS - BASE_RING_RADIUS) : 55;
  if (circles.length > 0 && BASE_RING_RADIUS + ringStep * circles.length > MAX_DOTTED_RADIUS) {
    ringStep = (MAX_DOTTED_RADIUS - BASE_RING_RADIUS) / circles.length;
  }

  const getRingRadius = (ringIndex) => BASE_RING_RADIUS + ringStep * ringIndex;
  const getDottedRingRadius = () => BASE_RING_RADIUS + ringStep * circles.length;

  // Calculate positions for contacts - evenly distributed on their ring
  // arrayIndex is the index in ringedContacts/planetItems for reliable color mapping
  // Offset each ring by half the angle step to create a staggered/scattered effect
  const getContactPosition = (indexOnRing, totalOnRing, ringIndex, arrayIndex) => {
    const angleStep = 360 / Math.max(1, totalOnRing);
    const ringOffset = ringIndex % 2 === 0 ? 0 : angleStep / 2; // Stagger odd rings
    const angleOffset = (indexOnRing * angleStep + ringOffset) * (Math.PI / 180);
    const radius = getRingRadius(ringIndex);

    return {
      x: 200 + radius * Math.cos(angleOffset + rotation * (Math.PI / 180)),
      y: 200 + radius * Math.sin(angleOffset + rotation * (Math.PI / 180)),
      radius: 8,
      color: colors[arrayIndex % colors.length],
      ring: ringIndex,
    };
  };

  const primaryCircleName = circles?.[0]?.name || routeCircleName;

  // Flatten circles -> ringed contact entries (stable ordering with useMemo to prevent rebuilding)
  const ringedContacts = React.useMemo(() => {
    const result = [];
    circles.forEach((circle, ringIndex) => {
      const contacts = circle?.contacts || [];
      contacts.forEach((contact, indexOnRing) => {
        result.push({
          contact,
          ringIndex,
          indexOnRing,
          totalOnRing: contacts.length,
          globalIndex: result.length,
        });
      });
    });
    return result;
  }, [circles]);

  // Items used by 3D planet view (index must align with handlePerson3DPress indices)
  // Use array index as the source of truth for mapping
  const planetItems = React.useMemo(() => {
    return ringedContacts.map((entry, arrayIndex) => ({
      ...entry.contact,
      color: colors[arrayIndex % colors.length],
    }));
  }, [ringedContacts]);

  // Map contact ID to array index for reliable lookups
  const planetIndexById = React.useMemo(() => {
    return ringedContacts.reduce((acc, entry, arrayIndex) => {
      acc[entry?.contact?.id] = arrayIndex;
      return acc;
    }, {});
  }, [ringedContacts]);

  const dottedRingRadius = hasCircle ? getDottedRingRadius() : SINGLE_DOTTED_RADIUS;
  const addCirclePlusX = 200 + dottedRingRadius;
  const deleteCircleMinusX = 200 - dottedRingRadius;

  // Animate stars flowing upwards smoothly and continuously
  useEffect(() => {
    const animations = starAnimations.map((anim, i) => {
      const star = starPositions[i];
      // Duration based on speed - slower speed = longer duration
      const duration = 8000 / star.speed; // 8-26 seconds per cycle
      
      return Animated.loop(
        Animated.timing(anim, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
          easing: t => t, // Linear easing for smooth constant flow
        })
      );
    });

    animations.forEach(anim => anim.start());

    return () => animations.forEach(anim => anim.stop());
  }, []);

  // Handle first circle congratulations popup
  useEffect(() => {
    if (showCongratsPopup) {
      // Fade in the congratulations popup
      Animated.timing(congratsAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        dismissCongrats();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showCongratsPopup]);

  const dismissCongrats = () => {
    Animated.timing(congratsAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowCongratsPopup(false);
      setShowProfilePrompt(true);
      // Fade in profile prompt
      Animated.timing(profilePromptAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleSetupProfile = () => {
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('ProfileEdit', {
        fromFirstCircle: true,
        contacts: circles?.[0]?.contacts || [],
        circleName: circles?.[0]?.name || routeCircleName,
      });
    } else {
      navigation.navigate('ProfileEdit', {
        fromFirstCircle: true,
        contacts: circles?.[0]?.contacts || [],
        circleName: circles?.[0]?.name || routeCircleName,
      });
    }
    setShowProfilePrompt(false);
  };

  // Pinch to zoom and rotation gesture handlers
  const lastScale = useRef(1);
  const lastDistance = useRef(0);
  const lastTouchPos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const touchStartTime = useRef(0);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const totalTouchMovement = useRef(0);

  // Center of the circle visualization
  const circleCenterX = SCREEN_WIDTH / 2;

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
      // Single finger - could be tap or drag
      isDragging.current = true;
      const touch = event.nativeEvent.touches[0];
      lastTouchPos.current = { x: touch.pageX, y: touch.pageY };
      touchStartTime.current = Date.now();
      touchStartPos.current = { x: touch.pageX, y: touch.pageY };
      totalTouchMovement.current = 0;
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

        if (newScale >= 0.5 && newScale <= 3) {
          zoomScale.setValue(newScale);
          lastScale.current = newScale;
        }
      }

      lastDistance.current = distance;
    } else if (event.nativeEvent.touches.length === 1 && isDragging.current) {
      const touch = event.nativeEvent.touches[0];

      // Current touch position
      const currentX = touch.pageX;
      const currentY = touch.pageY;

      // Movement since last frame
      const deltaX = currentX - lastTouchPos.current.x;
      const deltaY = currentY - lastTouchPos.current.y;
      
      // Track total movement to distinguish tap from drag
      totalTouchMovement.current += Math.abs(deltaX) + Math.abs(deltaY);

      // Vector from center to touch point
      const radiusX = currentX - circleCenterX;
      const radiusY = currentY - circleCenterY;

      // Cross product: positive = clockwise, negative = counterclockwise
      const crossProduct = radiusX * deltaY - radiusY * deltaX;

      // Normalize by distance squared to make rotation speed consistent
      const distanceSquared = radiusX * radiusX + radiusY * radiusY;

      if (distanceSquared > 0) {
        // Sensitivity: higher = faster rotation
        const rotationSpeed = 150;
        const rotationDelta = (crossProduct / distanceSquared) * rotationSpeed;

        setRotation(prev => prev + rotationDelta);
      }

      // Update last position
      lastTouchPos.current = { x: currentX, y: currentY };
    }
  };

  const handleTouchEnd = (event) => {
    const touchDuration = Date.now() - touchStartTime.current;
    const wasTap = touchDuration < 300 && totalTouchMovement.current < 15;
    
    if (wasTap && hasCircle) {
      // Check if tap was on a ring
      // We need to convert the tap position to SVG coordinates
      // The SVG is centered and has viewBox="0 0 400 400" displayed in width=SCREEN_WIDTH
      
      // Get the tap position relative to the SVG center
      const tapX = touchStartPos.current.x;
      const tapY = touchStartPos.current.y;
      
      // SVG center in screen coordinates - the SVG is centered horizontally
      // and the networkView is flex:1 centered
      // SVG viewBox is 400x400, center is at 200,200 in SVG coords
      // The SVG is rendered at width=SCREEN_WIDTH, so scale factor is SCREEN_WIDTH/400
      const svgScale = SCREEN_WIDTH / 400;
      const svgCenterScreenX = SCREEN_WIDTH / 2;
      const svgCenterScreenY = circleCenterY; // This is calculated from the view layout
      
      // Convert tap to SVG coordinates
      const svgX = 200 + (tapX - svgCenterScreenX) / svgScale;
      const svgY = 200 + (tapY - svgCenterScreenY) / svgScale;
      
      // Calculate distance from center (200, 200) in SVG coords
      const distFromCenter = Math.sqrt(Math.pow(svgX - 200, 2) + Math.pow(svgY - 200, 2));
      
      // Check if tap is on any ring (within tolerance)
      const ringTolerance = 15; // pixels in SVG coords
      
      for (let ringIndex = 0; ringIndex < circles.length; ringIndex++) {
        const ringRadius = getRingRadius(ringIndex);
        if (Math.abs(distFromCenter - ringRadius) < ringTolerance) {
          // Tapped on this ring!
          handleRingPress(ringIndex);
          break;
        }
      }
    }
    
    lastDistance.current = 0;
    isDragging.current = false;
  };

  const handleCenterPress = () => {
    console.log('Center pressed!');
    const parent = navigation.getParent();
    
    if (hasCircle) {
      // If circle exists, center tap edits profile
      if (parent) parent.navigate('ProfileEdit');
      else navigation.navigate('ProfileEdit');
    } else {
      // No circle yet, start the "create your first circle" workflow
      console.log('No circle, navigating to SelectContacts...');
      if (parent) {
        parent.navigate('SelectContacts', { selectAll: false, isFirstCircle: true });
      } else {
        navigation.navigate('SelectContacts', { selectAll: false, isFirstCircle: true });
      }
    }
  };

  const handleCreateNewCircle = () => {
    console.log('[HOME] ➕➕➕ CREATE NEW CIRCLE BUTTON PRESSED!');
    console.log('[HOME] Existing circles:', circles.length);
    const parent = navigation.getParent();
    const params = { selectAll: false, isFirstCircle: false, existingCircles: circles };
    console.log('[HOME] Navigating to SelectContacts with params:', params);
    if (parent) {
      console.log('[HOME] Using parent navigation');
      parent.navigate('SelectContacts', params);
    } else {
      console.log('[HOME] Using direct navigation');
      navigation.navigate('SelectContacts', params);
    }
  };

  const handleDeleteCircleClick = () => {
    // Allow deletion even if there's only one circle left
    if (circles.length === 0) return;
    setShowDeleteModal(true);
  };

  const handleSelectCircleToDelete = (circle) => {
    setSelectedCircleToDelete(circle);
    setShowDeleteModal(false);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedCircleToDelete) return;
    
    const circleId = selectedCircleToDelete.id;
    const circleName = selectedCircleToDelete.name;
    console.log('[HOME] 🗑️ DELETING:', circleId, circleName);
    
    // FORCE CLOSE MODALS
    setShowDeleteConfirm(false);
    setShowDeleteModal(false);
    setSelectedCircleToDelete(null);
    
    // BLOCK RELOADS
    setJustDeleted(true);
    
    // FORCE DELETE FROM LOCAL STATE - calculate new array directly
    const remaining = circles.filter(c => c.id !== circleId);
    console.log('[HOME] Setting circles from', circles.length, 'to', remaining.length);
    setCircles(remaining);
    
    // Delete from Supabase in background
    (async () => {
      try {
        const { user } = await getCurrentUser();
        if (user) {
          await deleteCircle(circleId);
          console.log('[HOME] ✅ Supabase delete done');
        }
      } catch (e) {
        console.error('[HOME] Supabase delete error:', e);
      }
      setTimeout(() => setJustDeleted(false), 3000);
    })();
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setSelectedCircleToDelete(null);
  };

  const handlePerson3DPress = (contact, index) => {
    // Find which circle this contact belongs to using the ringedContacts entry
    const entry = ringedContacts[index];
    if (!entry) {
      setPlanetStartIndex(0);
      setPlanetOpen(true);
      return;
    }
    
    const ringIndex = entry.ringIndex;
    const circle = circles[ringIndex];
    
    if (!circle || !circle.contacts) {
      setPlanetStartIndex(0);
      setPlanetOpen(true);
      return;
    }
    
    // Get only the contacts from this circle
    const circleContacts = circle.contacts.map((c, idx) => ({
      ...c,
      color: colors[idx % colors.length],
    }));
    
    // Find the index of the selected contact within this circle
    const indexInCircle = circle.contacts.findIndex(c => c.id === contact.id);
    
    setActiveCircleItems(circleContacts);
    setPlanetStartIndex(Math.max(0, indexInCircle));
    setPlanetOpen(true);
  };

  const handlePlanetMoreInfo = () => {
    // handled inside PlanetZoom3D via callback
  };

  // Handler for when a ring (circle) is tapped
  const handleRingPress = (ringIndex) => {
    const circle = circles[ringIndex];
    if (circle) {
      setSelectedCircleForZoom(circle);
      setCircleZoomOpen(true);
    }
  };

  // Handler when contact is pressed from CircleZoom3D (opens PlanetZoom3D focused view)
  const handleCircleZoomContactPress = (contact) => {
    if (!selectedCircleForZoom) return;
    
    const circleContacts = selectedCircleForZoom.contacts || [];
    const circleItems = circleContacts.map((c, idx) => ({
      ...c,
      color: colors[idx % colors.length],
    }));
    const indexInCircle = circleContacts.findIndex(c => c.id === contact.id);
    
    setCircleZoomOpen(false);
    setActiveCircleItems(circleItems);
    setPlanetStartIndex(Math.max(0, indexInCircle));
    setPlanetOpen(true);
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
              {unreadCount > 0 && (
                <View style={styles.messageBadge}>
                  <Text style={styles.messageBadgeText}>
                    {unreadCount > 99 ? '99+' : String(unreadCount)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profilePic}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="person" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar & circle label only after first circle exists */}
        {hasCircle && (
          <>
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
                            // Find the contact in ringedContacts to get their circle info
                            const ringedIndex = ringedContacts.findIndex(entry => entry.contact?.id === item?.id);
                            if (ringedIndex >= 0) {
                              handlePerson3DPress(item, ringedIndex);
                              setSearchQuery('');
                              setShowSearchResults(false);
                            }
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

            <View style={styles.circleNameContainer}>
              <Text style={styles.circleNameLabel}>current circle</Text>
              <Text style={styles.circleNameValue}>{primaryCircleName}</Text>
            </View>
          </>
        )}

        {/* Network Visualization */}
        <View style={styles.networkContainer}>
          {/* Flowing star background - moves upward independently */}
          <View style={styles.starsFixed} pointerEvents="none">
            {starAnimations.map((anim, i) => {
              const star = starPositions[i];
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.star,
                    {
                      left: star.x,
                      width: star.size,
                      height: star.size,
                      opacity: star.opacity,
                      transform: [
                        {
                          translateY: anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [star.startY, star.startY - STAR_AREA_HEIGHT], // Move upward
                          }),
                        },
                      ],
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Rotatable network visualization */}
          <View
            ref={networkViewRef}
            style={styles.networkView}
            onLayout={() => {
              networkViewRef.current?.measure((_x, _y, _width, height, _pageX, pageY) => {
                setCircleCenterY(pageY + height / 2);
              });
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Circle label */}
            {hasCircle && (
              <View style={styles.circleLabelContainer}>
                <Ionicons name="people-outline" size={16} color="#4FFFB0" />
                <Text style={styles.circleLabelText}>{primaryCircleName}</Text>
              </View>
            )}

            <Animated.View style={[styles.svgContainer, { transform: [{ scale: zoomScale }] }]}>
              <Svg height="400" width={SCREEN_WIDTH} viewBox="0 0 400 400">
                  {/* Center glow / nucleus */}
                  <Circle cx="200" cy="200" r="40" fill="#4FFFB0" opacity="0.3" />
                  <Circle cx="200" cy="200" r="25" fill="#4FFFB0" opacity="0.5" />
                  <Circle cx="200" cy="200" r="15" fill="#ffffff" />

                  {/* Circles */}
                  {!hasCircle ? (
                    <>
                      {/* Empty state: glowing concentric circles */}
                      <Circle cx="200" cy="200" r="70" stroke="#4FFFB0" strokeWidth="1" fill="none" opacity="0.25" />
                      <Circle cx="200" cy="200" r="105" stroke="#4FFFB0" strokeWidth="1" fill="none" opacity="0.18" />
                    </>
                  ) : (
                    <>
                      {/* Solid rings (one per circle) - tap detected via touch handlers */}
                      {circles.map((circle, ringIndex) => (
                        <Circle
                          key={circle?.id || `ring-${ringIndex}`}
                          cx="200"
                          cy="200"
                          r={getRingRadius(ringIndex)}
                          stroke="#4FFFB0"
                          strokeWidth={ringIndex === 0 ? 2.5 : 2}
                          fill="none"
                          opacity={ringIndex === 0 ? 0.5 : 0.35}
                        />
                      ))}
                    </>
                  )}

                  {/* Outer dotted ring + plus/minus (always visible) */}
                  <Circle
                    cx="200"
                    cy="200"
                    r={dottedRingRadius}
                    stroke="#4FFFB0"
                    strokeWidth="1"
                    strokeDasharray="3 8"
                    fill="none"
                    opacity="0.25"
                  />
                  
                  {/* Plus button (always visible) - WITH onPress */}
                  <Circle
                    cx={addCirclePlusX}
                    cy="200"
                    r="24"
                    fill="rgba(79, 255, 176, 0.25)"
                    stroke="#4FFFB0"
                    strokeWidth="2"
                    onPress={() => {
                      console.log('[SVG] Plus button pressed!');
                      handleCreateNewCircle();
                    }}
                  />
                  <SvgText x={addCirclePlusX} y="207" fill="#4FFFB0" fontSize="22" fontWeight="700" textAnchor="middle">+</SvgText>
                  
                  {/* Minus button (only show if there are circles to delete) - WITH onPress */}
                  {hasCircle && (
                    <>
                      <Circle
                        cx={deleteCircleMinusX}
                        cy="200"
                        r="24"
                        fill="rgba(255, 107, 107, 0.25)"
                        stroke="#ff6b6b"
                        strokeWidth="2"
                        onPress={() => {
                          console.log('[SVG] Minus button pressed!');
                          handleDeleteCircleClick();
                        }}
                      />
                      <SvgText x={deleteCircleMinusX} y="207" fill="#ff6b6b" fontSize="22" fontWeight="700" textAnchor="middle">−</SvgText>
                    </>
                  )}

                  {/* Lines connecting contacts to center */}
                  {ringedContacts.map((entry, arrayIndex) => {
                    const pos = getContactPosition(entry.indexOnRing, entry.totalOnRing, entry.ringIndex, arrayIndex);
                    return (
                      <React.Fragment key={`lines-${entry.ringIndex}-${entry.indexOnRing}-${entry.contact.id}`}>
                        <Line
                          x1="200"
                          y1="200"
                          x2={pos.x}
                          y2={pos.y}
                          stroke={pos.color}
                          strokeWidth="1"
                          opacity="0.26"
                        />
                      </React.Fragment>
                    );
                  })}

                  {/* Contact nodes */}
                  {ringedContacts.map((entry, arrayIndex) => {
                    const pos = getContactPosition(entry.indexOnRing, entry.totalOnRing, entry.ringIndex, arrayIndex);
                    return (
                      <React.Fragment key={`contact-${entry.ringIndex}-${entry.indexOnRing}-${entry.contact.id}`}>
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
                          onPress={() => handlePerson3DPress(entry.contact, arrayIndex)}
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
                          {getFirstName(entry.contact.name)}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}
                </Svg>
              </Animated.View>
            </View>

          </View>

          {/* Large, invisible tap target over the nucleus - only when no circle exists */}
          {/* Positioned outside networkView to avoid touch handler interference */}
          {!hasCircle && (
            <TouchableOpacity
              style={styles.centerTapTarget}
              activeOpacity={1}
              onPress={handleCenterPress}
            >
              <View style={{ flex: 1 }} />
            </TouchableOpacity>
          )}


        <View style={styles.tapInstructionContainer}>
          <Text style={styles.tapInstruction}>
            {hasCircle
              ? 'Tap a person to view • Tap a ring to explore that circle'
              : 'tap the center to create your first Circle • drag to rotate • pinch to zoom'}
          </Text>
        </View>

        {/* NOTE: Per UX requirement, HomeScreen shows NO popups/panels. Interaction happens only via the 3D sphere view. */}

        {/* First Circle Congratulations Popup */}
        {showCongratsPopup && (
          <Animated.View style={[styles.congratsOverlay, { opacity: congratsAnim }]}>
            <Animated.View style={[styles.congratsPopup, { 
              opacity: congratsAnim,
              transform: [{ scale: congratsAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              })}]
            }]}>
              <Text style={styles.congratsTitle}>Congratulations on creating{'\n'}your first circle!</Text>
              <Text style={styles.congratsSubtext}>
                This is the start to a much stronger, more visual look at your network.
              </Text>
              <TouchableOpacity
                style={styles.congratsButton}
                onPress={dismissCongrats}
                activeOpacity={0.8}
              >
                <Text style={styles.congratsButtonText}>Next →</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        )}

        {/* Profile Setup Prompt (bottom-right under circles, pointing to center) */}
        {hasCircle && showProfilePrompt && (
          <Animated.View style={[styles.profilePromptContainer, { opacity: profilePromptAnim }]}>
            <View style={styles.profilePromptArrow} />
            <TouchableOpacity
              style={styles.profilePrompt}
              onPress={handleSetupProfile}
              activeOpacity={0.9}
            >
              <Text style={styles.profilePromptTitle}>Set up your profile →</Text>
              <Text style={styles.profilePromptSubtext}>Add your socials and{'\n'}complete your profile.</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <PlanetZoom3D
          visible={planetOpen}
          onClose={() => {
            setPlanetOpen(false);
          }}
          items={activeCircleItems}
          initialIndex={planetStartIndex}
          onMoreInfo={() => {
            // More info is now handled inside PlanetZoom3D component
          }}
          onMessage={async (contact) => {
            setPlanetOpen(false);
            if (contact && contact.phone) {
              // Open native iMessage with the contact's phone number
              const phoneNumber = contact.phone.replace(/[^0-9]/g, ''); // Remove non-numeric characters
              const smsUrl = `sms:${phoneNumber}`;
              
              try {
                const canOpen = await Linking.canOpenURL(smsUrl);
                if (canOpen) {
                  await Linking.openURL(smsUrl);
                } else {
                  Alert.alert('Unable to open Messages', 'Could not open the Messages app.');
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to open Messages app.');
              }
            } else {
              Alert.alert('No Phone Number', 'This contact does not have a phone number.');
            }
          }}
        />

        {/* Circle Zoom 3D View - shows when tapping on a ring */}
        <CircleZoom3D
          visible={circleZoomOpen}
          onClose={() => {
            setCircleZoomOpen(false);
            setSelectedCircleForZoom(null);
          }}
          circleName={selectedCircleForZoom?.name || 'Circle'}
          contacts={selectedCircleForZoom?.contacts || []}
          onContactPress={handleCircleZoomContactPress}
          onMessage={async (contact) => {
            setCircleZoomOpen(false);
            if (contact && contact.phone) {
              const phoneNumber = contact.phone.replace(/[^0-9]/g, '');
              const smsUrl = `sms:${phoneNumber}`;
              
              try {
                const canOpen = await Linking.canOpenURL(smsUrl);
                if (canOpen) {
                  await Linking.openURL(smsUrl);
                } else {
                  Alert.alert('Unable to open Messages', 'Could not open the Messages app.');
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to open Messages app.');
              }
            } else {
              Alert.alert('No Phone Number', 'This contact does not have a phone number.');
            }
          }}
        />

        {/* Delete Circle Selection Modal */}
        <Modal
          visible={showDeleteModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.deleteModal}>
              <Text style={styles.deleteModalTitle}>Select Circle to Delete</Text>
              <FlatList
                data={circles}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.circleOption}
                    onPress={() => handleSelectCircleToDelete(item)}
                  >
                    <Text style={styles.circleOptionName}>{item.name}</Text>
                    <Text style={styles.circleOptionCount}>
                      {item.contacts?.length || 0} contacts
                    </Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteConfirm}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCancelDelete}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmModal}>
              <Ionicons name="warning-outline" size={60} color="#ff6b6b" />
              <Text style={styles.confirmTitle}>Delete Circle?</Text>
              <Text style={styles.confirmMessage}>
                Are you sure you want to delete "{selectedCircleToDelete?.name}"?
              </Text>
              <Text style={styles.confirmWarning}>This action cannot be undone.</Text>
              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  style={[styles.confirmButton, styles.confirmCancel]}
                  onPress={handleCancelDelete}
                >
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, styles.confirmDelete]}
                  onPress={handleConfirmDelete}
                >
                  <Text style={styles.confirmDeleteText}>Delete</Text>
                </TouchableOpacity>
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
    overflow: 'hidden', // Clip stars outside the view
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
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  tapInstruction: {
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.85,
  },
  tapInstructionContainer: {
    paddingHorizontal: 24,
    paddingBottom: 22,
    paddingTop: 10,
    alignItems: 'center',
  },
  centerTapTarget: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    left: (SCREEN_WIDTH - 100) / 2,
    top: '45%',
    zIndex: 1000,
    // backgroundColor: 'rgba(255, 0, 0, 0.5)', // Debug: uncomment to see tap area
  },
  circleNameContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  circleNameLabel: {
    color: '#4FFFB0',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  circleNameValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
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
  // Circle label on orbit
  circleLabelContainer: {
    position: 'absolute',
    top: 30,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 20,
  },
  circleLabelText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  // First Circle Congratulations Popup Styles
  congratsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  congratsPopup: {
    backgroundColor: 'rgba(26, 42, 26, 0.98)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4FFFB0',
    padding: 28,
    marginHorizontal: 30,
    alignItems: 'center',
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  congratsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  congratsSubtext: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  congratsButton: {
    backgroundColor: '#4FFFB0',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 25,
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  congratsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  // Profile Prompt Styles
  profilePromptContainer: {
    position: 'absolute',
    right: 16,
    bottom: 90,
    zIndex: 1500,
    alignItems: 'flex-end',
  },
  profilePromptArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#4FFFB0',
    marginRight: 42,
    marginBottom: 6,
    opacity: 0.6,
  },
  profilePrompt: {
    backgroundColor: 'rgba(42, 74, 58, 0.95)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#4FFFB0',
    padding: 16,
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 15,
    maxWidth: 220,
  },
  profilePromptTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  profilePromptSubtext: {
    fontSize: 13,
    color: '#cccccc',
    lineHeight: 18,
  },
  // Delete Circle Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModal: {
    backgroundColor: '#1a2a1a',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ff6b6b',
    padding: 24,
    marginHorizontal: 30,
    maxHeight: 400,
    width: '80%',
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  circleOption: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  circleOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  circleOptionCount: {
    fontSize: 14,
    color: '#cccccc',
  },
  cancelButton: {
    backgroundColor: '#2a3a2a',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  // Delete Confirmation Modal Styles
  confirmModal: {
    backgroundColor: '#1a2a1a',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ff6b6b',
    padding: 28,
    marginHorizontal: 30,
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 12,
  },
  confirmMessage: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmWarning: {
    fontSize: 14,
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmCancel: {
    backgroundColor: '#2a3a2a',
  },
  confirmDelete: {
    backgroundColor: '#ff6b6b',
  },
  confirmCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  confirmDeleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});
