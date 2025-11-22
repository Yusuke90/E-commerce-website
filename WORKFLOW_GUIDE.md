# Development Workflow Guide

## 🔄 Your Workflow

1. **Develop on this machine** (no DB, no .env)
2. **Push to GitHub**
3. **Pull on host laptop** (has DB and .env)
4. **Test on host laptop**

---

## ✅ What's Already Configured

### `.gitignore` Setup
- ✅ `node_modules/` - Ignored (won't be pushed)
- ✅ `.env` - Ignored (won't be pushed)
- ✅ `backend/uploads/products/*` - Ignored (product images won't be pushed)
- ✅ Build outputs ignored

### What WILL be pushed to GitHub:
- ✅ All source code (`.js`, `.jsx`, `.json`, etc.)
- ✅ `package.json` files (for dependency management)
- ✅ Configuration files (except `.env`)
- ✅ Documentation files

### What WON'T be pushed:
- ❌ `node_modules/` (dependencies)
- ❌ `.env` (environment variables)
- ❌ Uploaded product images
- ❌ Database files

---

## 📋 Workflow Steps

### On This Machine (Development)

1. **Make code changes**
   ```bash
   # Edit files, add features, fix bugs
   ```

2. **Test locally (if possible)**
   - Check for syntax errors
   - Verify imports are correct
   - Test logic (without DB/API calls)

3. **Commit changes**
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

4. **Push to GitHub**
   ```bash
   git push origin main
   # or
   git push origin master
   ```

### On Host Laptop (Testing)

1. **Pull latest changes**
   ```bash
   git pull origin main
   # or
   git pull origin master
   ```

2. **Install dependencies (if new packages added)**
   ```bash
   cd backend
   npm install
   
   cd ../frontend
   npm install
   ```

3. **Verify .env exists**
   ```bash
   # Make sure backend/.env has all required variables
   # (You already have this set up)
   ```

4. **Start services**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start
   
   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

5. **Test the changes**
   - Test new features
   - Verify bug fixes
   - Check for any issues

---

## 🔍 Quick Checklist Before Pushing

- [ ] No `.env` files in commit (check with `git status`)
- [ ] No `node_modules/` in commit
- [ ] Code compiles without errors
- [ ] All imports are correct
- [ ] No hardcoded secrets/keys
- [ ] Meaningful commit message

---

## 🚨 Common Issues & Solutions

### Issue: "Module not found" on host laptop
**Solution**: New package added? Run `npm install` on host laptop

### Issue: "Environment variable missing"
**Solution**: Add the new variable to `backend/.env` on host laptop

### Issue: "Database connection failed"
**Solution**: 
- Check MongoDB is running on host laptop
- Verify `MONGO_URI` in `.env` is correct

### Issue: "Port already in use"
**Solution**: 
- Kill existing process: `lsof -ti:5000 | xargs kill` (Mac/Linux)
- Or change PORT in `.env`

---

## 📝 Best Practices

### 1. Commit Frequently
- Small, focused commits
- Clear commit messages
- Don't wait until everything is done

### 2. Test Before Pushing
- At least verify code compiles
- Check for obvious errors
- Test critical paths if possible

### 3. Keep .env Template Updated
- If you add new env variables, document them
- Update `OAUTH_SETUP.md` or create `.env.example` if needed

### 4. Don't Commit
- ❌ `.env` files
- ❌ `node_modules/`
- ❌ Large files
- ❌ Personal notes/temp files

### 5. Use Meaningful Commit Messages
```bash
# Good
git commit -m "Add OAuth Google login integration"
git commit -m "Fix stock deduction bug in payment verification"
git commit -m "Update B2B cart to allow quantity changes"

# Bad
git commit -m "fix"
git commit -m "changes"
git commit -m "update"
```

---

## 🔧 Useful Git Commands

### Check what will be committed
```bash
git status
git diff
```

### See commit history
```bash
git log --oneline
```

### Undo last commit (keep changes)
```bash
git reset --soft HEAD~1
```

### Check if .env is ignored
```bash
git check-ignore backend/.env
# Should output: backend/.env
```

---

## 📦 When Adding New Dependencies

### Backend
1. Add to `backend/package.json`
2. Commit `package.json` and `package-lock.json`
3. Push to GitHub
4. On host laptop: `cd backend && npm install`

### Frontend
1. Add to `frontend/package.json`
2. Commit `package.json` and `package-lock.json`
3. Push to GitHub
4. On host laptop: `cd frontend && npm install`

---

## 🎯 Your Current Setup

### This Machine (Development)
- ✅ Code editor
- ✅ Git
- ❌ No database
- ❌ No .env
- ✅ Can push to GitHub

### Host Laptop (Testing/Production)
- ✅ Database (MongoDB)
- ✅ .env file with all credentials
- ✅ Can run backend and frontend
- ✅ Can test full functionality

---

## 💡 Pro Tips

1. **Use feature branches** (optional but recommended)
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   git push origin feature/new-feature
   # Merge on GitHub or host laptop
   ```

2. **Keep a changelog** (optional)
   - Document major changes
   - Track what needs testing

3. **Test critical paths first**
   - Authentication
   - Payment flow
   - Order creation
   - Stock management

4. **Use descriptive branch names**
   ```bash
   feature/oauth-integration
   bugfix/stock-calculation
   enhancement/b2b-cart
   ```

---

## ✅ Verification Commands

### Before pushing, verify:
```bash
# Check what files will be committed
git status

# Verify .env is ignored
git check-ignore backend/.env

# See what changed
git diff

# Check for large files
git ls-files | xargs ls -lh | sort -k5 -hr | head -20
```

---

## 🎉 You're All Set!

Your workflow is properly configured:
- ✅ `.gitignore` excludes sensitive files
- ✅ Code can be safely pushed
- ✅ Host laptop can pull and test
- ✅ No conflicts with local vs host setup

Just remember:
1. **Code here** → 2. **Push to GitHub** → 3. **Pull on host** → 4. **Test**

Happy coding! 🚀

