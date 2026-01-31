# 🔒 Content Security Policy (CSP) Configuration

## Overview
CasaGestión implements a strict Content Security Policy to prevent XSS attacks, data injection, and other security vulnerabilities.

## 🛡️ Security Configuration

### Production CSP
```
default-src 'self'; 
script-src 'self'; 
style-src 'self' 'unsafe-inline'; 
img-src 'self' data: blob:; 
font-src 'self' data:; 
connect-src 'self' http://localhost:3001; 
media-src 'self'; 
object-src 'none'; 
base-uri 'self'; 
form-action 'self'; 
frame-ancestors 'none'; 
upgrade-insecure-requests; 
worker-src 'self'
```

### Development CSP
```
default-src 'self'; 
script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
style-src 'self' 'unsafe-inline'; 
img-src 'self' data: blob: http://localhost:* https://localhost:*; 
font-src 'self' data:; 
connect-src 'self' ws: wss: http://localhost:* https://localhost:*; 
media-src 'self'; 
object-src 'none'; 
base-uri 'self'; 
form-action 'self'; 
frame-ancestors 'none'
```

## 📋 Security Headers

### Production Headers
- **Content-Security-Policy**: Strict CSP as above
- **X-Content-Type-Options**: `nosniff`
- **X-Frame-Options**: `DENY`
- **X-XSS-Protection**: `1; mode=block`
- **Referrer-Policy**: `strict-origin-when-cross-origin`
- **Strict-Transport-Security**: `max-age=31536000; includeSubDomains; preload`
- **Permissions-Policy**: Disabled geolocation, microphone, camera, payment, USB, sensors
- **Cache-Control**: `public, max-age=31536000, immutable`

### Development Headers
- **Content-Security-Policy**: More permissive for development
- **X-Content-Type-Options**: `nosniff`
- **X-Frame-Options**: `DENY`
- **X-XSS-Protection**: `1; mode=block`
- **Referrer-Policy**: `strict-origin-when-cross-origin`
- **Permissions-Policy**: Disabled sensitive APIs

## 🎯 Security Features

### 1. **Default-Deny Policy**
- `default-src 'self'` blocks all external resources by default
- Only resources from same origin are allowed

### 2. **External Connection Blocking**
- `connect-src 'self'` blocks all external API calls
- Only allows connections to local API server (localhost:3001)
- Prevents data exfiltration to external services

### 3. **Script Security**
- `script-src 'self'` blocks external JavaScript
- Development mode allows `unsafe-inline` and `unsafe-eval` for React dev tools
- Production mode blocks all inline scripts

### 4. **Clickjacking Prevention**
- `frame-ancestors 'none'` prevents page from being framed
- `X-Frame-Options: DENY` provides fallback protection

### 5. **XSS Protection**
- `X-XSS-Protection: 1; mode=block` enables browser XSS filtering
- CSP prevents inline script execution in production

### 6. **Content Type Protection**
- `X-Content-Type-Options: nosniff` prevents MIME-type sniffing
- Forces browser to respect declared content types

## 🔧 Configuration Files

### `vite.config.ts`
- CSP generation based on environment
- Security headers for development and production
- Build optimization for CSP compatibility

### `index.html`
- CSP meta tag as fallback
- No external CDN dependencies
- Local Tailwind CSS via PostCSS

## 🚫 Blocked Connections

### External APIs Blocked
- Google Analytics
- Facebook Pixel
- External CDN resources
- Third-party marketing scripts
- Remote analytics services

### Allowed Connections
- `http://localhost:3001/api/*` (Local API server)
- WebSocket connections in development
- Same-origin resources only

## 🧪 Testing

### CSP Test Page
Open `csp-test.html` to verify:
- CSP header detection
- External script blocking
- API connectivity
- Inline script behavior

### Manual Testing Checklist
- [ ] External scripts fail to load
- [ ] Local API calls work (localhost:3001)
- [ ] Application functions normally
- [ ] No CSP violations in browser console
- [ ] Service worker registers correctly

## 🔄 Migration Notes

### Removed Dependencies
- **Tailwind CSS CDN**: Replaced with local PostCSS build
- **External JavaScript**: All scripts now bundled locally
- **Google Gemini SDK**: Replaced with local API calls

### Security Improvements
- Zero external resource dependencies
- All AI processing on secure backend
- No API keys exposed to frontend
- Strict connection filtering

## 📊 Compliance

### Security Standards
- ✅ OWASP CSP Guidelines
- ✅ Modern browser security best practices
- ✅ PWA security requirements
- ✅ GDPR compliance (no external tracking)

### Browser Support
- ✅ Chrome 25+
- ✅ Firefox 23+
- ✅ Safari 7+
- ✅ Edge 14+

## 🚨 Troubleshooting

### Common Issues

1. **CSP Violations in Console**
   - Check for external resource loading
   - Verify API endpoints use localhost:3001
   - Remove any external CDN references

2. **Build Failures**
   - Ensure no external script tags in HTML
   - Check PostCSS configuration for Tailwind
   - Verify all dependencies are local

3. **Development Issues**
   - Use localhost for development server
   - Check that VITE_SERVER_URL is set correctly
   - Verify React dev tools compatibility

### Debug Commands
```bash
# Check CSP headers in development
npm run dev

# Verify production build
npm run build && npm run preview

# Test CSP compliance
open csp-test.html
```

## 📝 Maintenance

### Regular Reviews
- Quarterly CSP policy review
- Monitor CSP violation reports
- Update allowed origins as needed
- Security audit checklist

### Updates Required When
- Adding new external dependencies
- Changing API server configuration
- Updating security requirements
- New browser security features