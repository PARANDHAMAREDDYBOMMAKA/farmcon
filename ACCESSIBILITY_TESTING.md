# Accessibility Testing & Troubleshooting

## 🧪 How to Test on Your Mac

### Step 1: Start the Development Server
```bash
npm run dev
```

### Step 2: Open the Test Page
Go to: **http://localhost:3000/accessibility-test**

### Step 3: Check Platform Detection
You should see:
- **Detected Platform:** `mac`
- **Modifier Key:** `Cmd`

If you see anything different, there's an issue with detection.

### Step 4: Test Keyboard Shortcuts
Try pressing these combinations on your Mac:

| Shortcut | Expected Action |
|----------|----------------|
| **Cmd+H** | Go to home (⚠️ might minimize window on Mac) |
| **Cmd+D** | Go to dashboard |
| **Cmd+S** | Focus search (⚠️ might try to save page) |
| **Cmd+M** | Skip to main content |
| **Cmd+/** | Show all shortcuts |

⚠️ **Mac System Conflicts:**
Some Cmd shortcuts are used by macOS:
- `Cmd+H` - Hide window (system)
- `Cmd+S` - Save (browser)

These might not work as expected. This is **normal** on Mac!

### Step 5: Check Browser Console
1. Press **Cmd+Option+I** to open Developer Tools
2. Go to the **Console** tab
3. Press any keyboard shortcut
4. You should see debug logs showing what was detected

---

## 🔧 Troubleshooting

### Issue: "Detected Platform: unknown"
**Fix:**
1. Open browser console (Cmd+Option+I)
2. Type: `debugAccessibility()` and press Enter
3. Check the User Agent string
4. Take a screenshot and report the issue

### Issue: "Shortcuts not working on Mac"
**Possible causes:**

1. **System shortcuts are interfering**
   - `Cmd+H` hides windows on Mac (this is normal)
   - `Cmd+S` triggers Save dialog (this is normal)
   - Solution: Use other shortcuts like `Cmd+D`, `Cmd+M`

2. **Keyboard shortcuts are disabled**
   - Click the accessibility button (bottom-right)
   - Make sure "Keyboard Shortcuts" toggle is ON

3. **Browser is blocking shortcuts**
   - Try in a different browser (Chrome, Safari, Firefox)
   - Some extensions might block shortcuts

4. **You're typing in an input field**
   - Shortcuts are disabled when typing
   - Click outside any input/textarea first

### Issue: "Shows 'Cmd' but shortcuts use Alt instead"
This means the key detection is working but registration isn't. Check:
1. Is the page fully loaded?
2. Check browser console for errors
3. Try refreshing the page

---

## 🧑‍💻 Debug Commands

Open browser console and try these:

### Check Platform Detection
```javascript
debugAccessibility()
```

This will show:
- Detected platform
- User agent
- All detection tests

### Check If Shortcuts Are Registered
```javascript
keyboardNav.getShortcuts()
```

Should show all registered shortcuts.

### Test Screen Reader Announcement
```javascript
screenReaderAnnouncer.announce('Testing 1-2-3', 'polite')
```

If you have VoiceOver on, you should hear this.

---

## 🍎 macOS-Specific Testing

### VoiceOver Testing
1. **Enable VoiceOver:** Press **Cmd+F5**
2. Navigate the test page
3. VoiceOver should announce all elements
4. Test form fields - should announce labels and errors

### Keyboard Navigation (without shortcuts)
Try standard navigation:
- **Tab** - Move between elements
- **Shift+Tab** - Move backwards
- **Space** - Activate buttons/checkboxes
- **Enter** - Activate links/buttons
- **Escape** - Close modals

### Safari-Specific
Safari has unique keyboard behavior:
1. Go to **Safari → Settings → Advanced**
2. Enable "Press Tab to highlight each item on a webpage"
3. Now Tab should work for all interactive elements

---

## 🪟 Windows Testing

If you have access to a Windows machine:

### Expected Behavior
- **Detected Platform:** `windows`
- **Modifier Key:** `Alt`
- **Shortcuts:** Alt+H, Alt+D, Alt+S, Alt+M

### NVDA Screen Reader (Free)
1. Download from: https://www.nvaccess.org/
2. Install and start NVDA
3. Navigate to http://localhost:3000/accessibility-test
4. NVDA should read all content

---

## 🐧 Linux Testing

### Expected Behavior
- **Detected Platform:** `linux`
- **Modifier Key:** `Alt`
- **Shortcuts:** Same as Windows (Alt+H, etc.)

### Orca Screen Reader
1. Enable in **Settings → Accessibility → Screen Reader**
2. Test the accessibility page
3. Should announce all elements

---

## 📱 Mobile Testing

### iOS (Safari)
1. **Detected Platform:** `ios`
2. **Modifier Key:** `Cmd` (if external keyboard connected)
3. **Touch Targets:** Should be minimum 48px

**VoiceOver:**
1. Settings → Accessibility → VoiceOver → On
2. Swipe right/left to navigate
3. Double-tap to activate

### Android (Chrome)
1. **Detected Platform:** `android`
2. **Modifier Key:** `Ctrl`
3. **Touch Targets:** Minimum 48px

**TalkBack:**
1. Settings → Accessibility → TalkBack → On
2. Swipe right/left to navigate
3. Double-tap to activate

---

## ✅ What Should Work

### On All Platforms ✅
- Platform detection
- Screen reader announcements
- Focus management
- High contrast mode
- Reduced motion
- Font size adjustment
- Keyboard navigation (Tab, Enter, Escape)

### Platform-Specific ✅
- **Mac:** Cmd-based shortcuts (where not conflicting with system)
- **Windows:** Alt-based shortcuts
- **Linux:** Alt-based shortcuts
- **iOS/Android:** Touch gestures, screen readers

---

## 🚨 Known Limitations

### macOS Shortcuts
Some shortcuts conflict with system:
- ❌ `Cmd+H` - Hides window (macOS system)
- ❌ `Cmd+S` - Save page (browser)
- ❌ `Cmd+W` - Close tab (browser)
- ✅ `Cmd+D` - Works!
- ✅ `Cmd+M` - Works!
- ⚠️ `Cmd+/` - May work depending on app

**Solution:** We can't override system shortcuts. This is by design for user safety.

### Browser Shortcuts
Browsers reserve certain shortcuts:
- `Ctrl+T` / `Cmd+T` - New tab
- `Ctrl+W` / `Cmd+W` - Close tab
- `Ctrl+R` / `Cmd+R` - Reload

---

## 📊 Success Criteria

Your accessibility is working correctly if:

1. ✅ Platform is detected correctly (mac, windows, linux, ios, android)
2. ✅ Modifier key shows correctly (Cmd on Mac, Alt on others)
3. ✅ At least ONE shortcut works (try Cmd+D on Mac)
4. ✅ Tab navigation works
5. ✅ Screen reader test announces message
6. ✅ Accessibility panel opens (bottom-right button)
7. ✅ Settings persist after page refresh

---

## 🆘 Still Not Working?

If accessibility features still don't work on your Mac:

### Quick Diagnostic
1. Go to http://localhost:3000/accessibility-test
2. Take a screenshot of the "Platform Detection" section
3. Open browser console (Cmd+Option+I)
4. Type `debugAccessibility()` and press Enter
5. Take a screenshot of the console output

### Report Issue With:
- Operating System version (e.g., macOS Sonoma 14.1)
- Browser and version (e.g., Chrome 120)
- Screenshot of test page
- Screenshot of console
- What you expected vs what happened

---

## 💡 Alternative Testing

If keyboard shortcuts don't work due to system conflicts:

### Test Other Accessibility Features Instead:
1. **Click** the accessibility button (bottom-right) ✅
2. **Toggle** high contrast mode ✅
3. **Change** font size ✅
4. **Enable** reduced motion ✅
5. **Use** Tab key to navigate ✅
6. **Test** screen reader announcements ✅

All these should work perfectly regardless of keyboard shortcut conflicts!

---

## 📝 Next Steps

If testing shows issues:
1. Document exactly what's not working
2. Provide platform details
3. Share browser console errors
4. We'll create targeted fixes

The core accessibility features (screen readers, Tab navigation, ARIA labels, focus management) should work on ALL platforms. Keyboard shortcuts are a bonus feature that may have platform-specific limitations.
