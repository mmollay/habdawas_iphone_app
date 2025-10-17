# Stripe Integration Setup

Die Stripe-Integration ist vollständig implementiert und benötigt nur noch deine API-Keys.

## Schritt 1: Stripe Account erstellen (Test-Modus)

1. Gehe zu: https://dashboard.stripe.com/register
2. Registriere dich kostenlos (keine Zahlungsdaten erforderlich)
3. Nach der Registrierung bist du automatisch im **Test-Modus**

## Schritt 2: API-Keys holen

1. Im Stripe Dashboard: Gehe zu **Developers > API keys**
2. Du siehst zwei Keys:
   - **Publishable key** (beginnt mit `pk_test_...`) - wird im Frontend verwendet
   - **Secret key** (beginnt mit `sk_test_...`) - wird im Backend verwendet

3. Kopiere den **Secret key** (klicke auf "Reveal test key")

## Schritt 3: Keys in Supabase konfigurieren

### Option A: Über Supabase Dashboard (Empfohlen)

1. Gehe zu: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/vault
2. Navigiere zu **Project Settings > Edge Functions > Secrets**
3. Füge folgende Secrets hinzu:

```
STRIPE_SECRET_KEY = sk_test_...dein_test_key
STRIPE_WEBHOOK_SECRET = whsec_...dein_webhook_secret (siehe Schritt 4)
```

### Option B: Über Supabase CLI

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...dein_test_key
```

## Schritt 4: Webhook einrichten (für Zahlungsbestätigungen)

1. Im Stripe Dashboard: Gehe zu **Developers > Webhooks**
2. Klicke auf **Add endpoint**
3. Endpoint URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
4. Events to send: Wähle `checkout.session.completed`
5. Klicke auf **Add endpoint**
6. Kopiere den **Signing secret** (beginnt mit `whsec_...`)
7. Füge ihn als `STRIPE_WEBHOOK_SECRET` zu Supabase hinzu (siehe Schritt 3)

## Schritt 5: Testen

### Mit Stripe Test-Karten

Nach der Konfiguration kannst du mit diesen Test-Kreditkarten zahlen:

**Erfolgreiche Zahlung:**
- Kartennummer: `4242 4242 4242 4242`
- Ablaufdatum: beliebiges zukünftiges Datum (z.B. `12/25`)
- CVC: beliebige 3 Ziffern (z.B. `123`)
- PLZ: beliebige 5 Ziffern (z.B. `12345`)

**Fehlgeschlagene Zahlung:**
- Kartennummer: `4000 0000 0000 0002`

**3D Secure (benötigt Authentifizierung):**
- Kartennummer: `4000 0027 6000 3184`

### Test-Ablauf

1. Gehe zu `/tokens/buy`
2. Wähle ein Token-Paket
3. Klicke auf "Jetzt kaufen"
4. Stripe Checkout öffnet sich
5. Gib die Test-Kartendaten ein
6. Bestätige die Zahlung
7. Du wirst zu `/tokens/success` weitergeleitet
8. Tokens werden automatisch gutgeschrieben

## Wichtige Hinweise

### Test-Modus vs. Live-Modus

- **Test-Modus**: Kein echtes Geld, nur zum Testen
- **Live-Modus**: Echte Zahlungen (benötigt vollständige Stripe-Verifizierung)

### Sicherheit

- Die Secret Keys werden NIEMALS im Frontend verwendet
- Alle Zahlungen laufen über sichere Edge Functions
- Webhooks verifizieren die Signatur mit dem Webhook Secret

### Webhook-Testing lokal

Für lokale Tests kannst du den Stripe CLI verwenden:

```bash
stripe listen --forward-to https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```

## Fehlerbehebung

### "Payment service not configured"
- Stelle sicher, dass `STRIPE_SECRET_KEY` in Supabase gesetzt ist
- Prüfe, ob der Key mit `sk_test_` beginnt (für Test-Modus)

### Tokens werden nicht gutgeschrieben
- Prüfe, ob der Webhook korrekt eingerichtet ist
- Kontrolliere die Edge Function Logs in Supabase
- Stelle sicher, dass `STRIPE_WEBHOOK_SECRET` gesetzt ist

### Checkout-Session kann nicht erstellt werden
- Überprüfe die Browser-Konsole auf Fehler
- Stelle sicher, dass du angemeldet bist
- Prüfe die Edge Function Logs

## Live-Modus aktivieren (später)

Wenn du bereit für echte Zahlungen bist:

1. Vervollständige die Stripe-Verifizierung
2. Hole die **Live API Keys** (beginnen mit `pk_live_` und `sk_live_`)
3. Ersetze die Test-Keys durch Live-Keys in Supabase
4. Erstelle einen neuen Webhook mit der Live-URL
5. Aktualisiere `STRIPE_WEBHOOK_SECRET` mit dem neuen Signing Secret

## Token-Pakete

Aktuell verfügbare Pakete:

- **Starter**: 10 Tokens für 4,99€
- **Basic**: 30 Tokens (25 + 5 Bonus) für 9,99€ ⭐ Beliebt
- **Pro**: 65 Tokens (50 + 15 Bonus) für 17,99€
- **Business**: 140 Tokens (100 + 40 Bonus) für 29,99€ 👑 Bester Wert

## Support

Bei Fragen zur Stripe-Integration:
- Stripe Docs: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
