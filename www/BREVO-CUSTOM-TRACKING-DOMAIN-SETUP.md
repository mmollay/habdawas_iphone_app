# Brevo Custom Tracking Domain Setup

## Problem: Brevo Link-Tracking verursacht Phishing-Warnungen

**Aktuelles Problem:**
```
ihefgba.r.tsp1-brevo.net
❌ "Dieser Link sieht verdächtig aus"
❌ Gmail/Email-Clients warnen vor der Domain
❌ User klicken nicht auf Password-Reset-Links
```

**Lösung: Custom Tracking Domain**
```
tracking.habdawas.at
✅ Eigene Domain - vertrauenswürdig
✅ Keine Phishing-Warnungen
✅ Professional appearance
✅ Bessere E-Mail Deliverability
```

---

## Schritt 1: Subdomain auswählen

Wähle eine Subdomain für Link-Tracking:

### Empfohlene Optionen:
- `tracking.habdawas.at` ✅ (empfohlen)
- `click.habdawas.at`
- `links.habdawas.at`
- `email.habdawas.at`

Für diese Anleitung verwenden wir: **`tracking.habdawas.at`**

---

## Schritt 2: Brevo Dashboard - Custom Tracking Domain hinzufügen

### 2.1 Brevo Dashboard öffnen

```
https://app.brevo.com/settings/advanced/tracking-domain
```

ODER:

1. Einloggen: https://app.brevo.com/
2. **Settings** (rechts oben)
3. **Advanced** → **Tracking Domain**
4. **Add a tracking domain**

### 2.2 Domain eingeben

```
Domain: tracking.habdawas.at
```

Klicke **Save** oder **Add Domain**

### 2.3 DNS Records anzeigen

Brevo zeigt dir jetzt die DNS Records, die du konfigurieren musst:

**Beispiel:**
```
Type: CNAME
Name: tracking
Value: brevo.click
TTL: 3600
```

---

## Schritt 3: DNS Records bei deinem Domain-Provider konfigurieren

### Für Vercel (empfohlen für habdawas.at):

#### Option A: Vercel Dashboard
```
1. Gehe zu: https://vercel.com/[dein-team]/habdawas/settings/domains
2. Klicke auf "habdawas.at" → DNS Records
3. Add Record:
   - Type: CNAME
   - Name: tracking
   - Value: brevo.click
   - TTL: 3600
```

#### Option B: Vercel CLI
```bash
# Falls du Vercel CLI bevorzugst
vercel dns add habdawas.at tracking CNAME brevo.click
```

### Für andere Domain Provider:

<details>
<summary>Namecheap</summary>

```
1. Namecheap Dashboard → Domain List
2. Manage → Advanced DNS
3. Add New Record:
   - Type: CNAME Record
   - Host: tracking
   - Value: brevo.click
   - TTL: Automatic
```
</details>

<details>
<summary>Cloudflare</summary>

```
1. Cloudflare Dashboard → DNS
2. Add record:
   - Type: CNAME
   - Name: tracking
   - Target: brevo.click
   - Proxy status: DNS only (nicht proxied!)
   - TTL: Auto
```

**WICHTIG:** Cloudflare Proxy muss DEAKTIVIERT sein (graue Wolke, nicht orange)!
</details>

<details>
<summary>GoDaddy</summary>

```
1. GoDaddy DNS Management
2. Add → CNAME
   - Host: tracking
   - Points to: brevo.click
   - TTL: 1 Hour
```
</details>

---

## Schritt 4: DNS Propagation abwarten

### Wie lange dauert es?
- **Minimum:** 15-30 Minuten
- **Typisch:** 1-2 Stunden
- **Maximum:** 24-48 Stunden

### DNS Status prüfen:

#### Online Tools:
```
https://dnschecker.org/#CNAME/tracking.habdawas.at
```

#### Terminal:
```bash
# macOS/Linux
dig tracking.habdawas.at CNAME

# Windows PowerShell
Resolve-DnsName tracking.habdawas.at -Type CNAME

# Erwartete Ausgabe:
# tracking.habdawas.at. 3600 IN CNAME brevo.click.
```

---

## Schritt 5: Domain in Brevo verifizieren

### Zurück zu Brevo Dashboard:

```
https://app.brevo.com/settings/advanced/tracking-domain
```

1. Finde `tracking.habdawas.at` in der Liste
2. Status sollte sein: **"Pending Verification"** oder **"Not Verified"**
3. Klicke auf **"Verify"** oder **"Check DNS"**
4. Warte bis Status: ✅ **"Verified"**

### Falls Verification fehlschlägt:

**Häufige Ursachen:**
- DNS Records noch nicht propagated (warte länger)
- Falscher CNAME Value
- Cloudflare Proxy aktiviert (muss deaktiviert sein)
- TTL zu hoch (reduziere auf 3600)

---

## Schritt 6: Custom Tracking Domain aktivieren

### In Brevo Dashboard:

