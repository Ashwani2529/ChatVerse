const MAX_MESSAGE_LENGTH = 2000;

// Room ids live in URLs and Socket.IO room names, so keep the charset tight.
const validateRoomId = (roomId) => {
  if (!roomId || typeof roomId !== 'string') {
    return { isValid: false, error: 'Room ID is required' };
  }

  const trimmed = roomId.trim();

  if (trimmed.length < 3) {
    return { isValid: false, error: 'Room ID must be at least 3 characters' };
  }

  if (trimmed.length > 40) {
    return { isValid: false, error: 'Room ID must be 40 characters or fewer' };
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Room ID can only contain letters, numbers, dots, hyphens and underscores',
    };
  }

  return { isValid: true, value: trimmed };
};

const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 4) {
    return { isValid: false, error: 'Password must be at least 4 characters' };
  }

  if (password.length > 128) {
    return { isValid: false, error: 'Password must be 128 characters or fewer' };
  }

  return { isValid: true, value: password };
};

const validateName = (name) => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Name is required' };
  }

  const trimmed = name.trim().replace(/\s+/g, ' ');

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }

  if (trimmed.length > 50) {
    return { isValid: false, error: 'Name must be 50 characters or fewer' };
  }

  if (!/^[\p{L}\p{N} ._-]+$/u.test(trimmed)) {
    return { isValid: false, error: 'Name contains invalid characters' };
  }

  return { isValid: true, value: trimmed };
};

const validateMessage = (text) => {
  if (!text || typeof text !== 'string') {
    return { isValid: false, error: 'Message must be a non-empty string' };
  }

  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Message cannot be empty' };
  }

  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return {
      isValid: false,
      error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)`,
    };
  }

  return { isValid: true, value: trimmed };
};

module.exports = {
  MAX_MESSAGE_LENGTH,
  validateRoomId,
  validatePassword,
  validateName,
  validateMessage,
};
