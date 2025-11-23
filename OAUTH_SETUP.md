# OAuth Setup Guide

## Environment Variables Required

Add these to your `backend/.env` file:

```env
# OAuth - Google
GOOGLE_CLIENT_ID=your client id.
GOOGLE_CLIENT_SECRET=your client secret


# OAuth - Facebook
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Backend URL (for OAuth callbacks)
BACKEND_URL=http://localhost:5000
```

## How to Get OAuth Credentials

### Google OAuth Setup:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: Web application
6. Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback` (for development)
7. Copy Client ID and Client Secret

### Facebook OAuth Setup:
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add "Facebook Login" product
4. Settings → Basic:
   - Add Valid OAuth Redirect URIs: `http://localhost:5000/api/auth/facebook/callback`
5. Copy App ID and App Secret from Settings → Basic

## Features Implemented

✅ Google OAuth Login
✅ Facebook OAuth Login
✅ OAuth users automatically registered as customers
✅ OAuth users skip OTP verification
✅ Profile picture from OAuth providers
✅ Seamless integration with existing JWT authentication

## Notes

- OAuth users are automatically created as "customer" role
- OAuth users don't need passwords
- OAuth login bypasses OTP verification
- Profile pictures from OAuth providers are stored
- Existing users can link their accounts if email matches

