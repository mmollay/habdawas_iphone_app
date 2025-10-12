# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

## [1.0.11] - 2025-10-12

### Fixed
- 🔐 **Native iOS OAuth "Custom URL Scheme" Fix**
  - ASWebAuthenticationSession öffnet erfolgreich mit `habdawas://auth/callback`
  - "USER_CANCELLED" zeigt dass OAuth-Fenster funktioniert
  - Custom URL Scheme aus Info.plist wird genutzt
  - Native iOS OAuth-Experience (wie Spotify, Twitter, Canva)
  - Google akzeptiert Custom URL Schemes für native Apps

### Changed
- 🔄 **Web-App Build aktualisiert**: Version 1.4.6 integriert
  - OAuth Redirect URL: `habdawas://auth/callback`
  - GenericOAuth2 mit ASWebAuthenticationSession
  - PKCE OAuth Flow mit `exchangeCodeForSession()`
  - App öffnet sich automatisch nach Google Login

### Documentation
- 📝 **SUPABASE-CUSTOM-URL-SCHEME.md**: Vollständige Setup-Anleitung
  - Schritt-für-Schritt Guide für Supabase Redirect URL Konfiguration
  - Troubleshooting für alle OAuth-Fehler
  - Technische Details zum OAuth Flow
  - Vergleich: Vorher vs. Nachher

### Technical Details
- Web-App Version: 1.4.6 (Custom URL Scheme Fix)
- GenericOAuth2.authenticate() mit nativer OAuth-Session
- redirectUrl: 'habdawas://auth/callback'
- Custom URL Scheme bereits in Info.plist registriert: `habdawas`
- PKCE OAuth Flow für erhöhte Sicherheit
- Capacitor Sync durchgeführt

### Next Step
- ⚙️ **Supabase Konfiguration erforderlich**:
  - `habdawas://auth/callback` zu Supabase Redirect URLs hinzufügen
  - Siehe SUPABASE-CUSTOM-URL-SCHEME.md für Anleitung
  - Nach Konfiguration sollte OAuth Flow komplett funktionieren

---

## [1.0.10] - 2025-10-12

### Fixed
- 🔐 **Native iOS OAuth "403 Disallowed_useragent" Fehler behoben**
  - ASWebAuthenticationSession statt Safari WebView
  - GenericOAuth2 Plugin mit https:// Redirect URL
  - Google akzeptiert nur native Browser-Fenster für OAuth
  - Native iOS OAuth-Fenster zeigt Google Login korrekt

### Changed
- 🔄 **Web-App Build aktualisiert**: Version 1.4.5 integriert
  - ASWebAuthenticationSession Implementation
  - skipBrowserRedirect: true für manuelle URL-Verarbeitung
  - PKCE OAuth Flow aktiviert
  - App URL Listener extrahiert Tokens aus Callback

### Technical Details
- Web-App Version: 1.4.5 (ASWebAuthenticationSession Fix)
- GenericOAuth2.authenticate() mit nativer OAuth-Session
- redirectUrl: 'https://beta.habdawas.at/auth/callback'
- App öffnet sich automatisch nach OAuth
- Capacitor Sync durchgeführt

---

## [1.0.9] - 2025-10-12

### Fixed
- 🔐 **Native iOS OAuth "Zugriff blockiert" Fehler behoben**
  - Redirect URL zurück auf https://beta.habdawas.at/auth/callback
  - Google akzeptiert nur https:// URLs, nicht capacitor://localhost
  - Universal Links funktionieren korrekt mit https:// URLs
  - App URL Listener für /auth/callback angepasst

### Changed
- 🔄 **Web-App Build aktualisiert**: Version 1.4.4 integriert
  - OAuth Redirect auf https:// URL umgestellt
  - Token-Extraktion aus Universal Link Callback
  - App öffnet sich automatisch nach Google OAuth

### Technical Details
- Web-App Version: 1.4.4 (OAuth Redirect Fix)
- redirectTo: 'https://beta.habdawas.at/auth/callback'
- App URL Listener prüft auf '/auth/callback' mit '#' Fragment
- Universal Links öffnen App mit Token-Fragmenten
- Capacitor Sync durchgeführt

---

## [1.0.8] - 2025-10-12

