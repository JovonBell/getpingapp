/**
 * GoalInputModal - Bottom sheet for goal/path planning
 * 
 * Features:
 * - Voice or text input for goal
 * - Goal type selection (Job, Cofounder, Mentor, Dating)
 * - Context input for AI
 * - 3D scene visible behind (not full screen)
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.55;
const DRAG_THRESHOLD = 50;

// Goal types
const GOAL_TYPES = [
  { id: 'job', label: 'Job', icon: 'briefcase-outline' },
  { id: 'cofounder', label: 'Cofounder', icon: 'people-outline' },
  { id: 'mentor', label: 'Mentor', icon: 'school-outline' },
  { id: 'dating', label: 'Dating', icon: 'heart-outline' },
  { id: 'custom', label: 'Other', icon: 'ellipsis-horizontal' },
];

export default function GoalInputModal({
  visible,
  onClose,
  onSubmit,
  isSearching = false,
}) {
  const [goalText, setGoalText] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [context, setContext] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const translateY = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const lastGestureDy = useRef(0);

  // Show/hide animation
  React.useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : MODAL_HEIGHT,
      useNativeDriver: true,
      damping: 20,
      stiffness: 150,
    }).start();
  }, [visible, translateY]);

  // Pan responder for drag to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
          lastGestureDy.current = gestureState.dy;
        }
      },
      onPanResponderRelease: () => {
        if (lastGestureDy.current > DRAG_THRESHOLD) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
        lastGestureDy.current = 0;
      },
    })
  ).current;

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    Animated.timing(translateY, {
      toValue: MODAL_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose?.();
    });
  }, [translateY, onClose]);

  const handleSubmit = useCallback(() => {
    if (!goalText.trim()) return;
    
    onSubmit?.({
      text: goalText.trim(),
      type: selectedType,
      context: context.trim(),
    });
  }, [goalText, selectedType, context, onSubmit]);

  const toggleVoiceMode = () => {
    setIsVoiceMode(!isVoiceMode);
  };

  const handleVoiceRecord = () => {
    // In production, integrate with expo-speech or react-native-voice
    setIsRecording(!isRecording);
    
    if (isRecording) {
      // Stop recording and transcribe
      // For now, just simulate
      setTimeout(() => {
        setGoalText('I want to connect with investors in AI');
        setIsRecording(false);
        setIsVoiceMode(false);
      }, 1000);
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      {/* Drag handle */}
      <View style={styles.dragHandle} {...panResponder.panHandlers}>
        <View style={styles.handleBar} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleSubmit}
            disabled={!goalText.trim() || isSearching}
          >
            <Text style={[
              styles.saveText,
              (!goalText.trim() || isSearching) && styles.saveTextDisabled
            ]}>
              {isSearching ? 'Finding...' : 'Find Path'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main input */}
        <View style={styles.inputSection}>
          {isVoiceMode ? (
            <TouchableOpacity 
              style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
              onPress={handleVoiceRecord}
            >
              <Ionicons 
                name={isRecording ? 'stop-circle' : 'mic'} 
                size={48} 
                color={isRecording ? '#FF6B6B' : '#4FFFB0'} 
              />
              <Text style={styles.voiceHint}>
                {isRecording ? 'Tap to stop' : 'Tap to speak'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TextInput
              style={styles.goalInput}
              placeholder="I want to reach..."
              placeholderTextColor="#666"
              value={goalText}
              onChangeText={setGoalText}
              multiline
              autoFocus
            />
          )}
          
          <TouchableOpacity 
            style={styles.voiceToggle}
            onPress={toggleVoiceMode}
          >
            <Ionicons 
              name={isVoiceMode ? 'keyboard' : 'mic-outline'} 
              size={24} 
              color="#4FFFB0" 
            />
          </TouchableOpacity>
        </View>

        {/* Goal type selector */}
        <View style={styles.typeSection}>
          <Text style={styles.sectionLabel}>GOAL TYPE</Text>
          <View style={styles.typeGrid}>
            {GOAL_TYPES.map(type => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeButton,
                  selectedType === type.id && styles.typeButtonSelected,
                ]}
                onPress={() => setSelectedType(
                  selectedType === type.id ? null : type.id
                )}
              >
                <Ionicons 
                  name={type.icon} 
                  size={20} 
                  color={selectedType === type.id ? '#000' : '#4FFFB0'} 
                />
                <Text style={[
                  styles.typeLabel,
                  selectedType === type.id && styles.typeLabelSelected,
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Context input */}
        <View style={styles.contextSection}>
          <Text style={styles.sectionLabel}>WHY THIS CONNECTION?</Text>
          <TextInput
            style={styles.contextInput}
            placeholder="Add details to help the AI find the best path..."
            placeholderTextColor="#555"
            value={context}
            onChangeText={setContext}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Submit button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!goalText.trim() || isSearching) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!goalText.trim() || isSearching}
        >
          {isSearching ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color="#000" />
              <Text style={styles.submitText}>Start Path Finding</Text>
            </>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: MODAL_HEIGHT,
    backgroundColor: 'rgba(15, 20, 18, 0.98)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    // Glass effect
    borderTopWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.2)',
  },
  dragHandle: {
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cancelText: {
    color: '#888',
    fontSize: 16,
  },
  saveText: {
    color: '#4FFFB0',
    fontSize: 16,
    fontWeight: '600',
  },
  saveTextDisabled: {
    color: '#444',
  },
  inputSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  goalInput: {
    flex: 1,
    color: '#fff',
    fontSize: 20,
    fontWeight: '500',
    minHeight: 60,
    paddingRight: 40,
  },
  voiceToggle: {
    position: 'absolute',
    right: 0,
    top: 5,
    padding: 10,
  },
  voiceButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    backgroundColor: 'rgba(79, 255, 176, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.3)',
  },
  voiceButtonActive: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  voiceHint: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
  },
  typeSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    color: '#888',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 255, 176, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.3)',
  },
  typeButtonSelected: {
    backgroundColor: '#4FFFB0',
    borderColor: '#4FFFB0',
  },
  typeLabel: {
    color: '#4FFFB0',
    fontSize: 13,
    fontWeight: '500',
  },
  typeLabelSelected: {
    color: '#000',
  },
  contextSection: {
    marginBottom: 20,
  },
  contextInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4FFFB0',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 'auto',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#333',
  },
  submitText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});
