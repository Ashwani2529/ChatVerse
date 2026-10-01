const jwt = require('jsonwebtoken');

const TOKEN_DAYS = 60;
const TOKEN_TTL_SECONDS = TOKEN_DAYS * 24 * 60 * 60;

const getSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      'JWT_SECRET is not set. Add JWT_SECRET=<a long random string> to backend/.env'
    );
  }

  return secret;
};

const signToken = ({ roomId, name, memberId }) =>
  jwt.sign({ roomId, name, memberId }, getSecret(), {
    expiresIn: TOKEN_TTL_SECONDS,
  });

const verifyToken = (token) => jwt.verify(token, getSecret());

module.exports = { signToken, verifyToken, TOKEN_DAYS, TOKEN_TTL_SECONDS };
