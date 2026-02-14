# CI/CD, Code Signing & Auto-Update Setup Guide

## Overview

This guide covers:
1. Setting up GitHub Actions for automated builds
2. Configuring code signing for Windows and Mac
3. Setting up the auto-update server
4. Publishing releases

---

## 1. GitHub Actions CI/CD Setup

### Required GitHub Secrets

Add these secrets in your GitHub repository settings (Settings → Secrets and variables → Actions):

#### For Windows Code Signing:
```
WINDOWS_CSC_LINK      - Base64-encoded .pfx certificate file
WINDOWS_CSC_KEY_PASSWORD - Certificate password
```

#### For Mac Code Signing & Notarization:
```
MAC_CSC_LINK          - Base64-encoded .p12 certificate file
MAC_CSC_KEY_PASSWORD  - Certificate password
APPLE_ID              - Your Apple ID email
APPLE_APP_SPECIFIC_PASSWORD - App-specific password from Apple ID
APPLE_TEAM_ID         - Your Apple Developer Team ID
```

#### For Auto-Update Server (Optional):
```
UPDATE_SERVER_URL     - Your update server URL
UPDATE_SERVER_TOKEN   - Authentication token for release notifications
```

### Triggering Builds

#### Automatic (on tag push):
```bash
git tag v1.2.1
git push origin v1.2.1
```

#### Manual (GitHub UI):
1. Go to Actions tab
2. Select "Build and Release Desktop App"
3. Click "Run workflow"
4. Enter version number

---

## 2. Code Signing Setup

### Windows Code Signing

#### Option A: Purchase a Code Signing Certificate
1. Buy from DigiCert, Sectigo, or similar CA
2. Export as .pfx file
3. Encode to base64: `base64 -i certificate.pfx | tr -d '\n'`
4. Add to GitHub Secrets as `WINDOWS_CSC_LINK`

#### Option B: Self-Signed (for testing only)
```powershell
# Create self-signed certificate
New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=StealthInterview" -CertStoreLocation "Cert:\CurrentUser\My"

# Export to .pfx
$pwd = ConvertTo-SecureString -String "YourPassword" -Force -AsPlainText
Export-PfxCertificate -Cert (Get-ChildItem Cert:\CurrentUser\My\<thumbprint>) -FilePath certificate.pfx -Password $pwd
```

### Mac Code Signing & Notarization

#### Prerequisites:
1. Apple Developer Program membership ($99/year)
2. macOS with Xcode installed

#### Step 1: Create Certificates
1. Go to [developer.apple.com/account](https://developer.apple.com/account)
2. Navigate to Certificates, IDs & Profiles
3. Create these certificates:
   - "Developer ID Application" (for distribution)
   - "Developer ID Installer" (for .pkg)

#### Step 2: Export Certificate
```bash
# Export from Keychain Access
# 1. Open Keychain Access
# 2. Find "Developer ID Application: Your Name"
# 3. Right-click → Export → Save as .p12

# Encode to base64
base64 -i certificate.p12 | tr -d '\n' > cert_base64.txt
```

#### Step 3: Create App-Specific Password
1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign In → Security → App-Specific Passwords
3. Generate new password for "StealthInterview Builds"

#### Step 4: Get Team ID
```bash
# Find in developer portal or:
security find-identity -v -p codesigning | grep "Developer ID"
# Output: "Developer ID Application: Your Name (TEAMID)"
```

---

## 3. Auto-Update Server Setup

### Backend Endpoints

The update server provides these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/releases` | POST | Create new release (CI/CD) |
| `/api/releases` | GET | List all releases |
| `/api/releases/latest` | GET | Get latest for all platforms |
| `/api/releases/latest/{platform}` | GET | Get latest for platform |
| `/api/updates/{platform}` | GET | Check for updates |
| `/api/updates/{platform}/latest.yml` | GET | Electron-updater format |

### Creating a Release via API

```bash
curl -X POST "https://your-server.com/api/releases" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.2.1",
    "platform": "windows",
    "download_url": "https://github.com/user/repo/releases/download/v1.2.1/StealthInterview-1.2.1-Windows-Setup.exe",
    "release_notes": "Bug fixes and performance improvements",
    "file_size": 89000000,
    "sha512": "abc123..."
  }'
```

### Electron Configuration

The desktop app is pre-configured to check for updates:

```javascript
// In main.js
autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'https://your-server.com/api/updates/darwin' // or win32/linux
});
```

### GitHub Releases Integration

For automatic GitHub releases integration, the CI/CD workflow:
1. Builds for all platforms
2. Creates GitHub Release with artifacts
3. Optionally notifies your update server

---

## 4. Publishing a Release

### Full Release Process

1. **Update Version**
   ```bash
   # In desktop/package.json, update version
   "version": "1.2.1"
   ```

2. **Commit & Tag**
   ```bash
   git add .
   git commit -m "Release v1.2.1"
   git tag v1.2.1
   git push origin main --tags
   ```

3. **CI/CD Runs Automatically**
   - Builds Windows (.exe)
   - Builds Mac (.dmg for Intel & Apple Silicon)
   - Builds Linux (.AppImage, .deb)
   - Creates GitHub Release
   - Notifies update server

4. **Verify Release**
   - Check GitHub Releases page
   - Test download links
   - Verify auto-update works

### Manual Release (without CI/CD)

```bash
# Build locally
cd desktop
yarn install
yarn build:all

# Upload to GitHub Releases manually
# Or use gh CLI:
gh release create v1.2.1 dist/* --title "v1.2.1" --notes "Release notes here"
```

---

## 5. Troubleshooting

### Windows Build Issues

**"Cannot find certificate"**
- Verify `WINDOWS_CSC_LINK` is properly base64 encoded
- Check password is correct

**"Application is not signed"**
- Certificate may have expired
- Timestamp server may be unreachable

### Mac Build Issues

**"Code signature invalid"**
- Ensure "Developer ID Application" cert is used
- Check entitlements file

**"Notarization failed"**
- App-specific password may have expired
- Check for hardened runtime issues
- Review Apple's notarization logs

**"Not a valid bundle"**
- Ensure Info.plist is valid
- Check bundle identifier matches

### Auto-Update Issues

**"Update check failed"**
- Verify server URL is correct
- Check CORS settings
- Ensure HTTPS is used

**"Update download failed"**
- Verify download URL is accessible
- Check file permissions

---

## 6. Security Best Practices

1. **Never commit secrets** - Use GitHub Secrets or environment variables
2. **Rotate certificates** before expiration
3. **Use HTTPS** for all update communications
4. **Verify checksums** - Always include SHA512 hashes
5. **Sign all releases** - Never distribute unsigned builds
6. **Keep dependencies updated** - Especially Electron and electron-builder

---

## Quick Reference

### Environment Variables

```bash
# Electron app
STEALTH_APP_URL=https://your-app.com
STEALTH_UPDATE_URL=https://your-server.com/api

# Backend
RELEASE_TOKEN=your-secret-token
```

### Useful Commands

```bash
# Check app signature (Mac)
codesign -dvv /Applications/StealthInterview.app

# Verify notarization (Mac)
spctl -a -v /Applications/StealthInterview.app

# Check signature (Windows)
signtool verify /pa /v StealthInterview.exe
```
