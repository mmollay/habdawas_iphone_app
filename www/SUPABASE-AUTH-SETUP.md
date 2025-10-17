# Supabase Authentication Setup Guide

## Problem: Password Reset E-Mails funktionieren nicht

**Symptome:**
- E-Mail wird versendet ✅
- Reset-Link in der E-Mail funktioniert nicht ❌
- Fehler: "Token has expired or is invalid"

**Ursache:**
Die `redirectTo` URL ist nicht in der Supabase Redirect URLs Whitelist eingetragen.

---

## Lösung: Redirect URLs konfigurieren

### 1. Supabase Dashboard öffnen

Gehe zu: **Authentication → URL Configuration**

```
https://supabase.com/dashboard/project/[YOUR-PROJECT-ID]/auth/url-configuration
```

### 2. Redirect URLs hinzufügen

Füge folgende URLs zur **"Redirect URLs"** Liste hinzu:

#### Für Localhost Development:
```
http://localhost:5173/auth/reset-password
http://localhost:5173/
http://localhost:5173/auth/callback
```

#### Für Production (beta.habdawas.at):
```
https://beta.habdawas.at/auth/reset-password
https://beta.habdawas.at/
https://beta.habdawas.at/auth/callback
```

### 3. Site URL überprüfen

Stelle sicher, dass die **Site URL** richtig gesetzt ist:

- **Development:** `http://localhost:5173`
- **Production:** `https://beta.habdawas.at`

---

## Wie funktioniert der Password Reset Flow?

### 1. User klickt auf "Passwort vergessen"
```typescript
// AuthContext.tsx:193-206
const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  if (error) throw error;
};
```

### 2. Supabase sendet E-Mail mit Reset-Link

Die E-Mail enthält die `{{ .ConfirmationURL }}` Variable:
```
https://[PROJECT-REF].supabase.co/auth/v1/verify?token=...&type=recovery&redirect_to=http://localhost:5173/auth/reset-password
```

### 3. User klickt auf den Link

- Supabase verifiziert den Token
- Redirect zu `http://localhost:5173/auth/reset-password`
- **WICHTIG:** Diese URL muss in der Whitelist sein!

### 4. ResetPasswordPage erkennt den Password Recovery Event

```typescript
// ResetPasswordPage.tsx:26-32
useEffect(() => {
  supabase.auth.onAuthStateChange(async (event) => {
    if (event === 'PASSWORD_RECOVERY') {
      console.log('Password recovery event detected');
    }
  });
}, []);
```

### 5. User gibt neues Passwort ein

```typescript
// ResetPasswordPage.tsx:50-56
const { error } = await supabase.auth.updateUser({
  password: password,
});
```

---

## Email Template Variablen

Supabase stellt folgende Variablen für Email Templates zur Verfügung:

| Variable | Beschreibung |
|----------|-------------|
| `{{ .ConfirmationURL }}` | Vollständiger Reset-Link (empfohlen) |
| `{{ .Token }}` | 6-stelliger OTP Code |
| `{{ .TokenHash }}` | Gehashter Token für eigene Links |
| `{{ .SiteURL }}` | Deine Site URL |
| `{{ .Email }}` | E-Mail des Users |

### Empfohlenes Email Template (Recovery):

```html
<html>
  <body>
    <h2>Passwort zurücksetzen</h2>
    <p>Hallo,</p>
    <p>Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.</p>
    <p>Klicke auf den folgenden Link, um ein neues Passwort zu setzen:</p>
    <p><a href="{{ .ConfirmationURL }}">Passwort zurücksetzen</a></p>
    <p>Wenn du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail.</p>
    <p>Der Link ist 60 Minuten gültig.</p>
  </body>
</html>
```

---

## Email Template in Supabase Dashboard bearbeiten

### Location:
**Authentication → Email Templates → Reset Password**

```
https://supabase.com/dashboard/project/[YOUR-PROJECT-ID]/auth/templates
```

### Standard Template:
```html
<h2>Reset Your Password</h2>
<p>Follow this link to reset the password for your user:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

---

## Troubleshooting

### Problem: "Token has expired or is invalid"

**Ursachen:**
1. ❌ `redirectTo` URL nicht in Whitelist
2. ❌ Token bereits verwendet (Email Prefetching durch Sicherheitssoftware)
3. ❌ Token älter als 60 Minuten

**Lösung:**
- Redirect URLs in Supabase konfigurieren (siehe oben)
- Bei Email Prefetching: OTP Code (`{{ .Token }}`) statt Link verwenden

### Problem: Email kommt nicht an

**Checklist:**
- [ ] SMTP korrekt konfiguriert in Supabase
- [ ] Spam-Ordner überprüfen
- [ ] Rate Limits (max. 3-4 E-Mails pro Stunde für denselben User)
- [ ] Supabase Auth Logs überprüfen (Dashboard → Logs)

### Problem: Redirect funktioniert nicht auf iOS Native App

**Für Native Apps:**
- Universal Links verwenden (https:// URLs)
- Associated Domains in Xcode konfigurieren
- Apple Developer Account erforderlich

---

## Testing

### 1. Development Test (localhost:5173)
```bash
# Terminal 1: Start dev server
npm run dev

# Browser: Open http://localhost:5173
# Click "Passwort vergessen"
# Enter email → Check inbox → Click reset link
```

### 2. Production Test (beta.habdawas.at)
```bash
# Build and deploy
npm run build
# Deploy to Vercel
# Test on https://beta.habdawas.at
```

---

## Aktuelle Konfiguration im Code

### AuthContext.tsx (Zeile 196)
```typescript
redirectTo: `${window.location.origin}/auth/reset-password`
```

### App.tsx (Zeile 1526)
```tsx
<Route path="/auth/reset-password" element={<ResetPasswordPage />} />
```

### ResetPasswordPage.tsx (Zeile 27-30)
```typescript
supabase.auth.onAuthStateChange(async (event) => {
  if (event === 'PASSWORD_RECOVERY') {
    console.log('Password recovery event detected');
  }
});
```

---

## Weiterführende Links

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)
- [URL Configuration](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail)

---

**Erstellt:** 2025-01-13
**Version:** 1.0
**Projekt:** HabDaWas iOS App (bazar_bold)
