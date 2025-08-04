# Widget Examples

This directory contains examples of how to use the Visual Feedback Widget.

## Quick Setup

1. **Copy the configuration template:**
   ```bash
   cp config.example.js config.js
   ```

2. **Update your configuration:**
   Open `config.js` and update the values:
   ```javascript
   window.WIDGET_CONFIG = {
     apiUrl: 'https://your-api-endpoint.com/api',  // Your actual API URL
     projectId: 'your-project-id',                 // Your actual project ID
     debugMode: false,                             // Set to true for debugging
     position: 'bottom-right',                     // Widget position
     theme: 'modern'                               // Widget theme
   };
   ```

3. **Build the widget:**
   ```bash
   cd ../
   npm run build:dev
   ```

4. **Open the example:**
   ```bash
   npm run serve
   ```
   
   Then visit: `http://localhost:8080/examples/cdn-test.html`

## Files

- **`config.example.js`** - Configuration template (committed to git)
- **`config.js`** - Your actual configuration (ignored by git)
- **`cdn-test.html`** - Main widget example and test page

## Notes

- The `config.js` file is ignored by git for security
- Always use the `config.example.js` as a template
- Never commit your actual API keys or URLs to the repository