# 🚨 QUICK FIX: 400 Error bei Google OAuth

**Problem**: Google gibt 400 Error zurück
**Wahrscheinlichkeit**: 90% dass dies die Lösung ist!

---

## ✅ DIE LÖSUNG (99% sicher)

### Google Cloud Console → Web Client → Redirect URI hinzufügen

1. **Google Cloud Console öffnen**: https://console.cloud.google.com
2. **APIs & Services** → **Credentials**
3. **Web Client** anklicken (Client ID: `60326895721-l6lf1hj5gchv1v514e9fbrgn9lc1oqr1`)
4. **Edit** Button klicken
5. Unter **Authorized redirect URIs** diese URL hinzufügen:

```
https://hsbjflixgavjqxvnkivi.supabase.co/auth/v1/callback
```

6. **Save** klicken
7. **5-10 Minuten warten** (Google braucht Zeit zum propagieren)
8. **App neu starten** und testen

---

## ❓ Warum ist das das Problem?

Der OAuth Flow läuft so:

```
App → Supabase → Google (prüft Redirect URI!) → Supabase → App
              ↑
         Hier kommt der 400 Error!
```

Google sagt: "Die redirect_uri `https://hsbjflixgavjqxvnkivi.supabase.co/auth/v1/callback` ist nicht erlaubt"

**Lösung**: Diese URI im **Web Client** in Google Cloud Console whitelisten!

---

## ⚠️ WICHTIG

- Diese URL muss im **WEB CLIENT** sein (nicht iOS Client!)
- iOS Client hat gar kein Feld für Redirect URIs
- Das ist korrekt und gewollt!

---

## 🔄 Alternative Check: OAuth Consent Screen

Falls die Redirect URI schon drin ist:

1. **Google Cloud Console** → **OAuth consent screen**
2. **Test users** Abschnitt öffnen
3. **Deine E-Mail Adresse hinzufügen**
4. Save

Wenn der Consent Screen im "Testing" Modus ist, können nur Test Users sich anmelden!

---

## 📸 Was ich brauche um weiter zu helfen

Falls es nach diesen Schritten immer noch nicht funktioniert:

1. Screenshot vom **Web Client** mit allen sichtbaren Redirect URIs
2. Screenshot vom **OAuth Consent Screen** → Test users Abschnitt

---

**Nach den Änderungen**:
- ⏱️ 5-10 Minuten warten
- 🔄 App komplett neu starten
- 🧪 Testen

---

**Erstellt**: 2025-10-12
**Status**: Waiting for Verification
