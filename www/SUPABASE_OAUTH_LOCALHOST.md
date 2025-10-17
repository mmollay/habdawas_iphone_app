# Google OAuth auf localhost aktivieren

## Problem
Google OAuth redirectet immer zu beta.habdawas.at, obwohl wir auf localhost:5173 entwickeln.

## Lösung

### 1. Supabase Dashboard - Redirect URLs hinzufügen

Öffnen Sie: https://supabase.com/dashboard/project/hsbjflixgavjqxvnkivi/auth/url-configuration

Fügen Sie folgende URLs zu "Redirect URLs" hinzu:

```
http://localhost:5173/
http://localhost:5173/auth/callback
https://beta.habdawas.at/
https://beta.habdawas.at/auth/callback
https://www.habdawas.at/
https://www.habdawas.at/auth/callback
```

### 2. Google Cloud Console - Authorized redirect URIs

Öffnen Sie: https://console.cloud.google.com/apis/credentials

Wählen Sie Ihren OAuth 2.0 Client und fügen Sie hinzu:

```
http://localhost:5173/auth/callback
https://hsbjflixgavjqxvnkivi.supabase.co/auth/v1/callback
```

### 3. Site URL in Supabase

Öffnen Sie: https://supabase.com/dashboard/project/hsbjflixgavjqxvnkivi/auth/url-configuration

**Site URL** sollte sein:
- Für Entwicklung: `http://localhost:5173`
- Für Production: `https://beta.habdawas.at`

⚠️ **WICHTIG**: Sie können immer nur EINE Site URL haben. Für Entwicklung temporär auf localhost setzen, für Production auf beta.habdawas.at.

### 4. Test

Nach der Konfiguration:

1. Hard Refresh: `Cmd + Shift + R`
2. Google Login testen auf http://localhost:5173
3. Nach Login sollten Sie auf localhost:5173 bleiben

## Aktueller Code

Die Redirect URL ist bereits korrekt konfiguriert in `AuthContext.tsx`:

```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/`,  // ✅ Nutzt automatisch localhost oder beta.habdawas.at
  },
});
```

## Checkliste

- [ ] Supabase Redirect URLs hinzugefügt
- [ ] Google Cloud Console Redirect URIs hinzugefügt
- [ ] Site URL auf localhost:5173 gesetzt (für Entwicklung)
- [ ] Hard Refresh im Browser
- [ ] Google Login getestet

## Tipp für Entwicklung

Erstellen Sie zwei separate OAuth Clients in Google Cloud Console:
1. **Development Client** - mit localhost:5173 URLs
2. **Production Client** - mit beta.habdawas.at URLs

Dann können Sie in Supabase zwischen den Clients wechseln je nach Umgebung.
