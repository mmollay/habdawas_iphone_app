# Universal Links Setup für HabDaWas iOS App

## ✅ Was sind Universal Links?

Universal Links erlauben es, dass `https://beta.habdawas.at/auth/callback` direkt die App öffnet (wenn installiert).

**Vorteile:**
- ✅ Zuverlässiger als Custom URL Schemes (`habdawas://`)
- ✅ Funktioniert aus Safari heraus
- ✅ Verwendet von allen professionellen Apps (Airbnb, Spotify, etc.)
- ✅ Nahtlose User Experience

---

## 📋 Setup Schritte

### 1️⃣ Team ID herausfinden

**In Xcode:**
1. Öffne das Projekt in Xcode
2. Wähle das App Target
3. Gehe zu "Signing & Capabilities"
4. Deine **Team ID** steht neben deinem Apple Developer Account

**Alternativ im Apple Developer Portal:**
1. Gehe zu https://developer.apple.com/account
2. Klicke auf "Membership"
3. Deine **Team ID** steht dort

### 2️⃣ Apple App Site Association File anpassen

Die Datei liegt hier: `/Users/martinmollay/Development/iphone_app/apple-app-site-association`

**Ersetze `TEAM_ID` mit deiner echten Team ID:**

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "DEINE_TEAM_ID.at.habdawas.app",
        "paths": [
          "/auth/callback"
        ]
      }
    ]
  }
}
```

### 3️⃣ File auf Server hochladen

**WICHTIG:** Das File MUSS unter dieser URL erreichbar sein:

```
https://beta.habdawas.at/.well-known/apple-app-site-association
```

**Anforderungen:**
- ✅ HTTPS (nicht HTTP!)
- ✅ Kein `.json` Extension
- ✅ Content-Type: `application/json`
- ✅ Keine Weiterleitung (301/302)
- ✅ Direkt über Root-Domain erreichbar

**Vercel Deployment (falls du Vercel nutzt):**

Erstelle im Root deines Vercel-Projekts:
```
public/.well-known/apple-app-site-association
```

Vercel served Files aus dem `public/` Ordner automatisch.

**Andere Hosting Provider:**

Lege das File in:
```
.well-known/apple-app-site-association
```

im Root deines Web-Projekts.

### 4️⃣ File testen

Teste ob das File erreichbar ist:

```bash
curl -I https://beta.habdawas.at/.well-known/apple-app-site-association
```

Sollte zurückgeben:
```
HTTP/2 200
content-type: application/json
```

**Apple's AASA Validator:**
https://search.developer.apple.com/appsearch-validation-tool

### 5️⃣ Xcode Konfiguration

**In Xcode:**

1. Öffne dein Projekt
2. Wähle das App Target
3. Gehe zu "Signing & Capabilities"
4. Klicke auf "+ Capability"
5. Füge "Associated Domains" hinzu
6. Klicke auf "+" unter "Associated Domains"
7. Füge hinzu: `applinks:beta.habdawas.at`

**Wichtig:**
- Prefix `applinks:` nicht vergessen!
- Keine `https://` davor!
- Keine trailing slashes!

### 6️⃣ Code ist bereits angepasst!

Der Code in der App (v1.0.23+) ist bereits konfiguriert:

- ✅ `App.addListener('appUrlOpen')` fängt Universal Links ab
- ✅ Tokens werden aus URL Fragment extrahiert
- ✅ Session wird mit `setSession()` erstellt

### 7️⃣ OAuth Redirect URL anpassen

Die App verwendet bereits den korrekten Redirect:
```typescript
const redirectUrl = 'https://beta.habdawas.at/auth/callback?platform=ios';
```

Das ist perfekt für Universal Links!

---

## 🧪 Testen

### Nach dem Setup:

1. **Clean Build in Xcode:**
   ```
   Cmd+Shift+K (Clean)
   Cmd+B (Build)
   Cmd+R (Run on device)
   ```

2. **OAuth Flow testen:**
   - Klicke auf "Mit Google anmelden"
   - Safari öffnet sich
   - Nach Google Login redirected zu `beta.habdawas.at/auth/callback`
   - **App sollte sich automatisch öffnen!**
   - Keine manuelle Aktion nötig!

3. **Erwartete Logs:**
   ```
   [OAuth] App URL opened: https://beta.habdawas.at/auth/callback?platform=ios#access_token=...
   [OAuth] Processing OAuth callback from deep link...
   [OAuth] Access token present: true
   [OAuth] Refresh token present: true
   [OAuth] Setting session with tokens from deep link...
   [OAuth] Session established successfully!
   ```

### Troubleshooting

**App öffnet sich nicht:**
- Prüfe ob AASA File korrekt auf Server liegt
- Prüfe Team ID im AASA File
- Prüfe Associated Domains in Xcode
- Teste auf echtem Gerät (nicht Simulator!)
- Warte 15 Minuten nach AASA Upload (Apple Cache)

**App öffnet sich, aber keine Logs:**
- Prüfe ob `appUrlOpen` Listener registriert ist
- Prüfe Console Logs in Xcode

---

## 📝 Checkliste

Vor dem Test sicherstellen:

- [ ] Team ID im AASA File eingetragen
- [ ] AASA File auf Server hochgeladen
- [ ] AASA File unter richtiger URL erreichbar
- [ ] Associated Domains in Xcode hinzugefügt
- [ ] Clean Build gemacht
- [ ] Auf echtem iPhone getestet (nicht Simulator)

---

## 🎯 Das sollte funktionieren weil:

1. ✅ Universal Links sind der iOS Standard
2. ✅ Verwendet von Millionen Apps
3. ✅ Zuverlässig aus Safari heraus
4. ✅ Keine Custom URL Scheme Probleme
5. ✅ Apple-supported und dokumentiert

---

## 📚 Weitere Infos

- [Apple Universal Links Docs](https://developer.apple.com/documentation/xcode/allowing-apps-and-websites-to-link-to-your-content)
- [AASA File Format](https://developer.apple.com/documentation/bundleresources/applinks)
- [Associated Domains](https://developer.apple.com/documentation/xcode/supporting-associated-domains)

---

**Erstellt:** 2025-10-13
**Version:** 1.0.23+
**Status:** Ready to implement
