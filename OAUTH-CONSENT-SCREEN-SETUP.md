# OAuth Consent Screen Setup - HabDaWas App

## Problem
Google OAuth zeigt Fehler: **"invalid_client - The OAuth client was not found"**

## Ursache
Der OAuth Consent Screen ist nicht korrekt konfiguriert oder nicht veröffentlicht.

---

## 🚀 SCHNELLSTART - 5 Minuten Anleitung

### Schritt 1: Google Cloud Console öffnen
Gehe direkt zu: https://console.cloud.google.com/apis/credentials/consent?project=bazar-470313

### Schritt 2: Consent Screen konfigurieren
1. Klicke auf **"ZUSTIMMUNGSBILDSCHIRM KONFIGURIEREN"**
2. Wähle **"Extern"**
3. Klicke **"ERSTELLEN"**

### Schritt 3: App-Informationen ausfüllen
```
Anwendungsname: HabDaWas
Nutzersupport-E-Mail: office@ssi.at
```

**Scrolle runter zu "Autorisierte Domains"** und füge hinzu:
```
habdawas.at
beta.habdawas.at
supabase.co
```

**Ganz unten bei "Kontaktinformationen für Entwickler":**
```
E-Mail: office@ssi.at
```

Klicke **"SPEICHERN UND FORTFAHREN"**

### Schritt 4: Bereiche hinzufügen
1. Klicke **"BEREICHE HINZUFÜGEN ODER ENTFERNEN"**
2. Setze 3 Häkchen bei:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
3. Klicke **"AKTUALISIEREN"**
4. Klicke **"SPEICHERN UND FORTFAHREN"**

### Schritt 5: Testnutzer hinzufügen
1. Klicke **"NUTZER HINZUFÜGEN"**
2. Gib deine Gmail-Adresse ein
3. Klicke **"HINZUFÜGEN"**
4. Klicke **"SPEICHERN UND FORTFAHREN"**

### Schritt 6: Fertig!
1. Überprüfe die Zusammenfassung
2. Klicke **"ZURÜCK ZUM DASHBOARD"**
3. **Warte 5-10 Minuten**
4. Teste auf https://beta.habdawas.at oder http://localhost:5173

---

## 📖 Detaillierte Anleitung

Falls du mehr Details brauchst, hier die ausführliche Schritt-für-Schritt Anleitung:

### 1. Google Cloud Console öffnen
1. Gehe zu: https://console.cloud.google.com
2. Wähle dein Projekt: **"bazar"** (Projekt-ID: bazar-470313)
3. Navigiere zu: **APIs & Services** → **OAuth consent screen**

---

### 2. App-Informationen überprüfen

#### **User Type**
- ✅ Wähle: **External** (für öffentliche App)
- ℹ️ Internal ist nur für Google Workspace Organisationen

#### **App-Name**
```
HabDaWas
```

#### **User Support Email**
```
[Deine Support-Email]
```

#### **Developer Contact Information**
```
[Deine Entwickler-Email]
```

---

### 3. Authorized Domains (KRITISCH!)

Diese Domains MÜSSEN eingetragen sein:

```
habdawas.at
beta.habdawas.at
supabase.co
```

**Wichtig:**
- Nur die Domain, KEIN `https://` oder Pfade
- Keine Subdomains außer explizit benötigte (beta.habdawas.at)

---

### 4. Bereiche (Scopes) - SCHRITT FÜR SCHRITT

**Nachdem du Schritt 1 gespeichert hast, kommst du zu Schritt 2:**

Du siehst die Überschrift: **"Bereiche"**

1. Klicke auf den großen blauen Button: **"BEREICHE HINZUFÜGEN ODER ENTFERNEN"**

2. Ein Popup-Fenster öffnet sich mit einer Liste

3. In der Liste mit Checkboxen suchst du nach diesen 3 Einträgen:

   ✅ **`.../auth/userinfo.email`**
   - Deutsche Beschreibung: "Die primäre E-Mail-Adresse Ihres Google-Kontos abrufen"
   - Checkbox anklicken!

   ✅ **`.../auth/userinfo.profile`**
   - Deutsche Beschreibung: "Ihre personenbezogenen Daten auf Google ansehen"
   - Checkbox anklicken!

   ✅ **`openid`**
   - Deutsche Beschreibung: "Sie mit Ihrem OpenID in Google verknüpfen"
   - Checkbox anklicken!

