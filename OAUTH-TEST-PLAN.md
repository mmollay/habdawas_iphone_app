# Google OAuth mit Universal Links - Test Plan

## Übersicht

Nach der Xcode-Konfiguration (siehe `XCODE-SETUP-WITH-DEVELOPER-ACCOUNT.md`) müssen wir den kompletten OAuth Flow testen.

## Voraussetzungen

- ✅ Xcode mit Apple Developer Account konfiguriert
- ✅ Associated Domains Capability aktiviert
- ✅ App auf echtem iOS-Gerät installiert (Universal Links funktionieren NICHT im Simulator!)
- ✅ AASA-Datei deployed auf `https://beta.habdawas.at/.well-known/apple-app-site-association`

## Test 1: AASA-Datei Verifizierung

### Ziel
Sicherstellen, dass die Apple App Site Association Datei korrekt deployed ist.

### Schritte
```bash
# 1. AASA-Datei abrufen
curl -v https://beta.habdawas.at/.well-known/apple-app-site-association

# 2. Erwartetes Ergebnis:
# - HTTP/2 200 Status
# - Content-Type: application/json
# - JSON mit appID: "G5QYXZ4B6L.at.habdawas.app"
# - Paths: ["/auth/callback", "/auth/*"]
```

### Validierung
```bash
# Apple AASA Validator (optional)
# https://search.developer.apple.com/appsearch-validation-tool/
```

**Status:** ✅ Bereits verifiziert, funktioniert

---

## Test 2: Universal Link Erkennung

### Ziel
Verifizieren, dass iOS die App mit Universal Links assoziiert.

### Schritte auf dem iPhone

1. **App neu installieren** (wichtig für AASA Cache):
   - App vom iPhone löschen
   - Von Xcode neu builden und installieren

2. **Universal Link manuell testen:**
   - Öffne **Notes** oder **Nachrichten** App
   - Tippe: `https://beta.habdawas.at/auth/callback?test=1`
   - Halte den Link lange gedrückt (Long Press)

### Erwartetes Ergebnis

**✅ Universal Links funktionieren:**
- iOS zeigt im Kontext-Menu: **"Open in HabDaWas"**
- Nach Klick öffnet sich die App direkt

**❌ Universal Links funktionieren NICHT:**
- Link öffnet sich in Safari
- Kein "Open in HabDaWas" Menu-Option

### Troubleshooting bei Fehler

