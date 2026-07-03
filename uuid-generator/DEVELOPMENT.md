# UUID Generator - Development Guide

Guide for developers working on UUID Generator codebase.

## 🛠️ Local Development Setup

### Prerequisites

- Node.js 14+ (optional, for tooling)
- Python 3.x (for local server)
- Git
- Code editor (VS Code recommended)

### Quick Start

```bash
# Clone repository
git clone https://github.com/<username>/uuid-generator.git
cd uuid-generator

# Start local server
python3 -m http.server 8000

# Open browser
# http://localhost:8000
```

## 📁 Project Structure

```
uuid-generator/
├── index.html              # Main HTML (844 lines)
│   ├── Meta tags (SEO, OG, structured data)
│   ├── Inlined CSS styles
│   └── Script reference to app.js
├── assets/
│   ├── js/
│   │   └── app.js         # Main app logic (525 lines)
│   │       ├── UUIDGenerator class
│   │       ├── v1/v4/v5/v7 generation
│   │       ├── Validation
│   │       └── Export functions
│   └── css/
│       └── styles.css     # Modular CSS (744 lines, for reference)
├── robots.txt              # SEO crawler directives
├── sitemap.xml             # URL map for crawlers
├── package.json            # Node.js config (optional tooling)
├── README.md               # User documentation
├── DEPLOYMENT.md           # Deployment instructions
├── DEVELOPMENT.md          # This file
└── .gitignore              # Git configuration
```

## 🔧 Code Architecture

### UUIDGenerator Class (app.js)

```javascript
class UUIDGenerator {
  // Core Methods
  generateV1()      // Time-based UUID
  generateV4()      // Random UUID
  generateV5()      // Name-based SHA-1 UUID
  generateV7()      // Time-based sortable UUID
  
  // Utility Methods
  formatUUID()      // Apply separator formatting
  validateUUID()    // Validate UUID format
  detectVersion()   // Detect UUID version
  
  // UI Methods
  renderResults()   // Display generated UUIDs
  renderHistory()   // Display history list
  validate()        // Validate input and show results
  
  // Export Methods
  downloadJSON()    // Export as JSON
  downloadCSV()     // Export as CSV
  downloadText()    // Export as plain text
  
  // Storage Methods
  addToHistory()    // Add to localStorage
  loadHistory()     // Load from localStorage
  saveHistory()     // Persist to localStorage
  clearHistory()    // Clear all history
  
  // Theme Methods
  toggleTheme()     // Switch dark/light mode
}
```

### Global Functions (for HTML onclick handlers)

```javascript
// Generation
generateUUIDs()       // Main generation entry point

// Validation
validateUUID()        // Validation entry point

// Export
showDownloadOptions() // Show modal
closeDownloadModal()  // Close modal
downloadJSON()
downloadCSV()
downloadText()

// UI
switchTab(tabName)    // Tab switching
clearHistory()        // Clear history with confirmation

// History
copyAllUUIDs()        // Batch copy
```

## 🔐 Key Implementation Details

### UUID v1: Time-Based

```javascript
// Uses current timestamp + random bytes
// Simulates MAC address with random 8 bytes
// Format: time_hi_and_version-time_mid-time_lo_and_version-clock_seq-node

const now = Date.now();
const rand = crypto.getRandomValues(new Uint8Array(8));
// ... combine with version/variant bits ...
```

### UUID v4: Random

```javascript
// Pure random generation using crypto.getRandomValues()
// 16 random bytes with version 4 and variant bits set
// Very fast, no network calls, 128 bits of randomness

const bytes = crypto.getRandomValues(new Uint8Array(16));
bytes[6] = (bytes[6] & 0x0f) | 0x40;  // version 4
bytes[8] = (bytes[8] & 0x3f) | 0x80;  // variant
```

### UUID v5: Name-Based SHA-1

```javascript
// Deterministic: same namespace + name = same UUID
// Uses Web Crypto API for SHA-1 hashing
// Namespace options: DNS, URL, OID, X.500 DN

const hashBuffer = await crypto.subtle.digest('SHA-1', combined);
hashArray[6] = (hashArray[6] & 0x0f) | 0x50;  // version 5
hashArray[8] = (hashArray[8] & 0x3f) | 0x80;  // variant
```

### UUID v7: Time-Based Sortable

```javascript
// Modern, sortable UUIDs based on Unix epoch timestamp
// 48-bit timestamp (ms) + 4-bit version + random bits
// Sortable chronologically, faster than v1

const timestamp = [
  (now >>> 40) & 0xff,
  // ... extract 48 bits of timestamp ...
];
```

