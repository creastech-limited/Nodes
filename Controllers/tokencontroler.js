const jwt = require('jsonwebtoken');



function generateTokens(user) {
  const accessToken = jwt.sign(
    {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    process.env.JWT_SECRET_KEY,
    { expiresIn: '15m' } // short-lived access token
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET_KEY,
    { expiresIn: '30d' } // long-lived refresh token
  );

  return { accessToken, refreshToken };
}