```
https://app.brevo.com/settings/advanced/tracking-domain
```

1. Finde `tracking.habdawas.at` (Status: ✅ Verified)
2. Klicke auf **"Set as default"** oder **"Make default"**
3. ✅ Alle neuen E-Mails verwenden jetzt `tracking.habdawas.at`

---

## Schritt 7: Testing

### Test 1: Password Reset E-Mail senden

```bash
# Terminal: Start dev server
cd /Users/martinmollay/Development/bazar_bold
npm run dev

# Browser: http://localhost:5173
# 1. Klicke "Passwort vergessen"
# 2. Gib deine E-Mail ein
# 3. Checke deine Inbox
```

### Test 2: E-Mail Link inspizieren

**Vorher (Brevo Default):**
```html
<a href="https://ihefgba.r.tsp1-brevo.net/mk/cl/...">
  Passwort zurücksetzen
</a>
```

**Nachher (Custom Domain):**
```html
<a href="https://tracking.habdawas.at/mk/cl/...">
  Passwort zurücksetzen
</a>
```

### Test 3: Link klicken

1. Klicke auf "Passwort zurücksetzen" in der E-Mail
2. **Keine Warnung** sollte erscheinen ✅
3. Redirect zu: `http://localhost:5173/auth/reset-password`
4. Console sollte zeigen:
   ```
   [Password Reset] Auth event: PASSWORD_RECOVERY
   [Password Reset] Session present: true
   [Password Reset] Valid session found - ready to reset password
   ```

---

## Schritt 8: SPF/DKIM/DMARC (Optional, aber empfohlen)

Für beste E-Mail Deliverability:

### SPF Record:
```
Type: TXT
Name: @
Value: v=spf1 include:spf.brevo.com ~all
TTL: 3600
```

### DKIM Records:
Brevo zeigt dir die DKIM Records unter:
```
https://app.brevo.com/settings/senders-and-domains/domain-authentication
```

### DMARC Record:
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@habdawas.at
TTL: 3600
```

---

## Troubleshooting

### Problem: "Domain not verified"

**Lösungen:**
```bash
# 1. DNS Check
dig tracking.habdawas.at CNAME

# 2. Warte länger (DNS Propagation)
# 3. Cloudflare Proxy deaktivieren (falls verwendet)
# 4. TTL reduzieren auf 3600

# 5. DNS Cache leeren (macOS)
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

### Problem: "CNAME already exists"

```bash
# Bestehenden CNAME löschen und neu erstellen
# ODER: Anderen Subdomain-Namen wählen (z.B. click.habdawas.at)
```

### Problem: Link leitet zu Brevo default domain um

**Ursache:** Custom Domain noch nicht als Default gesetzt

**Lösung:**
```
Brevo Dashboard → Settings → Tracking Domain
→ tracking.habdawas.at → "Set as default"
```

### Problem: Gmail zeigt immer noch Warnung

**Ursachen:**
1. Link wurde vor Custom Domain Setup gesendet (alte E-Mail)
2. Custom Domain noch nicht als Default in Brevo
3. DNS Propagation noch nicht abgeschlossen
4. SPF/DKIM nicht konfiguriert

**Lösung:**
- Neue Test-E-Mail senden
- SPF/DKIM Records hinzufügen
- Domain Reputation aufbauen (dauert 1-2 Wochen)

---

## Production Checklist

Vor dem Live-Gang:

- [ ] Custom Tracking Domain: `tracking.habdawas.at` ✅
- [ ] DNS CNAME Record konfiguriert
- [ ] Domain in Brevo verifiziert
- [ ] Als Default Tracking Domain gesetzt
- [ ] SPF Record hinzugefügt
- [ ] DKIM Records konfiguriert
- [ ] DMARC Record hinzugefügt
- [ ] Test-E-Mail gesendet ohne Warnung
- [ ] Password Reset getestet und funktioniert

---

## Benefits nach Setup

### Vorher:
```
❌ ihefgba.r.tsp1-brevo.net
❌ "Verdächtiger Link" Warnung
❌ Schlechte User Experience
❌ Niedrige Click-Rate
```

### Nachher:
```
✅ tracking.habdawas.at
✅ Keine Warnungen
✅ Professional appearance
✅ Höhere Click-Rate
✅ Bessere E-Mail Deliverability
✅ Erhöhtes User-Vertrauen
```

---

## Weiterführende Links

- [Brevo Custom Tracking Domain Docs](https://help.brevo.com/hc/en-us/articles/360000991999-Set-up-a-custom-tracking-domain)
- [DNS Checker Tool](https://dnschecker.org/)
- [SPF Record Check](https://mxtoolbox.com/spf.aspx)
- [DMARC Validator](https://mxtoolbox.com/dmarc.aspx)

---

**Erstellt:** 2025-01-13
**Version:** 1.0
**Projekt:** HabDaWas iOS App (bazar_bold)
**Status:** Ready for Implementation
