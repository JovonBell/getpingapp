# Sound Effects

Add the following sound effect files to this folder:

- `tap.mp3` - Light click sound (~50ms) - for button taps
- `success.mp3` - Achievement chime (~500ms) - for completions
- `whoosh.mp3` - Screen transition (~300ms) - for navigation
- `chime.mp3` - Celebration tone (~800ms) - for celebrations

## Royalty-Free Sources

- [Mixkit](https://mixkit.co/free-sound-effects/) - Free for commercial use
- [Freesound](https://freesound.org/) - CC licensed sounds
- [Pixabay](https://pixabay.com/sound-effects/) - Free for commercial use

## After Adding Files

Update `utils/soundManager.js` to require the sound files:

```javascript
const soundFiles = {
  tap: require('../assets/sounds/tap.mp3'),
  success: require('../assets/sounds/success.mp3'),
  whoosh: require('../assets/sounds/whoosh.mp3'),
  chime: require('../assets/sounds/chime.mp3'),
};
```
