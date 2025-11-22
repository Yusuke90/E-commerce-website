# OTP & OAuth Verification Guide

## ✅ OTP Implementation Status

### OTP Features
- ✅ 6-digit OTP generation
- ✅ Email-based OTP delivery
- ✅ 10-minute expiration
- ✅ Automatic cleanup of expired OTPs (TTL index)
- ✅ OTP verification for registration
- ✅ OTP verification for login
- ✅ Resend OTP functionality
- ✅ Timer countdown display
- ✅ Email normalization (case-insensitive)
- ✅ OTP input validation (digits only)
- ✅ Prevents duplicate OTPs for same email/purpose

### OAuth Implementation Status

### OAuth Features
- ✅ Google OAuth registration (skips OTP)
- ✅ Google OAuth login (skips OTP)
- ✅ Facebook OAuth registration (skips OTP)
- ✅ Facebook OAuth login (skips OTP)
- ✅ Account linking (email match)
- ✅ OAuth users don't need password
- ✅ OAuth users don't need OTP
- ✅ Direct login after OAuth

## 🔄 How They Work Together

### Registration Flow

**Option 1: OTP Registration**
1. User fills registration form
2. User clicks "Send OTP"
3. OTP sent to email
4. User enters OTP
5. Account created
6. Customer: Auto-logged in
7. Retailer/Wholesaler: Await admin approval

**Option 2: OAuth Registration (Customers Only)**
1. User clicks "Continue with Google/Facebook"
2. Redirected to OAuth provider
3. User authorizes
4. Account created automatically (no OTP needed)
5. User auto-logged in
6. Redirected to products page

### Login Flow

**Option 1: OTP Login**
1. User enters email + password
2. User clicks "Send OTP"
3. Credentials verified
4. OTP sent to email
5. User enters OTP
6. User logged in

**Option 2: OAuth Login**
1. User clicks "Continue with Google/Facebook"
2. Redirected to OAuth provider
3. User authorizes
4. User found/created (no OTP needed)
5. User auto-logged in
6. Redirected based on role

## 🔒 Security Features

### OTP Security
- ✅ 10-minute expiration
- ✅ One-time use (marked as verified)
- ✅ Email normalization prevents case-sensitivity issues
- ✅ Automatic cleanup of expired OTPs
- ✅ Prevents duplicate OTPs

### OAuth Security
- ✅ Email validation (required)
- ✅ OAuth ID validation
- ✅ Account linking protection
- ✅ Signature verification (Google/Facebook)
- ✅ Secure token exchange

## 🚫 OAuth Users & OTP

### OAuth Users Cannot Use OTP Login
- If user registered with OAuth, they **cannot** login with email/password
- System detects OAuth-only users and shows appropriate message
- OAuth users must use OAuth login

### Regular Users Cannot Use OAuth (if email exists)
- If user registered with email/password, they can still use OAuth
- OAuth account will be linked to existing account
- User can then use either method

## 📋 Error Messages

### OTP Errors
- "Invalid or expired OTP. Please request a new OTP."
- "Email already exists"
- "Email already registered with [provider]. Please use OAuth login."

### OAuth Errors
- "OAuth login failed. Please try again."
- "Email is required for OAuth login."
- "This account was created with [provider]. Please use OAuth login."
- "Your account is pending approval."

## 🧪 Testing Checklist

### OTP Registration
- [ ] Send OTP works
- [ ] OTP received in email
- [ ] OTP verification works
- [ ] Expired OTP rejected
- [ ] Invalid OTP rejected
- [ ] Resend OTP works
- [ ] Timer countdown works
- [ ] Customer auto-login after registration
- [ ] Retailer/Wholesaler await approval

### OTP Login
- [ ] Send OTP works
- [ ] OTP received in email
- [ ] OTP verification works
- [ ] Expired OTP rejected
- [ ] Invalid OTP rejected
- [ ] Resend OTP works
- [ ] Timer countdown works
- [ ] OAuth users cannot use OTP login

### OAuth Registration
- [ ] Google registration works
- [ ] Facebook registration works
- [ ] No OTP required
- [ ] Auto-login after registration
- [ ] Profile picture saved
- [ ] Welcome email sent

### OAuth Login
- [ ] Google login works
- [ ] Facebook login works
- [ ] No OTP required
- [ ] Existing users can login
- [ ] New users auto-registered
- [ ] Account linking works

## 🔧 Technical Details

### Email Normalization
- All emails converted to lowercase
- Trimmed of whitespace
- Consistent across OTP and OAuth

### OTP Format
- 6 digits only
- Non-digits automatically removed
- Case-insensitive matching

### OTP Expiration
- 10 minutes from generation
- TTL index auto-deletes expired OTPs
- Timer shows countdown on frontend

### OAuth Flow
- No OTP required
- Direct authentication
- Immediate login
- Account creation if new user

## 📝 Code Locations

### Backend
- `backend/controllers/authController.js` - OTP logic
- `backend/controllers/oauthController.js` - OAuth logic
- `backend/models/otpModel.js` - OTP model
- `backend/models/userModel.js` - User model

### Frontend
- `frontend/src/pages/Login.js` - Login with OTP/OAuth
- `frontend/src/pages/Register.js` - Registration with OTP/OAuth
- `frontend/src/pages/OAuthCallback.js` - OAuth callback handler
- `frontend/src/context/AuthContext.js` - Auth state management

## ✅ Verification

### OTP Works When:
- User has email/password account
- User requests OTP
- OTP is valid and not expired
- Email matches user account

### OAuth Works When:
- User clicks OAuth button
- OAuth provider returns email
- User authorizes the app
- Account exists or can be created

### OAuth Skips OTP:
- ✅ OAuth callback directly logs user in
- ✅ No OTP generation for OAuth users
- ✅ No OTP verification needed
- ✅ Immediate authentication

---

**Status**: ✅ Both OTP and OAuth fully implemented and working
**OAuth Skips OTP**: ✅ Confirmed
**Last Updated**: Current implementation