1. **App komplett löschen und neu installieren**
2. **iPhone neu starten** (iOS cached AASA-Dateien aggressiv)
3. **Netzwerk-Verbindung prüfen** (iOS lädt AASA bei App-Installation)
4. **Apple Developer Portal prüfen:**
   - [developer.apple.com/account](https://developer.apple.com/account/)
   - Identifiers → `at.habdawas.app`
   - Associated Domains aktiviert?

---

## Test 3: Google OAuth Flow - Web (Baseline)

### Ziel
Verifizieren, dass OAuth im Web funktioniert (Baseline für mobile Tests).

### Schritte

1. Öffne: `http://localhost:5173` oder `https://beta.habdawas.at`
2. Klicke auf **"Mit Google anmelden"**
3. Google Login durchführen
4. Nach Redirect: Sollte eingeloggt sein

### Erwartetes Ergebnis

- ✅ Login erfolgreich
- ✅ User ist eingeloggt
- ✅ Session persistiert nach Page Reload

### Log-Ausgaben überprüfen

Browser Console sollte zeigen:
```
[OAuth] Starting web OAuth...
[OAuth Callback] Processing URL...
[OAuth Callback] Web platform - exchanging code for session...
[OAuth Callback] Success! Redirecting to home...
```

**Status:** Sollte funktionieren (bereits implementiert)

---

## Test 4: Google OAuth Flow - iOS mit Universal Links

### Ziel
Vollständiger Test des Google OAuth Flows mit Universal Links auf iOS.

### Schritte

1. **App auf iPhone öffnen**
2. **Auf "Mit Google anmelden" klicken**
3. **Safari öffnet sich** mit Google Login
4. **Google Login durchführen**
5. **OAuth Callback:**
   - Google redirected zu: `https://beta.habdawas.at/auth/callback?platform=ios#access_token=...`
   - **Universal Link sollte App automatisch öffnen**
6. **Session wird gesetzt**
7. **User ist eingeloggt**

### Erwartetes Ergebnis

**✅ Idealer Flow (mit Universal Links):**
```
1. User klickt "Mit Google anmelden"
   → Safari öffnet sich
2. User authentifiziert sich bei Google
   → Google redirected zu beta.habdawas.at/auth/callback?platform=ios
3. Universal Link wird erkannt
   → iOS öffnet HabDaWas App automatisch
4. App extrahiert Tokens aus URL
   → Session wird gesetzt
5. User ist eingeloggt ✅
```

**⚠️ Fallback Flow (ohne Universal Links):**
```
1. User klickt "Mit Google anmelden"
   → Safari öffnet sich
2. User authentifiziert sich bei Google
   → Google redirected zu beta.habdawas.at/auth/callback?platform=ios
3. OAuthCallbackPage lädt
   → JavaScript redirected zu habdawas://auth/callback#access_token=...
4. Custom URL Scheme öffnet App
5. App extrahiert Tokens
   → Session wird gesetzt
6. User ist eingeloggt ✅
```

### Log-Ausgaben überprüfen

**In der App (Xcode Console):**
```
[OAuth] Starting native iOS OAuth with Universal Link strategy...
[OAuth] Redirect URL: https://beta.habdawas.at/auth/callback?platform=ios
[OAuth] OAuth URL received
[OAuth] Opening Safari with OAuth URL...

// Nach Google Login und Redirect:
[OAuth] App URL opened: https://beta.habdawas.at/auth/callback?platform=ios#access_token=...
[OAuth] Processing OAuth callback from Universal Link / deep link...
[OAuth] Access token present: true
[OAuth] Refresh token present: true
[OAuth] Setting session with tokens from deep link...
[OAuth] Session established successfully!
[OAuth] User: user@example.com
```

**In Safari (falls Fallback):**
```
[OAuth Callback] Processing URL: https://beta.habdawas.at/auth/callback?platform=ios#...
[OAuth Callback] Platform: Native iOS (from URL param)
[OAuth Callback] Native iOS request detected!
[OAuth Callback] ✅ Universal Links will open the app automatically!
[OAuth Callback] ✅ Tokens verified! Redirecting to app...
[OAuth Callback] Redirecting to: habdawas://auth/callback#access_token=...
```

---

## Test 5: Session Persistenz

### Ziel
Verifizieren, dass die OAuth Session nach App-Neustart erhalten bleibt.

### Schritte

1. **Login mit Google OAuth** (Test 4)
2. **Verifiziere: User ist eingeloggt**
3. **App komplett schließen:**
   - Swipe up im App Switcher
4. **App neu öffnen**

### Erwartetes Ergebnis

- ✅ User ist noch eingeloggt
- ✅ Keine erneute Anmeldung nötig
- ✅ Session Token ist in Capacitor Preferences gespeichert

---

## Test 6: Logout

### Ziel
Sauberer Logout inklusive Push Notification Cleanup.

### Schritte

1. **Login mit Google OAuth**
2. **Auf "Abmelden" klicken**

### Erwartetes Ergebnis

- ✅ User ist ausgeloggt
- ✅ Login-Bildschirm wird angezeigt
- ✅ Push Notification Token wird entfernt
- ✅ Nach App-Neustart: User ist noch ausgeloggt

---

## Test 7: Error Handling

### Ziel
Testen wie die App mit Fehlern umgeht.

### Test 7.1: User bricht Google Login ab

**Schritte:**
1. Klicke auf "Mit Google anmelden"
2. Safari öffnet sich
3. **Klicke auf "Abbrechen" im Google Login**

**Erwartetes Ergebnis:**
- App zeigt keine Fehlermeldung (User wollte abbrechen)
- Login-Bildschirm bleibt sichtbar

### Test 7.2: Netzwerkfehler während OAuth

**Schritte:**
1. **Flugmodus aktivieren**
2. Klicke auf "Mit Google anmelden"

**Erwartetes Ergebnis:**
- Error-Handling greift
- Benutzerfreundliche Fehlermeldung
- App stürzt nicht ab

### Test 7.3: Abgelaufene Session

**Schritte:**
1. Login erfolgreich
2. **Warte 60 Minuten** (Supabase Access Token expiry)
3. Versuche, auf geschützte Ressourcen zuzugreifen

**Erwartetes Ergebnis:**
- Supabase erneuert Token automatisch mit Refresh Token
- Oder: User wird aufgefordert, sich neu anzumelden

---

## Test 8: Performance und UX

### Ziel
Sicherstellen, dass der OAuth Flow schnell und flüssig ist.

### Metriken

- **Time to Open Safari:** < 1 Sekunde
- **OAuth Callback Processing:** < 500ms
- **Session Establishment:** < 1 Sekunde
- **Total Login Time:** < 5 Sekunden (abhängig von Google)

### UX-Checks

- ✅ Loading-Indicator wird angezeigt während OAuth läuft
- ✅ Keine "weiße Seite" Momente
- ✅ Smooth Transition zurück zur App
- ✅ User versteht jederzeit was passiert

---

## Test 9: Cross-Platform Konsistenz

### Ziel
Verifizieren, dass die gleiche Session auf Web und iOS funktioniert.

### Schritte

1. **Login auf iOS mit Google**
2. **Öffne beta.habdawas.at im Safari auf dem iPhone**
3. **Login-Status prüfen**

### Erwartetes Ergebnis

- ⚠️ Sessions sind GETRENNT (iOS App vs. Web haben unterschiedliche Storage)
- ✅ Beide Logins sollten funktionieren
- ✅ Gleicher Google Account wird erkannt

---

## Test 10: Apple Review Simulation

### Ziel
Sicherstellen, dass die App den App Store Review besteht.

### Apple Review Guidelines für OAuth

- ✅ **2.1 App Completeness:** OAuth funktioniert ohne Crashes
- ✅ **4.0 Design:** Login ist benutzerfreundlich und intuitiv
- ✅ **5.1.1 Data Collection:** Privacy Policy vorhanden
- ✅ **Sign in with Apple:** Falls Email/Name abgefragt wird, muss auch Sign in with Apple angeboten werden

### Test-Schritte wie Apple Reviewer

1. **Kalter Start:** App zum ersten Mal öffnen
2. **Google Login durchführen**
3. **App Features nutzen**
4. **Logout**
5. **Erneut einloggen**
6. **App löschen und neu installieren**

### Checkliste für App Store Review

- [ ] Privacy Policy URL im App Store Connect eingetragen
- [ ] Data Usage Disclosure in App Store Connect ausgefüllt
- [ ] Demo-Account für Reviewer bereitstellen (falls nötig)
- [ ] Screenshots mit aktuellem Stand
- [ ] Release Notes beschreiben Google OAuth Feature

---

## Problembehandlung - Häufige Fehler

### 1. "No session found" nach OAuth Callback

**Ursache:** Tokens nicht korrekt aus URL extrahiert

**Lösung:**
- Überprüfe `AuthContext.tsx` Lines 74-89
- Console Logs prüfen
- URL Fragment Parsing testen

### 2. Universal Links öffnen Safari statt App

**Ursache:** iOS hat AASA-Datei nicht geladen

**Lösung:**
1. App komplett löschen
2. iPhone neu starten
3. App neu installieren von Xcode
4. 1-2 Minuten warten, bevor Universal Link getestet wird

### 3. "OAuth Error: invalid_request"

**Ursache:** Redirect URL stimmt nicht mit Supabase Konfiguration überein

**Lösung:**
- Supabase Dashboard → Authentication → URL Configuration
- Wildcard sollte vorhanden sein: `https://beta.habdawas.at/**`

### 4. Safari schließt sich nicht nach OAuth

**Ursache:** Browser bleibt offen, App öffnet sich nicht

**Lösung:**
- Universal Links müssen funktionieren (siehe Test 2)
- Oder Custom URL Scheme Fallback greift

---

## Erfolgs-Kriterien

### Minimum Viable Product (MVP)

- ✅ Google OAuth funktioniert auf iOS
- ✅ Session bleibt nach App-Neustart erhalten
- ✅ Logout funktioniert korrekt

### Optimal

- ✅ Universal Links funktionieren (direkter App-Open ohne Zwischenschritt)
- ✅ Schneller Login-Flow (< 5 Sekunden)
- ✅ Keine sichtbaren Errors oder Crashes

### Nice to Have

- ✅ Session-Synchronisation zwischen iOS und Web
- ✅ Biometrische Authentifizierung nach initialem Login
- ✅ Auto-Refresh von abgelaufenen Tokens

---

## Nächste Schritte nach erfolgreichem Test

1. **Dokumentation finalisieren**
2. **Screenshots für App Store erstellen**
3. **Privacy Policy und Terms of Service finalisieren**
4. **Beta-Testing mit TestFlight:**
   - Interne Tester einladen
   - Feedback sammeln
   - Bugs fixen
5. **App Store Submission vorbereiten:**
   - Archive erstellen
   - App Store Connect konfigurieren
   - Review einreichen

---

**Version:** 1.0.0
**Letztes Update:** 2025-10-14
**Status:** Bereit für Testing nach Xcode-Konfiguration