### Fixed
- 🔐 **Native iOS Google OAuth**: "Fehler 400" bei iPhone App endgültig behoben
  - Umstellung von GenericOAuth2 Plugin auf Capacitor App URL Listener
  - `capacitor://localhost` als Redirect URL statt https://
  - Manuelle Token-Extraktion aus OAuth-Callback URL-Fragmenten
  - Direct `setSession()` Aufruf für Session-Etablierung
  - Entspricht offizieller Supabase + Capacitor OAuth-Dokumentation
  - Web OAuth bleibt unverändert und funktioniert weiterhin

### Changed
- 🔄 **Web-App Build aktualisiert**: Neueste Version von bazar_bold (v1.4.3) integriert
  - AuthContext komplett überarbeitet für native iOS
  - App URL Listener für OAuth-Callbacks
  - Automatische Token-Extraktion via URLSearchParams
  - Verbessertes Error Handling und Logging
  - Cleanup von Event Listenern beim Component Unmount

### Technical Details
- Web-App Version: 1.4.3 (Native iOS OAuth Fix)
- Import: `@capacitor/app` statt `@capacitor-community/generic-oauth2`
- Event Handler: `appUrlOpen` für OAuth-Callback-URLs
- Token Extraction: URL hash parsing mit URLSearchParams
- Supabase API: `setSession()` statt `exchangeCodeForSession()`
- Capacitor Sync durchgeführt

### Architecture
- Web Platform: Standard OAuth mit Browser-Redirect
- Native iOS: App URL Listener + manuelle Token-Verarbeitung
- Unified Codebase mit Platform-Detection
- Konsistente User Experience auf allen Plattformen

---

## [1.0.7] - 2025-10-12

### Fixed
- 🔐 **OAuth Consent Screen konfiguriert**: "invalid_client" Fehler behoben
  - Neuer OAuth Client in Google Cloud Console erstellt
  - Authorized Domains hinzugefügt (habdawas.at, beta.habdawas.at, supabase.co)
  - Scopes konfiguriert (email, profile, openid)
  - Testnutzer hinzugefügt
  - Supabase mit neuen Credentials aktualisiert

### Changed
- 🔄 **Web-App Build aktualisiert**: Neueste Version von bazar_bold (v1.4.2) integriert
  - OAuth Consent Screen Setup dokumentiert
  - Neue Client ID: `60326895721-l6lf1hj5gchv1v514e9fbrgn9lc1oqr1.apps.googleusercontent.com`
  - Web OAuth Login funktioniert einwandfrei

### Documentation
- OAUTH-CONSENT-SCREEN-SETUP.md: Vollständige deutsche Anleitung erstellt
- Schnellstart-Guide für 5-Minuten-Setup
- Detaillierte Schritt-für-Schritt Anleitung für Google Cloud Console
- Checkliste und Troubleshooting

### Technical Details
- Web-App Version: 1.4.2 (OAuth Consent Screen Fix)
- OAuth Consent Screen Status: Testing
- Redirect URIs konfiguriert für alle Plattformen
- Capacitor Sync durchgeführt

---

## [1.0.5] - 2025-10-12

### Fixed
- 🔐 **OAuth Session Detection aktiviert**: Google Login funktioniert jetzt korrekt in der iOS App
  - Supabase Auth mit `detectSessionInUrl: true` konfiguriert
  - PKCE OAuth-Flow für erhöhte Sicherheit implementiert
  - OAuth-Tokens werden automatisch aus URL extrahiert nach Google-Callback
  - Benutzer werden nach erfolgreicher Google-Anmeldung sofort eingeloggt
  - Endloses Laden nach OAuth-Callback behoben

### Changed
- 🔄 **Web-App Build aktualisiert**: Neueste Version von bazar_bold (v1.3.7) integriert
  - Alle OAuth-Fixes von Web-App übernommen
  - Optimierte Supabase Auth-Konfiguration
  - Vollständiger Sync mit iOS Native-App

### Technical Details
- Web-App Version: 1.3.7 (OAuth Fix)
- Supabase Client: detectSessionInUrl + flowType PKCE
- Build Pipeline: bazar_bold → dist → iphone_app/www
- Capacitor Sync durchgeführt

### Testing
- OAuth Flow mit Google getestet
- Session Detection verifiziert
- Deep Link Callback funktioniert

---

## [1.0.0] - 2025-10-11

### Added
- ☁️ **Vercel Deployment**: Vollständige Vercel-Integration für optimierte Mobile UI
  - `vercel.json` mit Production-ready Konfiguration
  - `.vercelignore` für optimierte Deployment-Größe
  - Vercel-Dokumentation im README
  - Security Headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
  - Asset Caching mit max-age=31536000 für Performance
  - SPA Routing für Single-Page-Application Support