### Validation Algorithm

```javascript
// Regex pattern: standard UUID format
const uuidRegex = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

// Version detection: read 4th byte's first nibble
const versionNibble = parseInt(clean[12], 16);

// Variant detection: read MSB of 9th byte
const variantBits = parseInt(clean[16], 16).toString(2).slice(0, 2);
```

## 🎨 Styling System

### CSS Organization

**index.html `<style>` section contains:**

1. **CSS Variables** (dark mode support)
   ```css
   :root {
     --primary-color: #3b82f6;
     --dark-bg: #1f2937;
     /* ... etc ... */
   }
   ```

2. **Global Styles**
   - Reset (margin, padding, box-sizing)
   - Base typography
   - Utility classes

3. **Component Styles**
   - Cards
   - Buttons (primary, secondary, success, danger)
   - Form elements
   - Tabs
   - Alerts

4. **Dark Mode**
   - `body.dark-mode` selector
   - CSS variable overrides
   - Smooth transitions

5. **Responsive Design**
   - Mobile-first approach
   - Breakpoints: 768px, 480px
   - Touch-friendly tap targets (44px minimum)

6. **Accessibility**
   - WCAG AA color contrast
   - Focus indicators
   - Keyboard navigation

### Modifying Styles

**For development**, edit `assets/css/styles.css` separately, then copy to `index.html`.

**Production**: CSS is inlined in `index.html` for faster load times (no render-blocking resource).

## 🔄 Data Flow

```
User Input
    ↓
Event Handler (onclick, oninput)
    ↓
UUIDGenerator Method (e.g., generate())
    ↓
Generate UUIDs / Validate / Export
    ↓
Update DOM (renderResults, showAlert)
    ↓
Update localStorage (addToHistory)
    ↓
Visual Feedback (animations, copy feedback)
```

## 💾 Storage

### localStorage Keys

```javascript
'theme'        // 'light' or 'dark'
'uuidHistory'  // JSON array of {uuid, timestamp}
```

### Data Persistence

```javascript
// Saving
localStorage.setItem('uuidHistory', JSON.stringify(this.history));

// Loading
const stored = localStorage.getItem('uuidHistory');
this.history = stored ? JSON.parse(stored) : [];
```

## 🧪 Testing

### Manual Test Cases

#### Generation

- [ ] v1: Generate single, verify format
- [ ] v1: Generate 100, verify all unique
- [ ] v4: Generate bulk (500), no duplicates
- [ ] v5: Same namespace+name = same UUID (determinism)
- [ ] v5: Different names = different UUIDs
- [ ] v7: Newer UUIDs have higher values (sortable)
- [ ] Separator: Test dashes, braces, none

#### Validation

- [ ] Valid v1 UUID: passes validation
- [ ] Valid v4 UUID: passes, detected as v4
- [ ] Valid v5 UUID: passes, detected as v5
- [ ] Invalid format: fails gracefully
- [ ] Empty input: no error
- [ ] Malformed: clear error message

#### Export

- [ ] JSON: valid JSON, readable
- [ ] CSV: proper format with header
- [ ] TXT: newline-separated
- [ ] Filename: correct naming
- [ ] Open file: no corruption

#### UI/UX

- [ ] Dark mode: toggle works, persists
- [ ] Tabs: switch between validator/history
- [ ] Copy: feedback appears, disappears
- [ ] History: appears after generation
- [ ] Clear history: requires confirmation
- [ ] Mobile: responsive on 320px
- [ ] Keyboard: Tab/Enter navigation works
- [ ] Screen reader: readable labels

### Automated Testing (Optional)

Create `tests/uuid-generator.test.js`:

```javascript
describe('UUIDGenerator', () => {
  let app;

  beforeEach(() => {
    app = new UUIDGenerator();
  });

  test('generateV4 returns valid v4 UUID', () => {
    const uuid = app.generateV4();
    expect(app.validateUUID(uuid)).toBe(true);
    expect(app.detectVersion(uuid)).toContain('v4');
  });

  test('validateUUID rejects invalid format', () => {
    expect(app.validateUUID('invalid-uuid')).toBe(false);
  });

  test('generateV5 is deterministic', async () => {
    const uuid1 = await app.generateV5('dns', 'example.com');
    const uuid2 = await app.generateV5('dns', 'example.com');
    expect(uuid1).toBe(uuid2);
  });

  // ... more tests ...
});
```

Run tests:
```bash
npm test
```

