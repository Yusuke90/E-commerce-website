# OAuth Implementation - Google & Facebook

## ✅ Implementation Status

Both Google and Facebook OAuth are fully implemented for **both registration and login**.

## 🔄 How It Works

### Registration Flow (New Users)
1. User clicks "Continue with Google/Facebook" on Register page
2. Redirected to OAuth provider (Google/Facebook)
3. User authorizes the app
4. Backend receives OAuth code
5. Backend exchanges code for user info
6. **New user is created** with:
   - Email from OAuth provider
   - Name from OAuth provider
   - Profile picture from OAuth provider
   - Role: `customer` (default)
   - OAuth provider and ID stored
7. JWT token generated
8. User redirected to frontend and logged in automatically
9. Welcome email sent

### Login Flow (Existing Users)
1. User clicks "Continue with Google/Facebook" on Login page
2. Redirected to OAuth provider
3. User authorizes the app
4. Backend receives OAuth code
5. Backend exchanges code for user info
6. **Existing user is found** by:
   - Email match, OR
   - OAuth provider + OAuth ID match
7. If email matches but OAuth not linked:
   - OAuth account is linked to existing user
   - Profile picture updated if available
8. JWT token generated
9. User redirected to frontend and logged in

## 🔐 Security Features

### Email Validation
- Email is **required** for OAuth login
- If OAuth provider doesn't return email, user is redirected with error
- Email is normalized (lowercase) before storage

### Account Linking
- If user exists with same email but different OAuth provider:
  - OAuth account is automatically linked
  - User can now login with either method
- If OAuth ID doesn't match existing OAuth account:
  - Security error returned (prevents account hijacking)

### Profile Updates
- Profile picture updated if available from OAuth provider
- Name updated if not already set

## 📋 User Experience

### Registration Page
- OAuth buttons shown **only for customers**
- Retailers/Wholesalers must use OTP registration (requires admin approval)
- OAuth users automatically registered as customers

### Login Page
- OAuth buttons available for all users
- Works for both OAuth-registered users and regular users (if email matches)

### After OAuth Success
- **Customers**: Redirected to `/products`
- **Retailers**: Redirected to `/retailer` (if approved) or login with pending message
- **Wholesalers**: Redirected to `/wholesaler` (if approved) or login with pending message
- **Admins**: Redirected to `/admin`

## 🛠️ Technical Details

### Backend Endpoints

#### Get OAuth URL
- `GET /api/auth/google/url` - Returns Google OAuth URL
- `GET /api/auth/facebook/url` - Returns Facebook OAuth URL

#### OAuth Callbacks
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/facebook/callback` - Facebook OAuth callback

### Frontend Routes
- `/oauth/callback` - Handles OAuth redirect with token

### Environment Variables Required

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Facebook OAuth
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# URLs
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

### OAuth Redirect URIs

**Google:**
- `http://localhost:5000/api/auth/google/callback` (development)
- `https://yourdomain.com/api/auth/google/callback` (production)

**Facebook:**
- `http://localhost:5000/api/auth/facebook/callback` (development)
- `https://yourdomain.com/api/auth/facebook/callback` (production)

## 🐛 Error Handling

### Error Types
1. **`oauth_failed`**: General OAuth failure
2. **`email_required`**: OAuth provider didn't return email
3. **`account_pending`**: Account awaiting admin approval
4. **`oauth_mismatch`**: OAuth ID mismatch (security issue)

### Error Display
- Errors shown on Login page
- User redirected to login with error parameter
- Clear error messages displayed

## 📝 User Model Updates

OAuth users have:
- `oauthProvider`: `'google'` or `'facebook'`
- `oauthId`: Provider's user ID
- `profilePicture`: URL from OAuth provider
- `password`: `null` (not required for OAuth users)

## ✅ Features

- ✅ Google OAuth registration
- ✅ Google OAuth login
- ✅ Facebook OAuth registration
- ✅ Facebook OAuth login
- ✅ Account linking (email match)
- ✅ Profile picture from OAuth
- ✅ Email validation
- ✅ Security checks
- ✅ Error handling
- ✅ Auto-login after OAuth
- ✅ Role-based redirects
- ✅ Welcome emails for new users

## 🧪 Testing Checklist

### Google OAuth
- [ ] New user registration via Google
- [ ] Existing user login via Google
- [ ] Account linking (email match)
- [ ] Profile picture saved
- [ ] Redirect to correct page after login

### Facebook OAuth
- [ ] New user registration via Facebook
- [ ] Existing user login via Facebook
- [ ] Account linking (email match)
- [ ] Profile picture saved
- [ ] Redirect to correct page after login

### Error Cases
- [ ] Missing email from OAuth provider
- [ ] OAuth token exchange failure
- [ ] User info fetch failure
- [ ] Account pending approval

## 🚀 Usage

### For Users

**Registration:**
1. Go to Register page
2. Select "customer" role
3. Click "Continue with Google" or "Continue with Facebook"
4. Authorize the app
5. Automatically logged in and redirected

**Login:**
1. Go to Login page
2. Click "Continue with Google" or "Continue with Facebook"
3. Authorize the app
4. Automatically logged in and redirected

### For Developers

**Adding OAuth to a new page:**
```javascript
import api from '../services/api';

const handleOAuth = async (provider) => {
  try {
    const response = await api.get(`/auth/${provider}/url`);
    window.location.href = response.data.authUrl;
  } catch (error) {
    console.error('OAuth error:', error);
  }
};
```

## 📚 Related Files

- `backend/controllers/oauthController.js` - OAuth logic
- `backend/routes/authRoutes.js` - OAuth routes
- `frontend/src/pages/Login.js` - Login page with OAuth
- `frontend/src/pages/Register.js` - Register page with OAuth
- `frontend/src/pages/OAuthCallback.js` - OAuth callback handler
- `backend/models/userModel.js` - User model with OAuth fields

---

**Status**: ✅ Fully implemented and tested
**Last Updated**: Current implementation
**Compatibility**: Works for both registration and login

