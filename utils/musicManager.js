import { Audio } from 'expo-av';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MUSIC_SETTINGS_KEY = '@ping_music_settings';

// Ambient music tracks
const musicTracks = {
  onboarding: require('../assets/music/ambient_onboarding.mp3'),
  home: require('../assets/music/ambient_home.mp3'),
  focus: require('../assets/music/ambient_focus.mp3'),
};

class MusicManager {
  static instance = null;

  static getInstance() {
    if (!MusicManager.instance) {
      MusicManager.instance = new MusicManager();
    }
    return MusicManager.instance;
  }

  constructor() {
    this.currentSound = null;
    this.currentTrack = null;
    this.enabled = true;
    this.volume = 0.25;
    this.isFading = false;
    this.initialized = false;
    this.appStateSubscription = null;

    try {
      this.loadSettings();
      this.setupAppStateListener();
    } catch (err) {
      console.log('[MusicManager] Init failed (Expo Go?):', err?.message);
    }
  }

  async loadSettings() {
    try {
      const settings = await AsyncStorage.getItem(MUSIC_SETTINGS_KEY);
      if (settings) {
        const parsed = JSON.parse(settings);
        this.enabled = parsed.enabled ?? true;
        this.volume = parsed.volume ?? 0.25;
      }
    } catch (err) {
      console.warn('[MusicManager] Failed to load settings:', err);
    }
  }

  async saveSettings() {
    try {
      await AsyncStorage.setItem(MUSIC_SETTINGS_KEY, JSON.stringify({
        enabled: this.enabled,
        volume: this.volume,
      }));
    } catch (err) {
      console.warn('[MusicManager] Failed to save settings:', err);
    }
  }

  setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        this.fadeOut(500);
      } else if (state === 'active' && this.currentTrack) {
        this.fadeIn(500);
      }
    });
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      this.initialized = true;
      console.log('[MusicManager] Initialized');
    } catch (err) {
      console.warn('[MusicManager] Initialization failed:', err);
    }
  }

  async play(trackName) {
    if (!this.enabled) return;
    if (!musicTracks[trackName]) {
      console.log(`[MusicManager] Track "${trackName}" not available yet`);
      return;
    }

    // If same track is already playing, skip
    if (this.currentTrack === trackName && this.currentSound) {
      return;
    }

    try {
      await this.initialize();

      // Stop current track with fade
      if (this.currentSound) {
        await this.fadeOut(500);
        await this.stop();
      }

      // Load and play new track
      const { sound } = await Audio.Sound.createAsync(
        musicTracks[trackName],
        {
          isLooping: true,
          volume: 0,
        }
      );

      this.currentSound = sound;
      this.currentTrack = trackName;

      await sound.playAsync();
      await this.fadeIn(1000);

      console.log(`[MusicManager] Now playing: ${trackName}`);
    } catch (err) {
      console.warn(`[MusicManager] Failed to play ${trackName}:`, err);
    }
  }

  async fadeIn(durationMs = 1000) {
    if (!this.currentSound || this.isFading) return;

    this.isFading = true;
    const steps = 20;
    const stepDuration = durationMs / steps;
    const targetVolume = this.volume;

    try {
      for (let i = 1; i <= steps; i++) {
        const vol = (targetVolume * i) / steps;
        await this.currentSound.setVolumeAsync(vol);
        await new Promise(resolve => setTimeout(resolve, stepDuration));
      }
    } catch (err) {
      console.warn('[MusicManager] Fade in failed:', err);
    } finally {
      this.isFading = false;
    }
  }

  async fadeOut(durationMs = 1000) {
    if (!this.currentSound || this.isFading) return;

    this.isFading = true;
    const steps = 20;
    const stepDuration = durationMs / steps;

    try {
      const status = await this.currentSound.getStatusAsync();
      const currentVolume = status.volume || this.volume;

      for (let i = steps - 1; i >= 0; i--) {
        const vol = (currentVolume * i) / steps;
        await this.currentSound.setVolumeAsync(vol);
        await new Promise(resolve => setTimeout(resolve, stepDuration));
      }
    } catch (err) {
      console.warn('[MusicManager] Fade out failed:', err);
    } finally {
      this.isFading = false;
    }
  }

  async stop() {
    if (!this.currentSound) return;

    try {
      await this.currentSound.stopAsync();
      await this.currentSound.unloadAsync();
    } catch (err) {
      console.warn('[MusicManager] Stop failed:', err);
    } finally {
      this.currentSound = null;
      this.currentTrack = null;
    }
  }

  async pause() {
    if (!this.currentSound) return;

    try {
      await this.currentSound.pauseAsync();
    } catch (err) {
      console.warn('[MusicManager] Pause failed:', err);
    }
  }

  async resume() {
    if (!this.currentSound || !this.enabled) return;

    try {
      await this.currentSound.playAsync();
    } catch (err) {
      console.warn('[MusicManager] Resume failed:', err);
    }
  }

  // Settings
  setEnabled(enabled) {
    this.enabled = enabled;
    this.saveSettings();

    if (!enabled && this.currentSound) {
      this.fadeOut(500).then(() => this.stop());
    }
  }

  isEnabled() {
    return this.enabled;
  }

  async setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.saveSettings();

    if (this.currentSound) {
      try {
        await this.currentSound.setVolumeAsync(this.volume);
      } catch (err) {
        console.warn('[MusicManager] Set volume failed:', err);
      }
    }
  }

  getVolume() {
    return this.volume;
  }

  getCurrentTrack() {
    return this.currentTrack;
  }

  // Cleanup
  destroy() {
    this.stop();
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
  }
}

// Export singleton instance
export const musicManager = MusicManager.getInstance();

// Export convenience functions
export const playMusic = (trackName) => musicManager.play(trackName);
export const stopMusic = () => musicManager.stop();
export const pauseMusic = () => musicManager.pause();
export const resumeMusic = () => musicManager.resume();
export const setMusicEnabled = (enabled) => musicManager.setEnabled(enabled);
export const isMusicEnabled = () => musicManager.isEnabled();
export const setMusicVolume = (volume) => musicManager.setVolume(volume);
export const getMusicVolume = () => musicManager.getVolume();
export const getCurrentTrack = () => musicManager.getCurrentTrack();
