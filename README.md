# ChatVerse - Real-Time Chat Application

Welcome to ChatVerse, a modern real-time chat application built with React.js and Socket.IO. Experience seamless group chatting with advanced features and a beautiful, responsive interface.

## ✨ Features

### Backend Features

#### 🔧 **Core Infrastructure**
- **Environment Configuration**: Flexible environment variable handling with fallbacks
- **CORS Support**: Comprehensive CORS configuration for both Express and Socket.IO
- **Error Handling**: Robust error handling with global exception management
- **User Management**: Efficient user storage using Map for optimal performance
- **Memory Management**: Automatic cleanup of user data on disconnect

#### 🛡️ **Security & Validation**
- **Input Validation**: Server-side validation for usernames and messages
- **Sanitization**: XSS protection through input sanitization
- **Rate Limiting**: Message length limits (500 characters) and username constraints
- **Type Safety**: Strict type checking for all inputs

#### 📊 **Monitoring & Logging**
- **Health Check Endpoint**: Status endpoint with connection metrics
- **Comprehensive Logging**: Detailed logging for connections, disconnections, and errors
- **Connection Tracking**: Real-time user count and connection monitoring

### Frontend Features

#### 🎨 **User Experience**
- **Connection Status**: Real-time connection indicator (🟢 Connected / 🔴 Disconnected)
- **Error Handling**: User-friendly error messages and connection alerts
- **Loading States**: Visual feedback during message sending and connection establishment
- **Input Validation**: Client-side validation with real-time feedback
- **Responsive Design**: Mobile-friendly interface with responsive breakpoints

#### ⚡ **Performance & Reliability**
- **Socket Management**: Proper socket cleanup and reconnection handling
- **State Management**: React state and sessionStorage for data persistence
- **Memory Optimization**: Optimized React hooks and socket listeners
- **Efficient Rendering**: Optimized message rendering with proper keys and timestamps

#### ♿ **Accessibility**
- **ARIA Labels**: Comprehensive screen reader support
- **Semantic HTML**: Proper semantic structure for better navigation
- **Keyboard Navigation**: Full keyboard accessibility support
- **Focus Management**: Proper focus indicators and management

#### 🎯 **Advanced Features**
- **Message Timestamps**: Display send time for all messages
- **System Messages**: Styled system notifications for user join/leave events
- **Message Types**: Distinguished styling for user messages vs system messages
- **Auto-reconnection**: Automatic reconnection with user state restoration
- **Session Persistence**: Username persistence across page refreshes

## 🛠️ Technical Specifications

### Code Quality
- **React Best Practices**: Proper use of hooks, useCallback, useRef
- **Error Boundaries**: Comprehensive error handling throughout the application
- **Type Safety**: Robust prop validation and type checking
- **Code Organization**: Clean component structure and separation of concerns

### Performance Optimizations
- **Efficient Re-renders**: Optimized React rendering with proper dependencies
- **Socket Optimization**: Advanced socket connection management
- **CSS Architecture**: Modern styling with responsive design principles
- **Bundle Optimization**: Clean imports and optimized code structure

## 📱 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
PORT=4501
FRONTEND_URL=https://chatverxe.netlify.app
```

Start the backend server:
```bash
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
```

Create a `.env` file in the frontend directory:
```env
REACT_APP_BACKEND_URL=https://chatverse-xl8a.onrender.com
```

Start the frontend application:
```bash
npm start
```

## 🌐 Live Demo

**Frontend**: [https://chatverxe.netlify.app](https://chatverxe.netlify.app)

## 🌐 Deployment

### Backend Deployment (Heroku/Railway/Render)
1. Set environment variables:
   - `PORT` (will be set automatically by hosting provider)
   - `FRONTEND_URL=https://chatverxe.netlify.app`

### Frontend Deployment (Netlify/Vercel)
1. Set environment variables:
   - `REACT_APP_BACKEND_URL` (your backend domain)

## 🔧 Configuration Options

### Environment Variables

#### Backend
- `PORT`: Server port (default: 4501)
- `FRONTEND_URL`: Frontend URL for CORS (default: https://chatverxe.netlify.app)
- `TOXICITY_API_URL`: Optional toxicity detection API endpoint

#### Frontend
- `REACT_APP_BACKEND_URL`: Backend API URL (default: https://chatverse-xl8a.onrender.com)

## 🚦 Application Features

### Core Chat Features
- ✅ Real-time messaging with Socket.IO
- ✅ User join/leave notifications
- ✅ Connection status indicators
- ✅ Message timestamps
- ✅ Auto-reconnection on connection loss
- ✅ Mobile-responsive design

### Advanced Features
- ✅ Input validation and sanitization
- ✅ Error handling and user feedback
- ✅ Accessibility compliance
- ✅ System message differentiation
- ✅ Session persistence
- ✅ Connection health monitoring

### Future Features (Ready for Implementation)
- 🔄 Toxicity detection integration
- 🔄 Message history persistence
- 🔄 User avatars
- 🔄 Private messaging
- 🔄 Room-based chat

## 🧪 Testing

Run tests for both frontend and backend:

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 📚 API Documentation

### Socket Events

#### Client to Server
- `joined`: User joins the chat
- `message`: Send a message
- `disconnect`: User leaves the chat

#### Server to Client
- `welcome`: Welcome message for new users
- `userJoined`: Notification when user joins
- `leave`: Notification when user leaves
- `sendMessage`: Broadcast message to all users
- `error`: Error notifications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper testing
4. Submit a pull request with detailed description

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues:

1. Check the browser console for error messages
2. Verify environment variables are set correctly
3. Ensure both backend and frontend are running
4. Check network connectivity for real-time features

## 🎯 About ChatVerse

ChatVerse is a powerful real-time chat application that combines the best of modern web technologies. Built with React.js for a dynamic frontend experience and Socket.IO for real-time communication, it offers a seamless and engaging chat environment.

The application features comprehensive error handling, input validation, accessibility compliance, and mobile responsiveness, making it suitable for users across all devices and platforms. Whether you're connecting with friends, family, or colleagues, ChatVerse provides a reliable and feature-rich chatting experience.