4. Klicke unten im Popup auf **"AKTUALISIEREN"** (oder "UPDATE")

5. Klicke dann auf **"SPEICHERN UND FORTFAHREN"**

---

### 5. Testnutzer - SCHRITT FÜR SCHRITT

**Nach dem Speichern von Bereichen kommst du zu Schritt 3:**

Du siehst die Überschrift: **"Testnutzer"**

1. Klicke auf den Button: **"NUTZER HINZUFÜGEN"** (oder "ADD USERS")

2. Gib deine Gmail-Adresse ein:
   ```
   [Deine Gmail-Adresse, z.B. martin.mollay@gmail.com]
   ```

3. Klicke auf **"HINZUFÜGEN"** (oder "ADD")

4. Klicke auf **"SPEICHERN UND FORTFAHREN"**

**WICHTIG:** Nur diese eingetragenen E-Mail-Adressen können sich einloggen, solange die App im "Testing" Modus ist!

---

### 6. Zusammenfassung & Fertig!

**Nach dem Speichern von Testnutzern kommst du zu Schritt 4:**

Du siehst die Überschrift: **"Zusammenfassung"**

1. Überprüfe alle Einstellungen

2. Klicke auf **"ZURÜCK ZUM DASHBOARD"**

3. **FERTIG!** 🎉

**Wichtig:** Der Status deiner App ist jetzt automatisch auf **"Testing"** gesetzt. Das bedeutet:
- ✅ Nur die eingetragenen Testnutzer können sich einloggen
- ✅ Max. 100 Test-User möglich
- ✅ Perfekt für Entwicklung und Tests

**Später für Production:**
- Wenn die App öffentlich sein soll, musst du auf "IN PRODUCTION VERÖFFENTLICHEN" klicken
- Das erfordert dann eine Google Verification (kann Tage/Wochen dauern)

---

## Checkliste: Was MUSS konfiguriert sein

- [ ] **User Type:** External
- [ ] **App Name:** HabDaWas
- [ ] **User Support Email:** Eingetragen
- [ ] **Developer Contact:** Eingetragen
- [ ] **Authorized Domains:**
  - [ ] habdawas.at
  - [ ] beta.habdawas.at
  - [ ] supabase.co
- [ ] **Scopes:**
  - [ ] .../auth/userinfo.email
  - [ ] .../auth/userinfo.profile
  - [ ] openid
- [ ] **Publishing Status:** Testing oder In Production
- [ ] **Test Users:** Deine Gmail eingetragen (wenn Testing)
- [ ] **Speichern:** Alle Änderungen gespeichert

---

## Nach der Konfiguration

### 1. Warte 5-10 Minuten
Google braucht Zeit, um die Änderungen zu propagieren.

### 2. Teste Web Login
```
https://beta.habdawas.at
```
Klicke auf "Mit Google anmelden"

### 3. Teste iOS App
```bash
cd /Users/martinmollay/Development/iphone_app
npm run dev
```

Xcode öffnet sich → Build & Run auf iPhone/Simulator

---

## Häufige Fehler

### "invalid_client"
- ❌ Authorized Domains fehlen
- ❌ App nicht published (im Draft)
- ❌ Test-User nicht eingetragen (bei Testing Mode)

### "Access blocked: This app's request is invalid"
- ❌ Scopes nicht konfiguriert
- ❌ Redirect URI nicht in Client konfiguriert

### "This app isn't verified"
- ℹ️ Normal bei Testing oder neu erstellten Apps
- ✅ User kann trotzdem "Continue" klicken (Advanced → Go to HabDaWas)

---

## Support

Falls Probleme auftreten, überprüfe:
1. **Google Cloud Console:** OAuth Consent Screen komplett ausgefüllt
2. **Supabase Dashboard:** Client ID & Secret korrekt
3. **Vercel:** Deployment erfolgreich (beta.habdawas.at erreichbar)
4. **iOS:** Associated Domains in Xcode konfiguriert

---

**Erstellt:** 2025-01-12
**Version:** 1.0.0
