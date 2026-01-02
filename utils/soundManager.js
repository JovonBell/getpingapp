import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_SETTINGS_KEY = '@ping_sound_settings';

// Sound effects - loaded lazily
const soundFiles = {
  tap: require('../assets/sounds/tap.mp3'),
  success: require('../assets/sounds/success.mp3'),
  whoosh: require('../assets/sounds/whoosh.mp3'),
  chime: require('../assets/sounds/chime.mp3'),
};

// Cached sound objects
const loadedSounds = {};

// Settings
let soundEnabled = true;
let soundVolume = 0.5;

class SoundManager {
  static instance = null;

  static getInstance() {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  constructor() {
    this.initialized = false;
    this.loadSettings();
  }

  async loadSettings() {
    try {
      const settings = await AsyncStorage.getItem(SOUND_SETTINGS_KEY);
      if (settings) {
        const parsed = JSON.parse(settings);
        soundEnabled = parsed.enabled ?? true;
        soundVolume = parsed.volume ?? 0.5;
      }
    } catch (err) {
      console.warn('[SoundManager] Failed to load settings:', err);
    }
  }

  async saveSettings() {
    try {
      await AsyncStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify({
        enabled: soundEnabled,
        volume: soundVolume,
      }));
    } catch (err) {
      console.warn('[SoundManager] Failed to save settings:', err);
    }
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      this.initialized = true;
      console.log('[SoundManager] Initialized');
    } catch (err) {
      console.warn('[SoundManager] Initialization failed:', err);
    }
  }

  async preloadSound(soundName) {
    if (loadedSounds[soundName]) return loadedSounds[soundName];
    if (!soundFiles[soundName]) return null;

    try {
      const { sound } = await Audio.Sound.createAsync(
        soundFiles[soundName],
        { volume: soundVolume }
      );
      loadedSounds[soundName] = sound;
      return sound;
    } catch (err) {
      console.warn(`[SoundManager] Failed to preload ${soundName}:`, err);
      return null;
    }
  }

  async play(soundName) {
    if (!soundEnabled) return;
    if (!soundFiles[soundName]) {
      // Sound file not available yet - silently skip
      return;
    }

    try {
      await this.initialize();

      // Try to use cached sound, or load it
      let sound = loadedSounds[soundName];
      if (!sound) {
        sound = await this.preloadSound(soundName);
      }

      if (sound) {
        await sound.setPositionAsync(0);
        await sound.setVolumeAsync(soundVolume);
        await sound.playAsync();
      }
    } catch (err) {
      console.warn(`[SoundManager] Failed to play ${soundName}:`, err);
    }
  }

  // Quick helper functions
  async playTap() {
    await this.play('tap');
  }

  async playSuccess() {
    await this.play('success');
  }

  async playWhoosh() {
    await this.play('whoosh');
  }

  async playChime() {
    await this.play('chime');
  }

  // Settings
  setEnabled(enabled) {
    soundEnabled = enabled;
    this.saveSettings();
  }

  isEnabled() {
    return soundEnabled;
  }

  setVolume(volume) {
    soundVolume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  getVolume() {
    return soundVolume;
  }

  // Cleanup
  async unloadAll() {
    try {
      for (const sound of Object.values(loadedSounds)) {
        if (sound) {
          await sound.unloadAsync();
        }
      }
      Object.keys(loadedSounds).forEach(key => delete loadedSounds[key]);
    } catch (err) {
      console.warn('[SoundManager] Failed to unload sounds:', err);
    }
  }
}

// Export singleton instance
export const soundManager = SoundManager.getInstance();

// Export convenience functions
export const playTap = () => soundManager.playTap();
export const playSuccess = () => soundManager.playSuccess();
export const playWhoosh = () => soundManager.playWhoosh();
export const playChime = () => soundManager.playChime();
export const setSoundEnabled = (enabled) => soundManager.setEnabled(enabled);
export const isSoundEnabled = () => soundManager.isEnabled();
export const setSoundVolume = (volume) => soundManager.setVolume(volume);
export const getSoundVolume = () => soundManager.getVolume();