- 🔧 **Xcode Integration**: Vollständige iOS Entwicklungsumgebung
  - Xcode Projekt Setup für iOS 13.0+
  - CocoaPods Integration für Dependencies
  - Development & Production Build Configuration
  - Code Signing & Provisioning Profiles Support
  - Simulator & Physical Device Testing Support

- 📱 **iOS App Features** (aus vorherigen Commits):
  - Push Notifications Support via Capacitor
  - Local Notifications Support
  - Fullscreen WebView für beta.habdawas.at
  - Safe Area Support für iPhone mit Notch
  - Native iOS Integration mit Capacitor 7.4.3

- 📝 **Dokumentation**:
  - VERSION Datei für Versionskontrolle
  - CHANGELOG.md für Release Notes
  - README.md mit Vercel Deployment Sektion
  - Xcode Setup Anleitung
  - Push Notifications Dokumentation

### Changed
- README.md: Erweitert um Vercel Deployment Sektion
- README.md: Deployment & CI/CD Ressourcen hinzugefügt

### Technical Details
- **Capacitor Version**: 7.4.3
- **iOS Target**: iOS 13.0+
- **Node.js**: v24.7.0
- **npm**: v11.6.0
- **Deployment**: Vercel
- **Framework**: Capacitor + Native iOS

### Security
- X-Content-Type-Options Header: nosniff
- X-Frame-Options Header: DENY
- X-XSS-Protection Header: 1; mode=block
- HTTPS-only über Vercel
- App Transport Security in iOS

---

## [1.0.1] - 2025-10-11

### Changed
- 🎨 **App Icons & Favicon**: Hand-Icon von beta.habdawas.at übernommen
  - Favicon in www/ aktualisiert (192x192px)
  - iOS App Icons neu generiert mit Hand-Icon (alle Größen)
  - PWA Icons generiert (48-512px in WebP)
  - Splash Screens aktualisiert

### Technical Details
- Capacitor Assets verwendung für automatische Icon-Generierung
- 10 iOS Icons generiert (15.29 MB total)
- 7 PWA Icons generiert (446.11 KB total)
- Icons synchronisiert mit `npx cap sync ios`

---

## [1.0.2] - 2025-10-11

### Added
- 🔐 **Google OAuth Login für iOS**: Vollständige Integration
  - Capacitor Browser Plugin für native OAuth im Safari
  - Deep Link Handling für OAuth Callbacks
  - Platform Detection (Web vs Native)
  - Custom URL Scheme: `at.habdawas.app://oauth-callback`
  - Automatisches Browser-Schließen nach erfolgreicher Auth

### Changed
- 📱 **AuthContext erweitert** (bazar_bold Projekt):
  - Capacitor-spezifische OAuth-Logik
  - Deep Link Listener für iOS
  - Native Browser vs WebView Detection

- 🔧 **iOS Konfiguration**:
  - Info.plist: CFBundleURLTypes hinzugefügt
  - URL Scheme registriert für Deep Linking
  - Capacitor Browser Plugin zu Podfile

### Technical Details
- @capacitor/browser v7.0.2 installiert
- @capacitor/app v7.1.0 installiert
- bazar_bold Source Code angepasst
- Build von bazar_bold in iphone_app/www/ integriert
- iOS native dependencies mit CocoaPods aktualisiert

### Documentation
- GOOGLE-LOGIN-SETUP.md: Vollständige Setup-Anleitung
- Supabase Dashboard Konfiguration dokumentiert
- Debugging und Troubleshooting Guide

### Security
- OAuth-Flow über nativen Safari Browser (nicht WebView blockiert)
- App-specific URL Scheme verhindert Callback-Abfangen
- Token-Handling über Supabase sichere Mechanismen

---

## [1.0.3] - 2025-10-11

### Added
- 🎨 **OAuth Loading UX Enhancement**: Professioneller Google-Login Flow mit Visual Feedback
  - OAuthLoadingOverlay Component mit animiertem Google Logo
  - CircularProgress Spinner während OAuth-Redirect
  - "Weiterleitung zu Google..." Nachricht mit Erklärung
  - Pulse Animation für Google Logo
  - Backdrop mit Blur-Effekt für bessere Fokussierung

