import React, { useState } from "react";
import "./Join.css";
import logo from "../../images/logo.png";
import { useNavigate } from "react-router-dom";

const Join = () => {
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const validateUsername = (username) => {
        const trimmed = username.trim();
        
        if (!trimmed) {
            return "Username cannot be empty";
        }
        
        if (trimmed.length < 2) {
            return "Username must be at least 2 characters long";
        }
        
        if (trimmed.length > 50) {
            return "Username must be less than 50 characters";
        }
        
        // Check for valid characters (letters, numbers, spaces, basic symbols)
        const validPattern = /^[a-zA-Z0-9\s._-]+$/;
        if (!validPattern.test(trimmed)) {
            return "Username contains invalid characters";
        }
        
        return null;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        
        const validationError = validateUsername(name);
        if (validationError) {
            setError(validationError);
            setIsLoading(false);
            return;
        }
        
        // Store username in sessionStorage for the chat component
        const sanitizedName = name.trim();
        sessionStorage.setItem('chatUsername', sanitizedName);
        
        // Navigate to chat page
        navigate('/chat');
        setIsLoading(false);
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setName(value);
        
        // Clear error when user starts typing
        if (error) {
            setError("");
        }
    };

    return (
        <div className="JoinPage">
            <form className="JoinContainer" onSubmit={handleSubmit}>
                <img src={logo} alt="ChatVerse Logo" />
                <h1>ChatVerse</h1>
                
                {error && (
                    <div className="error-message" style={{
                        color: '#ff4444',
                        backgroundColor: '#ffebee',
                        padding: '10px',
                        borderRadius: '5px',
                        margin: '10px 0',
                        border: '1px solid #ffcdd2'
                    }}>
                        {error}
                    </div>
                )}

                <input
                    value={name}
                    onChange={handleInputChange}
                    placeholder="Enter Your Name"
                    type="text"
                    id="joinInput"
                    maxLength="50"
                    disabled={isLoading}
                    autoComplete="username"
                    aria-label="Enter your username"
                    aria-describedby={error ? "username-error" : undefined}
                />
                
                <button 
                    type="submit" 
                    className="joinbtn"
                    disabled={isLoading || !name.trim()}
                    aria-label="Join the chat"
                >
                    {isLoading ? "Joining..." : "Join Chat"}
                </button>
            </form>
        </div>
    );
};

export default Join;
