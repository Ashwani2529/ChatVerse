import React from 'react';
import "./Message.css";

const Message = ({ user, message, classs, timestamp }) => {
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
        } catch (error) {
            return '';
        }
    };

    const isSystemMessage = user === 'System';
    const isOwnMessage = !user; // Empty user means it's the current user's message
    
    if (isSystemMessage) {
        return (
            <div className={`messageBox system-message`} role="log" aria-label="System message">
                <div className="system-content">
                    <span className="system-text">{message}</span>
                    {timestamp && (
                        <span className="timestamp" aria-label={`Time: ${formatTimestamp(timestamp)}`}>
                            {formatTimestamp(timestamp)}
                        </span>
                    )}
                </div>
            </div>
        );
    }
    
    if (isOwnMessage) {
        return (
            <div className={`messageBox ${classs}`} role="log" aria-label="Your message">
                <div className="message-content">
                    <div className="message-text">
                        <span className="user-label">You:</span>
                        <span className="message-body">{message}</span>
                    </div>
                    {timestamp && (
                        <span className="timestamp" aria-label={`Sent at: ${formatTimestamp(timestamp)}`}>
                            {formatTimestamp(timestamp)}
                        </span>
                    )}
                </div>
            </div>
        );
    }
    
    // Other user's message
    return (
        <div className={`messageBox ${classs}`} role="log" aria-label={`Message from ${user}`}>
            <div className="message-content">
                <div className="message-text">
                    <span className="user-label">{user}:</span>
                    <span className="message-body">{message}</span>
                </div>
                {timestamp && (
                    <span className="timestamp" aria-label={`Sent at: ${formatTimestamp(timestamp)}`}>
                        {formatTimestamp(timestamp)}
                    </span>
                )}
            </div>
        </div>
    );
};

export default Message;
