# 3D Target Spec: Apple Astronomy Lock Screen Clone

> This is the TARGET state for Ping's 3D visualization. All 3D work should move toward this spec.

## Tech Stack
- React Native + Expo
- Three.js (via expo-three / expo-gl)
- GSAP (for camera animations)

---

## 1. Scene Architecture (The "Orrery")

### Coordinate System
- **Heliocentric**: Center nucleus at `(0, 0, 0)`
- Contacts orbit on rings around the center

### Lighting (CRITICAL)
- **Point light at `(0, 0, 0)`** (inside the nucleus)
- Contacts are ONLY illuminated on the side facing center
- Other side must be **pitch black** (high contrast)
- Ambient light should be **near-zero**

### Background
- High-density procedural starfield
- Pitch black base (`#020208`)
- Subtle depth fog for atmosphere

---

## 2. The Interaction Model (CRITICAL)

### State Machine: Two States

```
SYSTEM_VIEW  <-->  CONTACT_FOCUS
```

**SYSTEM_VIEW (Default)**
- Camera at `z=50` (or appropriate distance)
- All rings visible
- Contacts as small spheres on orbital paths
- Full solar system visible

**CONTACT_FOCUS (Zoomed)**
- Camera close to target contact
- Contact fills **60%** of screen
- Contact becomes center of camera pivot
- User can rotate slightly around focused contact
- Name displayed prominently

### The Animation Logic (CRITICAL)

When user taps a contact:

1. **DO NOT teleport the camera**
2. **DO interpolate** both:
   - Camera position
   - Camera lookAt vector
3. Duration: **1.5 seconds**
4. Easing: **power3.inOut** (slow start, slow stop)
5. End state: Camera at `contact.position + z_offset`

### Zoom Out Logic

When clicking "Back" or empty space:
1. Reverse the interpolation
2. Camera pulls back to `z=50`
3. Full orbital rings visible again
4. Same **1.5s duration**, **power3.inOut** easing

---

## 3. Contact Sphere Rendering

### Current Pain Points
- Photo spheres look janky
- Not aesthetically pleasing

### Target State
- Photo texture wrapped on 3D sphere
- **Premium look** - if it's not beautiful, don't show it
- Fallback to colored orb + initials if no photo
- Subtle glow based on health status

### Lighting on Contacts
- Strong "terminator line" (shadow edge)
- Only lit on sun-facing side
- Creates dramatic Apple-style contrast

---

## 4. Ring Rendering

### Visual Style
- Faint grey orbital paths
- Subtle glow effect
- Distinct radii per ring (family, friends, work, etc.)

### Ring Naming
- User-defined names per ring
- Visible when in SYSTEM_VIEW
- Hidden when in CONTACT_FOCUS

---

## 5. Reference Video Analysis

| Time | State | Visual | User Action |
|------|-------|--------|-------------|
| 0:00-0:02 | SYSTEM_VIEW | Full solar system, sun at center, planets on rings | User taps Saturn |
| 0:03-0:05 | Zoom In | Smooth ease-in flight, Saturn fills screen, rings visible, strong shadow | User taps Saturn again |
| 0:05-0:06 | Zoom Out | Camera reverses path to SYSTEM_VIEW | User taps Mars |
| 0:06-0:08 | Zoom In | Fast smooth transition to Mars, rusty orange with polar ice cap | User taps Mars again |
| 0:09-0:10 | Zoom Out | Return to SYSTEM_VIEW | User taps Mercury |
| 0:10-0:13 | Zoom In | Grey cratered sphere like the Moon | User taps Mercury again |
| 0:14-0:16 | Zoom Out | Return to SYSTEM_VIEW | Continues for other planets... |

---

## 6. Implementation Checklist

### Camera System
- [ ] GSAP integration for smooth animations
- [ ] Two-state system (SYSTEM_VIEW / CONTACT_FOCUS)
- [ ] power3.inOut easing on all transitions
- [ ] 1.5s duration for zoom in/out
- [ ] Camera interpolates BOTH position and lookAt

### Lighting
- [ ] Point light at (0,0,0)
- [ ] Near-zero ambient light
- [ ] Strong terminator line on contacts
- [ ] Pitch black shadows

### Contact Spheres
- [ ] Premium photo textures (or don't show)
- [ ] Fills 60% of screen when focused
- [ ] Name label on focus
- [ ] Health glow indicator

### Performance
- [ ] Max 50 visible contacts
- [ ] 24 sphere segments (not 64)
- [ ] Texture caching for photos
- [ ] LOD for distant contacts

---

## GSAP Animation Reference

```javascript
// Zoom to contact
gsap.to(camera.position, {
  x: contact.position.x,
  y: contact.position.y,
  z: contact.position.z + FOCUS_OFFSET,
  duration: 1.5,
  ease: "power3.inOut",
});

gsap.to(controls.target, {
  x: contact.position.x,
  y: contact.position.y,
  z: contact.position.z,
  duration: 1.5,
  ease: "power3.inOut",
});

// Zoom out to system view
gsap.to(camera.position, {
  x: 0,
  y: 0,
  z: SYSTEM_VIEW_DISTANCE,
  duration: 1.5,
  ease: "power3.inOut",
});

gsap.to(controls.target, {
  x: 0,
  y: 0,
  z: 0,
  duration: 1.5,
  ease: "power3.inOut",
});
```
