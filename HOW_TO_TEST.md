# 🧪 HOW TO TEST - Visual Feedback Widget Development Guide

## 🏗️ Project Architecture

This project simulates a **third-party website integration** where:

```
Source Code (src/) 
    ↓ webpack build
Distribution Files (dist/)
    ↓ loaded by
Third-party Website (examples/cdn-test.html)
```

The test page acts like a real website loading your widget from a CDN.

## 🚀 Quick Start (Every Development Session)

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Development Files
```bash
npm run build:dev
```
**⚠️ CRITICAL**: The test page loads `/dist/visual-feedback-widget.js` and `/dist/visual-feedback-widget.css` (development versions), NOT the minified ones.

### 3. Start Test Server
```bash
npm run serve
```
This starts the server on `http://localhost:8080`

### 4. Open Test Page
```
http://localhost:8080/examples/cdn-test.html
```

### 5. Verify Widget Loads
You should see:
- ✅ "Widget loaded successfully!" status
- ✅ All widget methods available in the log
- ✅ Green status indicators

## 🔧 Development Workflow

### Making Changes
1. **Edit source files** in `src/` (e.g., `src/components/screenshot-capture.js`)
2. **Rebuild** with `npm run build:dev`
3. **Refresh browser** to see changes

### Hot Reloading (Optional)
For automatic rebuilds, also run:
```bash
npm run dev
```
This starts webpack dev server on port 3000 (different from test server).

## 📁 Key Files

### Test Files
- `examples/cdn-test.html` - Main test page (simulates third-party website)
- `test-server.js` - Serves files on port 8080

### Built Files (Generated)
- `dist/visual-feedback-widget.js` - Development build (unminified)
- `dist/visual-feedback-widget.css` - Development styles
- `dist/visual-feedback-widget.min.js` - Production build (minified)
- `dist/visual-feedback-widget.min.css` - Production styles

### Source Files
- `src/visual-feedback-widget.js` - Main entry point
- `src/components/` - Individual components
- `src/styles/` - SCSS stylesheets

## 🐛 Common Issues & Solutions

### Issue: "VisualFeedbackWidget is not available"
**Cause**: Development files don't exist
**Solution**: 
```bash
npm run build:dev
```

### Issue: Port 8080 in use
**Cause**: Another process using port 8080
**Solution**: 
- Kill other processes on port 8080, OR
- Change port in `test-server.js`

### Issue: Webpack dev server fails with EADDRINUSE
**Cause**: Test server already using port 8080
**Solution**: Webpack dev server is configured for port 3000 - this is intentional

### Issue: Changes not appearing
**Cause**: Browser cache or build not updated
**Solution**: 
1. Run `npm run build:dev`
2. Hard refresh browser (Ctrl+F5)

## 🧪 Testing Features

### Test Page Features
The `cdn-test.html` page includes:

1. **Status Indicators**
   - Widget load status
   - Method availability check
   - Debug console log

2. **Test Buttons**
   - 🚀 Initialize Widget
   - 📸 Show Widget
   - 🖼️ Test Screenshot
   - 🎥 Test Recording  
   - 💻 Test System Info
   - 🗑️ Clear Log

3. **Sample Content**
   - Forms and data for screenshot testing
   - Visual elements to interact with

### Testing Checklist
- [ ] Widget loads without errors
- [ ] Initialize Widget button works
- [ ] Modal shows/hides correctly
- [ ] Screenshot capture works
- [ ] Drawing tools function
- [ ] Screen recording works
- [ ] System info collection works
- [ ] Console logging captures errors
- [ ] Responsive design on different screen sizes

## 🔄 Build Commands Reference

```bash
# Development build (unminified, with source maps)
npm run build:dev

# Production build (minified)
npm run build

# Development server with hot reload (port 3000)
npm run dev

# Test server (port 8080)
npm run serve

# Watch mode (rebuilds on changes)
npm run watch

# Clean dist folder
npm run clean
```

## 🌐 URLs Reference

- **Test Page**: http://localhost:8080/examples/cdn-test.html
- **Widget JS**: http://localhost:8080/dist/visual-feedback-widget.js
- **Widget CSS**: http://localhost:8080/dist/visual-feedback-widget.css
- **Dev Server** (if running): http://localhost:3000

## 📝 Development Notes

### Current Work
Check `git status` for uncommitted changes:
- Likely working on `src/components/screenshot-capture.js`
- And related styles in `src/styles/components/screenshot-capture.scss`

### Architecture Goals
- **Modular**: Component-based architecture
- **CDN Ready**: Distributable as single JS/CSS files
- **Framework Agnostic**: Works with any website
- **Clean API**: Simple initialization and configuration

## 🚨 Critical Reminders

1. **Always build before testing**: `npm run build:dev`
2. **Test page simulates real integration**: Don't modify it for convenience
3. **Check browser console**: Errors show up there
4. **Hard refresh**: Use Ctrl+F5 when changes don't appear
5. **Both servers needed**: Test server (8080) serves files, dev server (3000) for hot reload

## 🎯 Success Criteria

When everything is working correctly:
- No console errors in browser
- Widget initializes successfully
- All interactive features work
- Responsive across different screen sizes
- Clean code structure maintained

---

**Happy Testing! 🚀**

*This guide ensures consistent development setup for the Visual Feedback Widget project.*