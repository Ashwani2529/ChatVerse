import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socketIo from "socket.io-client";
import "./Chat.css";
import sendLogo from "../../images/send.png";
import Message from "../Message/Message";
import ReactScrollToBottom from "react-scroll-to-bottom";
import closeIcon from "../../images/close.png";
import { Oval } from "react-loader-spinner";

const ENDPOINT = process.env.REACT_APP_BACKEND_URL || "http://localhost:4501";

const Chat = () => {
  const [id, setId] = useState("");
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [user, setUser] = useState("");
  
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const messagesRef = useRef(messages);

  // Update messages ref whenever messages change
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Get username from sessionStorage
  useEffect(() => {
    const storedUsername = sessionStorage.getItem('chatUsername');
    if (!storedUsername) {
      navigate('/');
      return;
    }
    setUser(storedUsername);
  }, [navigate]);

  // Add message to state
  const addMessage = useCallback((newMessage) => {
    setMessages(prevMessages => [...prevMessages, newMessage]);
  }, []);

  // Handle socket connection and events
  useEffect(() => {
    if (!user) return;

    try {
      // Initialize socket connection
      socketRef.current = socketIo(ENDPOINT, { 
        transports: ["websocket", "polling"],
        timeout: 10000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        maxReconnectionAttempts: 5
      });

      const socket = socketRef.current;

      // Connection events
      socket.on("connect", () => {
        console.log("Connected to server");
        setIsConnected(true);
        setConnectionError("");
        setId(socket.id);
        
        // Join the chat
        socket.emit("joined", { user });
      });

      socket.on("connect_error", (error) => {
        console.error("Connection error:", error);
        setIsConnected(false);
        setConnectionError("Failed to connect to server. Please try again.");
      });

      socket.on("disconnect", (reason) => {
        console.log("Disconnected:", reason);
        setIsConnected(false);
        if (reason === "io server disconnect") {
          setConnectionError("Server disconnected. Attempting to reconnect...");
        }
      });

      socket.on("reconnect", () => {
        console.log("Reconnected to server");
        setIsConnected(true);
        setConnectionError("");
        // Rejoin the chat
        socket.emit("joined", { user });
      });

      // Chat events
      socket.on("welcome", (data) => {
        addMessage({ ...data, id: 'system' });
      });

      socket.on("userJoined", (data) => {
        addMessage({ ...data, id: 'system' });
      });

      socket.on("leave", (data) => {
        addMessage({ ...data, id: 'system' });
      });

      socket.on("sendMessage", (data) => {
        addMessage(data);
        setIsLoading(false);
      });

      socket.on("error", (error) => {
        console.error("Socket error:", error);
        setConnectionError(error.message || "An error occurred");
        setIsLoading(false);
      });

      // Cleanup function
      return () => {
        if (socket) {
          socket.disconnect();
          socket.removeAllListeners();
        }
      };
    } catch (error) {
      console.error("Failed to initialize socket:", error);
      setConnectionError("Failed to initialize connection");
    }
  }, [user, addMessage]);

  const sendMessage = useCallback(() => {
    if (!socketRef.current || !isConnected) {
      setConnectionError("Not connected to server");
      return;
    }

    const message = messageInput.trim();
    if (!message) {
      return;
    }

    if (message.length > 500) {
      setConnectionError("Message too long (max 500 characters)");
      return;
    }

    setIsLoading(true);
    setConnectionError("");
    
    socketRef.current.emit("message", { message, id });
    setMessageInput("");
  }, [messageInput, isConnected, id]);

  const handleKeyPress = useCallback((event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const handleLeaveChat = useCallback(() => {
    sessionStorage.removeItem('chatUsername');
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    navigate('/');
  }, [navigate]);

  // Show loading screen while connecting
  if (!user) {
    return (
      <div className="chatPage">
        <div className="chatContainer">
          <div className="loading-container">
            <Oval
              visible={true}
              height="50"
              width="50"
              color="#4fa94d"
              ariaLabel="Loading chat"
            />
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chatPage">
      <div className="chatContainer">
        <div className="header">
          <h2>ChatVerse</h2>
          <div className="header-info">
            <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
            <button 
              onClick={handleLeaveChat}
              className="leave-btn"
              aria-label="Leave chat"
            >
              <img src={closeIcon} alt="Close" />
            </button>
          </div>
        </div>
        
        {connectionError && (
          <div className="error-banner" style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '10px',
            textAlign: 'center',
            borderBottom: '1px solid #ffcdd2'
          }}>
            {connectionError}
          </div>
        )}
        
        <ReactScrollToBottom className="chatBox">
          {messages.map((item, index) => (
            <Message
              key={`${item.id}-${index}-${item.timestamp || Date.now()}`}
              user={item.id === id ? "" : item.user}
              message={item.message}
              classs={item.id === id ? "right" : "left"}
              timestamp={item.timestamp}
            />
          ))}
        </ReactScrollToBottom>
        
        <div className="inputBox" id="inputwala">
          <input
            type="text"
            id="chatInput"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            disabled={!isConnected || isLoading}
            maxLength={500}
            aria-label="Type your message"
          />
          {isLoading ? (
            <Oval
              visible={isLoading}
              height="50"
              width="50"
              color="#4fa94d"
              ariaLabel="Sending message"
              wrapperStyle={{
                margin: "3px 22px 3px 22px",
              }}
            />
          ) : (
            <button 
              onClick={sendMessage} 
              className="sendBtn"
              disabled={!isConnected || !messageInput.trim()}
              aria-label="Send message"
            >
              <img src={sendLogo} alt="Send" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