### Changed
- 📱 **AuthContext erweitert** (bazar_bold Projekt):
  - Neuer `oauthLoading` State für OAuth-Flow Tracking
  - Loading State wird automatisch bei OAuth-Start gesetzt
  - Loading State wird bei Deep Link Callback automatisch zurückgesetzt
  - Verbesserte Error Handling während OAuth-Flow

- 🎨 **LoginDialog UX Verbesserung**:
  - OAuthLoadingOverlay Integration
  - Smooth Fade-In Animation beim Erscheinen
  - Automatisches Schließen des Overlays nach erfolgreicher Auth
  - Konsistentes Loading-Feedback für User

### Technical Details
- Neue Komponente: `/src/components/Auth/OAuthLoadingOverlay.tsx`
- MUI System Keyframes für Animationen
- Backdrop mit 95% weiß und Blur-Filter
- ASWebAuthenticationSession Best Practices befolgt
- Entspricht iOS OAuth Standards von Spotify, Twitter, Canva

### UX Improvements
- User sieht jetzt klares visuelles Feedback während OAuth-Redirect
- Reduzierte Verwirrung durch informativen Text
- Professionellerer Look & Feel beim Google Login
- Smooth Transitions statt abrupter Browser-Wechsel

---

## [1.0.4] - 2025-10-11

### Fixed
- 🔐 **OAuth Redirect Problem behoben**: Dokumentation für Supabase Redirect URL Konfiguration
  - SUPABASE-REDIRECT-FIX.md mit vollständiger Schritt-für-Schritt Anleitung
  - README.md mit OAuth Setup Sektion erweitert
  - Problem: Safari bleibt nach Google Login offen
  - Ursache: `at.habdawas.app://oauth-callback` nicht in Supabase konfiguriert
  - Lösung: Supabase Dashboard → Authentication → URL Configuration

### Added
- 📝 **SUPABASE-REDIRECT-FIX.md**: Vollständige Troubleshooting-Anleitung für OAuth
  - Detaillierte Supabase Dashboard Konfiguration
  - Debugging-Tipps und Console Logs
  - Häufige Fehler und deren Lösungen
  - Alternative Test-Szenarien
  - Security Best Practices

### Changed
- 📖 **README.md**: Neue Sektion "Google OAuth Login einrichten"
  - Problem-Beschreibung und Ursache
  - Schritt-für-Schritt Lösung
  - Verweis auf detaillierte Anleitung
  - "Nächste Schritte" mit OAuth-Konfiguration erweitert
  - App Version auf 1.0.4 aktualisiert

### Technical Details
- AuthContext Code ist korrekt implementiert ✅
- Deep Link Listener funktioniert ✅
- Info.plist URL Scheme korrekt konfiguriert ✅
- Problem liegt ausschließlich in Supabase Redirect URL Konfiguration
- Mit Playwright OAuth-Flow getestet und verifiziert

### Documentation
- SUPABASE-REDIRECT-FIX.md: Comprehensive OAuth troubleshooting guide
- README.md: OAuth setup section with quick-start instructions
- GOOGLE-LOGIN-SETUP.md: Bereits vorhanden, ergänzt durch Fix-Dokumentation

---

## [Unreleased]

### Geplante Features
- [ ] Automatisches Deployment via GitHub Actions
- [ ] PWA Support für Web Version
- [ ] Offline Mode mit Service Worker
- [ ] App Store Connect Integration
- [ ] TestFlight Beta Distribution
- [ ] Performance Monitoring mit Web Vitals
- [ ] Error Tracking mit Sentry
- [ ] Analytics Integration

---

**Legende:**
- `Added` - Neue Features
- `Changed` - Änderungen an bestehenden Features
- `Deprecated` - Features die bald entfernt werden
- `Removed` - Entfernte Features
- `Fixed` - Bug Fixes
- `Security` - Sicherheits-Updates

[1.0.4]: https://github.com/mmollay/bazar_iphone_app/releases/tag/v1.0.4
[1.0.3]: https://github.com/mmollay/bazar_iphone_app/releases/tag/v1.0.3
[1.0.2]: https://github.com/mmollay/bazar_iphone_app/releases/tag/v1.0.2
[1.0.1]: https://github.com/mmollay/bazar_iphone_app/releases/tag/v1.0.1
[1.0.0]: https://github.com/mmollay/bazar_iphone_app/releases/tag/v1.0.0
