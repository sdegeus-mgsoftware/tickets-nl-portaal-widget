# Visual Feedback Widget

A powerful, customizable feedback widget that allows users to capture screenshots, record their screen, and submit detailed bug reports or feedback directly from any website.

![Visual Feedback Widget Demo](https://via.placeholder.com/800x400/4f46e5/ffffff?text=Visual+Feedback+Widget+Demo)

## ✨ Features

- 📸 **Screenshot Capture** - Automatic screenshot capture with annotation tools
- 🎥 **Screen Recording** - Optional screen recording for complex issues
- 🔐 **User Authentication** - Secure login system with session management
- 💬 **AI-Powered Chat** - Interactive chat interface for gathering feedback
- 📊 **System Information** - Automatic collection of browser and system details
- 🌓 **Dark Mode Support** - Responsive design with light/dark theme support
- 🔧 **Console & Network Logging** - Captures technical debugging information
- 📱 **Mobile Responsive** - Works seamlessly on desktop and mobile devices

## 🚀 Quick Start

### CDN Installation (Recommended)

Add the widget to your website with just two lines of code:

```html
<!-- Add to your HTML head -->
<link rel="stylesheet" href="https://your-cdn.com/visual-feedback-widget/latest/visual-feedback-widget.css">

<!-- Add before closing body tag -->
<script src="https://your-cdn.com/visual-feedback-widget/latest/visual-feedback-widget.js"></script>

<script>
  // Initialize the widget
  const feedbackWidget = new VisualFeedbackWidget({
    apiUrl: 'https://your-api-endpoint.com/api',
    projectId: 'your-project-id',
    position: 'bottom-right',
    theme: 'modern'
  });
</script>
```

### Manual Installation

1. Download the latest release files:
   - `visual-feedback-widget.js`
   - `visual-feedback-widget.css`

2. Add them to your project and include in your HTML:

```html
<link rel="stylesheet" href="path/to/visual-feedback-widget.css">
<script src="path/to/visual-feedback-widget.js"></script>
```

### Development Setup

For development and examples, use the configuration file approach:

1. **Copy the configuration template:**
   ```bash
   cp examples/config.example.js examples/config.js
   ```

2. **Update your settings:**
   ```javascript
   // examples/config.js
   window.WIDGET_CONFIG = {
     apiUrl: 'https://your-api-endpoint.com/api',
     projectId: 'your-project-id',
     debugMode: true,  // Enable for development
     position: 'bottom-right',
     theme: 'modern'
   };
   ```

3. **The example will automatically load your config:**
   ```html
   <script src="config.js"></script>
   <script src="visual-feedback-widget.js"></script>
   ```

> **Note:** The `config.js` file is ignored by git for security. Always use `config.example.js` as your starting template.

## ⚙️ Configuration

### Basic Configuration

```javascript
const widget = new VisualFeedbackWidget({
  // Required: Your API endpoint
  apiUrl: 'https://your-api-endpoint.com/api',
  
  // Required: Project identifier
  projectId: 'your-project-id',
  
  // Optional: Widget positioning
  position: 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
  
  // Optional: Visual theme
  theme: 'modern', // 'modern', 'classic', 'minimal'
  
  // Optional: Enable debug logging
  debugMode: false
});
```

### Advanced Configuration

```javascript
const widget = new VisualFeedbackWidget({
  apiUrl: 'https://your-api-endpoint.com/api',
  projectId: 'your-project-id',
  
  // Customization options
  triggerButtonText: 'Send Feedback',
  ariaLabel: 'Open feedback form',
  
  // Feature toggles
  enableScreenRecording: true,
  enableConsoleLogging: true,
  enableNetworkLogging: true,
  
  // Auto-initialization
  autoInit: true,
  
  // Event callbacks
  onOpen: () => console.log('Widget opened'),
  onClose: () => console.log('Widget closed'),
  onSubmit: (data) => console.log('Feedback submitted:', data)
});
```

## 🔌 API Integration

### Backend Requirements

Your API endpoint should handle the following:

#### 1. Authentication Endpoint: `POST /auth/external`

```javascript
// Login request
{
  "action": "signIn",
  "email": "user@example.com",
  "password": "password123"
}

// Expected response
{
  "success": true,
  "session": {
    "accessToken": "jwt-access-token",
    "refreshToken": "refresh-token",
    "expiresAt": 1234567890
  },
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

#### 2. Session Validation: `GET /auth/external`

```javascript
// Headers
Authorization: Bearer {accessToken}

// Expected response
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

#### 3. Feedback Submission: `POST /feedback`

```javascript
// Headers
Authorization: Bearer {accessToken}
X-Project-ID: your-project-id

// Request body
{
  "screenshot": {
    "dataUrl": "data:image/png;base64,..."
  },
  "annotations": [...],
  "chatMessages": [...],
  "systemInfo": {...},
  "consoleLogs": [...],
  "networkLogs": [...],
  "metadata": {
    "url": "https://example.com/page",
    "userAgent": "...",
    "timestamp": "2024-01-01T12:00:00Z",
    "widgetVersion": "1.0.0",
    "submissionId": "unique-id"
  }
}
```

### Example Backend Implementation (Node.js/Express)

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

// Authentication endpoint
app.post('/auth/external', async (req, res) => {
  const { action, email, password } = req.body;
  
  if (action === 'signIn') {
    // Validate credentials (implement your own logic)
    const user = await validateUser(email, password);
    
    if (user) {
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      res.json({
        success: true,
        session: {
          accessToken,
          refreshToken: generateRefreshToken(),
          expiresAt: Date.now() + 3600000 // 1 hour
        },
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  }
});

// Session validation
app.get('/auth/external', authenticateToken, (req, res) => {
  res.json({
    user: req.user
  });
});

// Feedback submission
app.post('/feedback', authenticateToken, async (req, res) => {
  const projectId = req.headers['x-project-id'];
  const feedbackData = req.body;
  
  // Save feedback to your database
  const ticket = await saveFeedback({
    projectId,
    userId: req.user.id,
    ...feedbackData
  });
  
  res.json({
    success: true,
    ticketId: ticket.id
  });
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.sendStatus(401);
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}
```

## 🎨 Customization

### CSS Customization

The widget uses CSS custom properties for easy theming:

```css
:root {
  --vfw-primary-color: #4f46e5;
  --vfw-background-color: #ffffff;
  --vfw-text-color: #111827;
  --vfw-border-color: #d1d5db;
  --vfw-border-radius: 0.375rem;
  --vfw-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --vfw-background-color: #1f2937;
    --vfw-text-color: #f9fafb;
    --vfw-border-color: #374151;
  }
}
```

### Custom Button Styling

```css
.help-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border-radius: 50% !important;
  width: 60px !important;
  height: 60px !important;
}
```

## 📱 Mobile Support

The widget is fully responsive and includes:

- Touch-friendly interface elements
- Mobile-optimized modal sizing
- Gesture support for drawing annotations
- Responsive button positioning

## 🔒 Security Features

- JWT-based authentication
- Encrypted local storage for session data
- CORS-compliant API requests
- XSS protection for user content
- Secure token refresh mechanism

## 🛠️ Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/your-username/visual-feedback-widget.git
cd visual-feedback-widget

# Install dependencies
npm install

# Development build with hot reload
npm run dev

# Production build
npm run build

# Run tests
npm test
```

### Development Server

```bash
# Start development server (port 3000)
npm run dev

# Start example server (port 8080)
npm run serve
```

Visit `http://localhost:8080/examples/cdn-test.html` to test the widget.

## 📋 Browser Support

| Browser | Version |
|---------|---------|
| Chrome  | 60+ |
| Firefox | 55+ |
| Safari  | 11+ |
| Edge    | 79+ |

## 🐛 Troubleshooting

### Common Issues

**Widget not appearing:**
- Check console for JavaScript errors
- Verify CSS file is loaded correctly
- Ensure proper initialization code

**Authentication failing:**
- Verify API endpoint URLs
- Check CORS configuration
- Validate JWT token format

**Screenshots not working:**
- Check for Content Security Policy restrictions
- Ensure html2canvas library loads correctly
- Verify canvas support in browser

### Debug Mode

Enable debug mode for detailed logging:

```javascript
const widget = new VisualFeedbackWidget({
  apiUrl: 'https://your-api-endpoint.com/api',
  projectId: 'your-project-id',
  debugMode: true // Enable detailed console logging
});
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📞 Support

- 📖 [Documentation](https://github.com/your-username/visual-feedback-widget/wiki)
- 🐛 [Report Issues](https://github.com/your-username/visual-feedback-widget/issues)
- 💡 [Feature Requests](https://github.com/your-username/visual-feedback-widget/discussions)

## 📊 Changelog

### v1.0.0
- Initial release
- Screenshot capture with annotations
- User authentication system
- Screen recording support
- AI-powered chat interface
- Mobile responsive design

---

Made with ❤️ by [Your Name](https://github.com/your-username)