# Visual Feedback Widget

A comprehensive, modular visual feedback widget that enables users to capture screenshots, record screen interactions, and submit detailed bug reports with automatic system information collection.

## ✨ Features

- 📸 **Screenshot Capture** - Take high-quality screenshots with annotation tools
- 🎥 **Screen Recording** - Record user interactions with step-by-step tracking
- 🎨 **Drawing Tools** - Annotate screenshots with rectangles, arrows, and freehand drawing
- 💬 **Chat Interface** - User-friendly messaging system for feedback submission
- 🔍 **System Information** - Automatic collection of browser, device, and network data
- 📝 **Console Logging** - Capture JavaScript console logs and network requests
- 🌐 **Cross-Platform** - Works across all modern browsers and devices
- 🎯 **Modular Architecture** - Clean, maintainable component-based structure
- 🚀 **CDN Ready** - Easy integration with single JS/CSS files

## 🚀 Quick Start

### CDN Installation (Recommended)

Add the widget to your website with two simple lines:

```html
<link rel="stylesheet" href="https://cdn.your-domain.com/visual-feedback-widget/latest/visual-feedback-widget.min.css">
<script src="https://cdn.your-domain.com/visual-feedback-widget/latest/visual-feedback-widget.min.js"></script>
```

### Basic Usage

```javascript
// Initialize the widget
const widget = new VisualFeedbackWidget({
  apiEndpoint: '/api/feedback',
  position: 'bottom-right',
  theme: 'default'
});

// Widget is ready to use!
```

### Advanced Configuration

```javascript
const widget = new VisualFeedbackWidget({
  // API Configuration
  apiEndpoint: '/api/feedback',
  apiKey: 'your-api-key',
  
  // Appearance
  theme: 'default', // 'default', 'dark', 'light', 'minimal'
  position: 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
  triggerButtonText: 'Send Feedback',
  
  // Features
  enableScreenshots: true,
  enableScreenRecording: true,
  enableConsoleLogging: true,
  enableNetworkLogging: true,
  enableSystemInfo: true,
  
  // Callbacks
  onOpen: () => console.log('Widget opened'),
  onClose: () => console.log('Widget closed'),
  onSubmit: (data) => console.log('Feedback submitted:', data),
  onError: (error) => console.error('Widget error:', error),
  
  // Advanced Options
  debugMode: false,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  language: 'en'
});
```

## 📁 Architecture

The widget follows a modular component-based architecture:

```
src/
├── components/
│   ├── visual-feedback-modal.js      # Main modal orchestrator
│   ├── screenshot-capture.js         # Screenshot and annotation handling
│   ├── step-replication.js           # Screen recording and interaction tracking
│   ├── chat-interface.js             # Messaging UI component
│   ├── system-info.js                # System information collection
│   └── console-logger.js             # Console and network logging
├── styles/
│   ├── components/
│   │   ├── visual-feedback-modal.scss
│   │   ├── screenshot-capture.scss
│   │   └── chat-interface.scss
│   └── main.scss                     # Main stylesheet
└── visual-feedback-widget.js         # Public API entry point
```

## 🎛️ API Reference

### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiEndpoint` | string | '/api/feedback' | API endpoint for feedback submission |
| `apiKey` | string | null | Optional API key for authentication |
| `theme` | string | 'default' | Widget theme ('default', 'dark', 'light', 'minimal') |
| `position` | string | 'bottom-right' | Position of trigger button |
| `enableScreenshots` | boolean | true | Enable screenshot capture |
| `enableScreenRecording` | boolean | true | Enable screen recording |
| `enableConsoleLogging` | boolean | true | Enable console log capture |
| `enableNetworkLogging` | boolean | true | Enable network request logging |
| `debugMode` | boolean | false | Enable debug logging |

### Methods

#### `open()`
Opens the feedback modal.

```javascript
widget.open();
```

#### `close()`
Closes the feedback modal.

```javascript
widget.close();
```

#### `toggle()`
Toggles the modal open/closed state.

```javascript
widget.toggle();
```

#### `updateConfig(newConfig)`
Updates widget configuration.

```javascript
widget.updateConfig({
  theme: 'dark',
  enableRecording: false
});
```

#### `getStatus()`
Returns current widget status.

```javascript
const status = widget.getStatus();
console.log(status);
// {
//   initialized: true,
//   destroyed: false,
//   modalOpen: false,
//   version: '1.0.0',
//   config: {...}
// }
```

#### `destroy()`
Destroys the widget and cleans up resources.

```javascript
widget.destroy();
```

### Events

The widget supports several callback events:

