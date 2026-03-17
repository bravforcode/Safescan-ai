# SafeScan Animation System Guide

## Overview
This guide documents all the smooth animations and transitions added to the SafeScan application.

## Available Animation Classes

### Entry Animations
- `animate-fadeUp` - Fade in with upward motion (0.45s)
- `animate-fadeIn` - Simple fade in (0.3s)
- `animate-scaleIn` - Scale up with fade (0.35s, bouncy)
- `animate-slideUp` - Slide up from bottom (0.4s)
- `animate-slideDown` - Slide down from top (0.3s)
- `animate-slideInRight` - Slide in from right (0.4s)
- `animate-slideInLeft` - Slide in from left (0.4s)
- `animate-popIn` - Pop in with bounce (0.5s, bouncy)
- `animate-bounceIn` - Bounce in effect (0.6s, bouncy)
- `animate-listItem` - List item entry animation (0.4s)

### Continuous Animations
- `animate-float` - Gentle floating motion (3s infinite)
- `animate-beat` - Pulse/beat effect (0.8s infinite)
- `animate-rotate` - Continuous rotation (2s infinite)
- `animate-glowPulse` - Glowing pulse effect (2s infinite)
- `animate-shimmer` - Shimmer loading effect (1.4s infinite)
- `animate-gradientShift` - Animated gradient background (4s infinite)

### Interaction Animations
- `animate-shake` - Shake effect (0.5s)
- `animate-wiggle` - Wiggle/rotate effect (0.5s)

### Animation Delays
Use delay classes to stagger animations:
- `delay-50` through `delay-1000` (50ms increments)

Example:
```jsx
<div className="animate-fadeUp delay-100">Content</div>
```

## Component Classes

### Cards
- `card` - Base card with smooth transitions
- `card-interactive` - Interactive card with hover lift
- `card-lift` - Card with enhanced hover effect
- `card-stack` - Card with stack hover effect

### Buttons
- `btn-primary` - Primary button with hover shadow
- `btn-outline` - Outline button with hover effects
- `btn-ghost` - Ghost button with subtle hover

### Interaction Effects
- `press-effect` - Scale down on press (0.95)
- `press-sm` - Subtle press effect (0.97)
- `lift-on-hover` - Lift up on hover
- `smooth-hover` - Smooth hover transition
- `scale-hover` - Scale up on hover (1.05)
- `glow-hover` - Glow shadow on hover

### Form Elements
- `input-field` - Input with smooth focus transitions
- `chip` - Chip/tag with hover scale

## Usage Examples

### Staggered List Animation
```jsx
{items.map((item, i) => (
  <div 
    key={item.id}
    className="animate-fadeUp"
    style={{ animationDelay: `${i * 60}ms` }}
  >
    {item.content}
  </div>
))}
```

### Interactive Card
```jsx
<div className="card-interactive group">
  <img className="transition-transform duration-300 group-hover:scale-110" />
  <h3 className="transition-colors duration-200 group-hover:text-primary-600">
    Title
  </h3>
</div>
```

### Loading Skeleton
```jsx
<div className="skeleton w-full h-24 rounded-xl" />
```

### Notification Badge
```jsx
<span className="notification-dot w-2 h-2 bg-red-400 rounded-full" />
```

## Transition Durations

### Standard Durations
- Fast: 100-150ms (press effects, quick feedback)
- Normal: 200-300ms (hover states, color changes)
- Slow: 300-400ms (layout changes, complex animations)

### Easing Functions
- `ease-out` - Natural deceleration
- `ease-in-out` - Smooth start and end
- `cubic-bezier(0.22,1,0.36,1)` - Custom smooth easing
- `cubic-bezier(0.34,1.56,0.64,1)` - Bouncy easing

## Accessibility

All animations respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Performance Tips

1. Use `transform` and `opacity` for animations (GPU accelerated)
2. Avoid animating `width`, `height`, `top`, `left` (causes reflow)
3. Use `will-change` sparingly for complex animations
4. Lazy load heavy animations with `Suspense`
5. Use `loading="lazy"` for images

## Custom Animations

To add custom animations:

1. Define keyframes in `index.css`:
```css
@keyframes myAnimation {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

2. Add utility class:
```css
.animate-myAnimation {
  animation: myAnimation 0.3s ease-out both;
}
```

3. Use in components:
```jsx
<div className="animate-myAnimation">Content</div>
```

## Browser Support

All animations are supported in:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android)

## Debugging Supabase Errors

The app now gracefully handles missing Supabase tables:

### Fixed Issues
1. **404 Errors**: Table not found - now returns empty array with warning
2. **401 Errors**: Permission denied - now returns empty array with warning
3. **Realtime Subscriptions**: Gracefully fails if table doesn't exist

### Error Handling
```typescript
// Supabase queries now silently fail for missing tables
const data = await safescanSelect('safety_alerts'); // Returns [] if table missing
```

### Console Messages
In development mode, you'll see warnings instead of errors:
```
Supabase table 'safety_alerts' not accessible (404). Using fallback data.
```

This allows the app to function even when the database schema is incomplete.