## 🚀 Performance Optimization Tips

### Current Performance

- **Bundle Size**: 44 KB gzipped
- **Load Time**: <1 second
- **Lighthouse**: 95+ score

### Potential Improvements

1. **Code Splitting** (if needed for larger projects)
2. **Lazy Loading** (not needed for this single-page app)
3. **Service Workers** (PWA offline support)
4. **Image Optimization** (if OG image added)

### Monitoring

```bash
# Run Lighthouse
lighthouse http://localhost:8000

# Profile in Chrome DevTools
# Open DevTools → Performance → Record → Generate UUIDs
```

## 🐛 Debugging

### Browser DevTools

1. **Console**: Check for JavaScript errors
   ```javascript
   app.generateV4()  // Test in console
   ```

2. **Elements**: Inspect DOM structure
3. **Network**: Monitor HTTP requests (should be zero)
4. **Storage**: View localStorage contents
   ```javascript
   localStorage.getItem('uuidHistory')
   ```

5. **Performance**: Profile generation speed

### Common Issues

**Issue**: UUIDs not copying
- Check browser clipboard permissions
- Test on HTTPS (clipboard API requires secure context)
- Check browser console for errors

**Issue**: History not persisting
- Check browser localStorage quota
- Verify JSON serialization works
- Check browser's private mode (disables localStorage)

**Issue**: Dark mode not working
- Verify `dark-mode` class on body
- Check CSS variable fallbacks
- Clear browser cache

## 📦 Dependencies

**Zero NPM dependencies** in production:

- ✅ No frameworks (vanilla JS)
- ✅ No crypto libraries (uses native Web Crypto API)
- ✅ No build tools required
- ✅ No CDN dependencies

**Optional Dev Dependencies** (in package.json):

```json
{
  "devDependencies": {
    "http-server": "^14.1.1",    // Local testing
    "eslint": "^8.44.0",          // Code linting
    "jest": "^29.5.0"             // Unit testing
  }
}
```

## 🔄 Update Workflow

1. Create feature branch
   ```bash
   git checkout -b feature/new-uuid-version
   ```

2. Make changes
   ```bash
   # Edit files...
   # Test locally with http://localhost:8000
   ```

3. Commit changes
   ```bash
   git add .
   git commit -m "feat: add new UUID version"
   ```

4. Push to GitHub
   ```bash
   git push origin feature/new-uuid-version
   ```

5. Create Pull Request
6. Merge to main (triggers auto-deployment to Vercel)

## 📚 Resources

### UUID Standards

- **RFC 4122**: UUID specification (official)
- **Draft RFC 9562**: UUID v6, v7 (modern standards)
- **UUID Versions Explained**: https://www.uuidgenerator.net/

### Web APIs Used

- **crypto.getRandomValues()**: Random number generation
- **crypto.subtle.digest()**: SHA-1 hashing (v5)
- **localStorage**: Persistent storage
- **navigator.clipboard**: Copy to clipboard
- **TextEncoder**: String to UTF-8 conversion

### Tools

- **VS Code Extensions**:
  - ES7+ React/Redux/React-Native snippets
  - Prettier (code formatter)
  - ESLint (code quality)

- **Browser Tools**:
  - Chrome DevTools
  - Firefox Developer Tools
  - Safari Web Inspector

## 🎓 Learning Path

1. Read RFC 4122 (understanding UUID)
2. Understand cryptography basics
3. Study Web Crypto API documentation
4. Examine app.js code structure
5. Modify features (add separators, formats)
6. Add unit tests
7. Optimize performance
8. Deploy to production

## 📝 Code Style

### JavaScript Conventions

- **Variables**: camelCase
- **Classes**: PascalCase
- **Constants**: UPPER_SNAKE_CASE
- **Private methods**: `_methodName()`
- **Comments**: Explain "why", not "what"

### Example:

```javascript
class UUIDGenerator {
  constructor() {
    this.generatedUUIDs = [];
    this._maxHistorySize = 50;  // Private constant
  }

  // Generates a v4 UUID
  generateV4() {
    // Implementation...
  }

  // Private utility
  _padHex(num, length) {
    return num.toString(16).padStart(length, '0');
  }
}
```

## ✅ Checklist for Contributing

Before submitting changes:

- [ ] Code follows style guide
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No console errors/warnings
- [ ] Accessibility maintained (WCAG AA)
- [ ] Mobile responsiveness preserved
- [ ] Performance acceptable
- [ ] Dark mode works
- [ ] Lighthouse score 85+

---

Happy coding! 🎉
