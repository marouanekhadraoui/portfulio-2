# PORTFOLIO CONTACT FORM — PRODUCTION DEBUGGING GUIDE

## Status: FRONTEND FIX APPLIED ✅

**Commit:** `1fa187621d41fe7117f66d1480cd1ae086f762ab`  
**Date:** 2026-06-06  
**Frontend Updated:** Yes  
**Backend Status:** ⚠️ REQUIRES VERIFICATION

---

## 🔴 ROOT CAUSE ANALYSIS

### Primary Issue: API Base URL Mismatch (FIXED)

**OLD CODE (Lines 409-411):**
```javascript
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : window.location.origin;  // ❌ WRONG: resolves to https://portfulio-2.vercel.app
```

**Problem:**
- In production, `window.location.origin` returns the **frontend URL** (`https://portfulio-2.vercel.app`)
- The contact form POSTs to: `https://portfulio-2.vercel.app/api/contact`
- Vercel has NO `/api/contact` route → serves 404 HTML page
- Frontend tries `res.json()` on HTML → **JSON Parse Error**

**Error Message Explained:**
```
"Unexpected token 'T', 'The page c'... is not valid JSON"
```
- 'T' = from `<!docTYPE html>`
- 'c' = from `<div class=...>` or `<title>`

---

### Secondary Issue: Non-JSON Error Handling (ALSO FIXED)

**NEW CODE (Lines 438-444):**
```javascript
// ✅ FIX: Check Content-Type before parsing JSON
const contentType = res.headers.get('content-type');
let data;

if (contentType && contentType.includes('application/json')) {
  data = await res.json();
} else {
  // Backend returned HTML or non-JSON response
  throw new Error(`Backend returned ${res.status} with content-type: ${contentType || 'unknown'}. Expected JSON. Response: ${await res.text()}`);
}
```

**Benefit:** User sees actual error message instead of generic "not valid JSON" error

---

## ✅ FRONTEND CHANGES APPLIED

### File: `portfulio-2/script.js`

| Line(s) | Change | Type | Reason |
|---------|--------|------|--------|
| 411 | `window.location.origin` → `'https://portfolio-backend-qtrl.onrender.com'` | Critical | Use correct backend URL in production |
| 438-444 | Added `contentType` check before `res.json()` | Safety | Prevent parse errors on HTML responses |
| 441 | Enhanced error message with status code & content-type | Diagnostic | Better debugging information |

### Changes Made:

```diff
- const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
-   ? 'http://localhost:5000'
-   : window.location.origin;
+ const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
+   ? 'http://localhost:5000'
+   : 'https://portfolio-backend-qtrl.onrender.com';

- const data = await res.json();
+ const contentType = res.headers.get('content-type');
+ let data;
+ 
+ if (contentType && contentType.includes('application/json')) {
+   data = await res.json();
+ } else {
+   throw new Error(`Backend returned ${res.status} with content-type: ${contentType || 'unknown'}. Expected JSON. Response: ${await res.text()}`);
+ }
```

---

## ⚠️ BACKEND VERIFICATION REQUIRED

### Backend Must Have:

#### 1. **CORS Configured** (Critical)
```javascript
const cors = require('cors');

app.use(cors({
  origin: 'https://portfulio-2.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
```

#### 2. **POST /api/contact Route** (Critical)
```javascript
app.post('/api/contact', async (req, res) => {
  try {
    const { firstName, lastName, email, subject, message, website } = req.body;
    
    // Validate honeypot
    if (website) {
      return res.status(400).json({ success: false, message: 'Spam detected' });
    }
    
    // Validate required fields
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Save to MongoDB
    const newMessage = new Message({
      firstName,
      lastName,
      email,
      subject: subject || '',
      message,
      createdAt: new Date(),
    });
    
    await newMessage.save();
    
    // Send email via Resend
    try {
      await resend.emails.send({
        from: 'contact@yourdomain.com',
        to: email,
        subject: `Re: ${subject || 'Your Message'}`,
        html: '<p>Thank you for reaching out!</p>',
      });
    } catch (emailErr) {
      console.warn('Email send failed (non-blocking):', emailErr);
      // Continue even if email fails
    }
    
    // ✅ Always return JSON
    return res.json({ success: true, message: 'Message received successfully' });
  } catch (error) {
    console.error('Contact endpoint error:', error);
    // ✅ Always return JSON, even on error
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});
```

#### 3. **Error Handling** (Critical)
- **All endpoints must return JSON**, never HTML
- **All error paths must include** `{ success: false, message: "..." }`
- **Middleware errors must be caught** (not return express error page HTML)

#### 4. **MongoDB Connection** (Already working ✅)
- Logs show: "MongoDB Connected 🚀"

#### 5. **Health Endpoint** (Already working ✅)
- `GET /api/health` returns JSON successfully

---

## 🧪 TESTING CHECKLIST

### Test 1: Backend Accessibility
```bash
curl -X GET https://portfolio-backend-qtrl.onrender.com/api/health -i

# Expected:
# HTTP/1.1 200 OK
# Content-Type: application/json
# {"status":"ok","timestamp":"..."}
```

### Test 2: POST Endpoint Reachability
```bash
curl -X POST https://portfolio-backend-qtrl.onrender.com/api/contact \
  -H "Content-Type: application/json" \
  -H "Origin: https://portfulio-2.vercel.app" \
  -d '{
    "firstName":"Test",
    "lastName":"User",
    "email":"test@example.com",
    "subject":"Test Message",
    "message":"This is a test message to verify the backend is working correctly.",
    "website":""
  }' -i

# Expected:
# HTTP/1.1 200 OK
# Content-Type: application/json
# Access-Control-Allow-Origin: https://portfulio-2.vercel.app
# {"success":true,"message":"Message received successfully"}
```