```javascript
const widget = new VisualFeedbackWidget({
  onOpen: () => {
    console.log('Modal opened');
  },
  
  onClose: () => {
    console.log('Modal closed');
  },
  
  onSubmit: (feedbackData) => {
    console.log('Feedback submitted:', feedbackData);
    // feedbackData contains:
    // - screenshot (base64)
    // - annotations
    // - messages
    // - systemInfo
    // - consoleLogs
    // - networkLogs
    // - recording (if enabled)
  },
  
  onError: (error) => {
    console.error('Widget error:', error);
  }
});
```

## 🎨 Themes

The widget comes with 4 built-in themes:

- **Default** - Clean, modern blue theme
- **Dark** - Dark mode optimized
- **Light** - Minimal light theme
- **Minimal** - Ultra-clean, minimal design

Custom themes can be created by overriding CSS variables:

```css
.visual-feedback-widget {
  --primary-color: #your-color;
  --background-color: #your-bg;
  --text-color: #your-text;
}
```

## 🔧 Development

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Project Structure

```
visual-feedback-widget/
├── src/                    # Source code
├── dist/                   # Built files
├── examples/               # Example implementations
├── webpack.config.js       # Build configuration
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

### Building

The build process creates optimized, minified files ready for CDN distribution:

```bash
npm run build
```

Output:
- `dist/visual-feedback-widget.min.js` - Minified JavaScript
- `dist/visual-feedback-widget.min.css` - Minified CSS
- `dist/visual-feedback-widget.js` - Development JavaScript
- `dist/visual-feedback-widget.css` - Development CSS

## 📱 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- iOS Safari 11+
- Chrome for Android 60+

## 🔒 Security

The widget is designed with security in mind:

- No external dependencies in production build
- Sanitized user inputs
- CORS-compliant API requests
- No sensitive data collection
- CSP-friendly implementation

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📊 Data Format

When feedback is submitted, the widget sends a comprehensive data object:

```javascript
{
  // User-provided content
  messages: [
    { role: 'user', content: 'Description of the issue', timestamp: '...' },
    { role: 'ai', content: 'AI-generated title', timestamp: '...' }
  ],
  
  // Visual feedback
  screenshot: 'data:image/png;base64,...',
  annotations: [
    { type: 'rectangle', x: 100, y: 100, width: 200, height: 150, color: '#ff0000' }
  ],
  
  // System information
  systemInfo: {
    browser: 'Chrome',
    browserVersion: '118.0.0.0',
    os: 'Windows',
    platform: 'Win32',
    url: 'https://example.com/page',
    timestamp: '2023-10-01T12:00:00.000Z',
    // ... more system details
  },
  
  // Debug information (if enabled)
  consoleLogs: [
    { level: 'error', message: 'Script error', timestamp: 1696161600000 }
  ],
  
  networkLogs: [
    { method: 'GET', url: '/api/data', status: 404, duration: 234 }
  ],
  
  // Recording data (if enabled)
  recording: {
    videoBlob: Blob,
    steps: [
      { type: 'click', element: 'button#submit', timestamp: 1234567890 }
    ]
  }
}
```

## 🚀 Deployment

### CDN Deployment

1. Build the widget:
   ```bash
   npm run build
   ```

2. Upload files to your CDN:
   ```bash
   # Upload to CDN
   aws s3 cp dist/ s3://your-cdn-bucket/visual-feedback-widget/v1.0.0/ --recursive
   aws s3 cp dist/ s3://your-cdn-bucket/visual-feedback-widget/latest/ --recursive
   ```

3. Update your HTML:
   ```html
   <link rel="stylesheet" href="https://your-cdn.com/visual-feedback-widget/latest/visual-feedback-widget.min.css">
   <script src="https://your-cdn.com/visual-feedback-widget/latest/visual-feedback-widget.min.js"></script>
   ```

### NPM Package

The widget can also be distributed as an NPM package:

```bash
# Install from NPM
npm install visual-feedback-widget

# Import in your project
import VisualFeedbackWidget from 'visual-feedback-widget';
```

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📞 Support

- 📖 [Documentation](https://docs.your-domain.com/visual-feedback-widget)
- 🐛 [Bug Reports](https://github.com/your-company/visual-feedback-widget/issues)
- 💬 [Discussions](https://github.com/your-company/visual-feedback-widget/discussions)
- 📧 Email: support@your-domain.com

## 🗺️ Roadmap

### Upcoming Features

- 🌍 Multi-language support
- 📱 Mobile app SDK
- 🎤 Voice note recording
- 🔗 Third-party integrations (Jira, Slack, etc.)
- 📊 Analytics dashboard
- 🎨 Theme builder
- 🔧 Custom field support

### Version History

- **v1.0.0** - Initial modular architecture release
  - Refactored to component-based structure
  - Added comprehensive test suite
  - Improved build system
  - Enhanced documentation

---

Made with ❤️ for better user feedback experiences.
