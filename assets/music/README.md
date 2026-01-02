# Ambient Music

Add the following ambient music files to this folder:

- `ambient_onboarding.mp3` - Dreamy, chill lo-fi vibes (~2-3 min loop) - for onboarding screens
- `ambient_home.mp3` - Subtle cosmic/space ambience - for 3D universe view
- `ambient_focus.mp3` - Calm focus music - for editing contacts/reminders

## Royalty-Free Sources

- [Pixabay Music](https://pixabay.com/music/) - Free for commercial use
- [Mixkit Music](https://mixkit.co/free-stock-music/) - Free lo-fi/ambient
- [Free Music Archive](https://freemusicarchive.org/) - CC licensed tracks

## Recommended Search Terms

- "ambient lo-fi"
- "cosmic space ambient"
- "calm focus music"
- "dreamy background music"

## After Adding Files

Update `utils/musicManager.js` to require the music files:

```javascript
const musicTracks = {
  onboarding: require('../assets/music/ambient_onboarding.mp3'),
  home: require('../assets/music/ambient_home.mp3'),
  focus: require('../assets/music/ambient_focus.mp3'),
};
```