### Test 3: CORS Preflight
```bash
curl -X OPTIONS https://portfolio-backend-qtrl.onrender.com/api/contact \
  -H "Origin: https://portfulio-2.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -i

# Expected:
# HTTP/1.1 200 OK
# Access-Control-Allow-Origin: https://portfulio-2.vercel.app
# Access-Control-Allow-Methods: GET, POST, OPTIONS
```

### Test 4: Frontend Form Submission
1. Go to `https://portfulio-2.vercel.app`
2. Open DevTools (F12)
3. Go to **Console** tab
4. Fill contact form with valid data
5. Click "Send Message"
6. Check **Network** tab:
   - Request URL: `https://portfolio-backend-qtrl.onrender.com/api/contact`
   - Request Method: `POST`
   - Response Status: `200` (or appropriate success code)
   - Response Headers: `Content-Type: application/json`
   - Response Body: `{"success":true,...}`

### Test 5: Error Handling
Submit form with:
- Empty fields → should show field validation errors
- Invalid email → should show email validation error
- Then submit successfully → should show "Message sent successfully"

---

## 🚨 If Form Still Fails

### Check 1: Backend Route Not Found
**Symptom:** Response status 404, content-type text/html

**Solution:**
- Verify `/api/contact` POST route exists in backend
- Check Express app setup and middleware order

### Check 2: CORS Blocked
**Symptom:** Console error: "Access to XMLHttpRequest... blocked by CORS policy"

**Solution:**
- Add CORS middleware to Express app
- Set `origin: 'https://portfulio-2.vercel.app'`

### Check 3: Backend Crashed
**Symptom:** Connection refused / timeout

**Solution:**
- Check Render dashboard for error logs
- Verify MongoDB connection string in environment variables
- Verify Resend API key in environment variables

### Check 4: Non-JSON Response
**Symptom:** Error shows response content-type and HTML snippet

**Solution:**
- The backend is returning HTML (probably error page)
- Check backend logs for stack trace
- Verify all error paths return JSON

---

## 📋 IMPLEMENTATION CHECKLIST

### Frontend ✅ DONE
- [x] Fixed API_BASE URL to use Render backend
- [x] Added Content-Type validation before JSON parsing
- [x] Enhanced error messages for debugging
- [x] Committed to GitHub
- [x] Vercel will auto-deploy

### Backend ⏳ TODO
- [ ] Verify CORS middleware is configured
- [ ] Verify POST /api/contact route exists
- [ ] Verify all error paths return JSON (not HTML)
- [ ] Verify MongoDB connection
- [ ] Verify Resend API key
- [ ] Test endpoint with curl
- [ ] Test from frontend

### Monitoring ⏳ TODO
- [ ] Check Render logs after first request
- [ ] Verify message saved to MongoDB
- [ ] Verify email sent via Resend
- [ ] Monitor for errors in browser console

---

## 📝 NEXT STEPS

### Immediate Actions:

1. **Verify Backend Configuration** (Required)
   - SSH into your Render backend OR check Render dashboard
   - Find the backend source code repository
   - Ensure `/api/contact` POST route exists
   - Ensure CORS is configured for `https://portfulio-2.vercel.app`

2. **Test Endpoint with curl** (5 minutes)
   ```bash
   curl -X POST https://portfolio-backend-qtrl.onrender.com/api/contact \
     -H "Content-Type: application/json" \
     -d '{"firstName":"Test","lastName":"User","email":"test@example.com","subject":"Test","message":"This is a test message to verify the backend is working"}'
   ```

3. **Test Frontend Form** (2 minutes)
   - Go to `https://portfulio-2.vercel.app`
   - Fill form and submit
   - Check browser console for errors

4. **Monitor Backend Logs** (Ongoing)
   - Check Render dashboard for any error logs
   - Look for MongoDB connection issues
   - Look for Resend email failures

---

## 🎯 EXPECTED BEHAVIOR (After All Fixes)

### Success Flow:
1. User fills contact form ✓
2. Frontend sends POST to `https://portfolio-backend-qtrl.onrender.com/api/contact` ✓
3. Backend validates data ✓
4. Backend saves to MongoDB ✓
5. Backend sends email via Resend ✓
6. Backend returns `{ "success": true }` ✓
7. Frontend shows "Message sent successfully!" ✓

### Error Flow:
1. User fills form with invalid data ✓
2. Frontend shows validation errors ✓
3. User corrects and submits ✓
4. Backend processes message ✓
5. Frontend shows success message ✓

---

## 📞 SUPPORT RESOURCES

- **Render Documentation:** https://render.com/docs
- **Express CORS:** https://expressjs.com/en/resources/middleware/cors.html
- **MongoDB Connection:** https://docs.mongodb.com/manual/reference/connection-string/
- **Resend API:** https://resend.com/docs

---

## SUMMARY

| Component | Status | Action Required |
|-----------|--------|-----------------|
| Frontend API URL | ✅ FIXED | None |
| Error Handling | ✅ IMPROVED | None |
| Backend CORS | ⏳ VERIFY | Check backend code |
| Backend Route | ⏳ VERIFY | Check backend code |
| MongoDB | ✅ CONNECTED | None |
| Email Service | ⏳ VERIFY | Check Resend key |

**Expected deployment time:** Frontend changes live immediately (Vercel auto-deploys). Backend verification: 15-30 minutes.
