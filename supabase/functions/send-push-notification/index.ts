// =====================================================
// Supabase Edge Function: Send Push Notification
// =====================================================
//
// Deployment:
// 1. Install Supabase CLI: https://supabase.com/docs/guides/cli
// 2. Login: supabase login
// 3. Link project: supabase link --project-ref your-project-ref
// 4. Deploy: supabase functions deploy send-push-notification
// 5. Set secrets:
//    supabase secrets set APNS_KEY_ID=your-key-id
//    supabase secrets set APNS_TEAM_ID=your-team-id
//    supabase secrets set APNS_KEY_P8="-----BEGIN PRIVATE KEY-----\n..."
//
// Usage:
// POST https://your-project.supabase.co/functions/v1/send-push-notification
// {
//   "user_id": 1,
//   "title": "Neues Produkt",
//   "body": "User hat Feuerzeug eingestellt",
//   "data": { "product_id": 123 }
// }
//
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// APNs Configuration
const APNS_KEY_ID = Deno.env.get('APNS_KEY_ID')!
const APNS_TEAM_ID = Deno.env.get('APNS_TEAM_ID')!
const APNS_KEY_P8 = Deno.env.get('APNS_KEY_P8')!
const APNS_BUNDLE_ID = 'at.habdawas.app'
const APNS_ENDPOINT = 'https://api.development.push.apple.com'  // Production: https://api.push.apple.com

// Supabase Client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface PushNotificationRequest {
  user_id?: number
  user_ids?: number[]
  device_token?: string  // Optional: direkt an ein Device senden
  title: string
  body: string
  data?: Record<string, any>
  badge?: number
  sound?: string
}

/**
 * Generate JWT Token for APNs Authentication
 */
async function generateAPNsToken(): Promise<string> {
  const header = {
    alg: "ES256",
    kid: APNS_KEY_ID
  }

  const payload = {
    iss: APNS_TEAM_ID,
    iat: Math.floor(Date.now() / 1000)
  }

  // Import P8 key
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(APNS_KEY_P8),
    {
      name: "ECDSA",
      namedCurve: "P-256"
    },
    false,
    ["sign"]
  )

  // Create JWT
  const headerBase64 = btoa(JSON.stringify(header))
  const payloadBase64 = btoa(JSON.stringify(payload))
  const data = `${headerBase64}.${payloadBase64}`

  const signature = await crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: "SHA-256"
    },
    privateKey,
    new TextEncoder().encode(data)
  )

  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
  return `${data}.${signatureBase64}`
}

/**
 * Convert PEM to ArrayBuffer
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')

  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Send Push Notification to APNs
 */
async function sendToAPNs(
  deviceToken: string,
  payload: any,
  jwtToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${APNS_ENDPOINT}/3/device/${deviceToken}`,
      {
        method: 'POST',
        headers: {
          'authorization': `bearer ${jwtToken}`,
          'apns-topic': APNS_BUNDLE_ID,
          'apns-push-type': 'alert',
          'apns-priority': '10',
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    )

    if (response.status === 200) {
      return { success: true }
    } else {
      const error = await response.text()
      console.error('APNs Error:', error)
      return { success: false, error }
    }
  } catch (error) {
    console.error('Send to APNs failed:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Main Handler
 */
serve(async (req) => {
  // CORS Headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const body: PushNotificationRequest = await req.json()

    // Validate
    if (!body.title || !body.body) {
      return new Response(
        JSON.stringify({ error: 'title and body are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Generate APNs JWT Token
    const jwtToken = await generateAPNsToken()

    // Build APNs Payload
    const apnsPayload = {
      aps: {
        alert: {
          title: body.title,
          body: body.body
        },
        badge: body.badge || 1,
        sound: body.sound || 'default'
      },
      ...body.data  // Custom data
    }

    let deviceTokens: { device_token: string; platform: string }[] = []

    // Option 1: Direkt an ein Device senden
    if (body.device_token) {
      deviceTokens = [{ device_token: body.device_token, platform: 'ios' }]
    }
    // Option 2: An einen User senden
    else if (body.user_id) {
      const { data, error } = await supabase
        .rpc('get_active_device_tokens', { p_user_id: body.user_id })

      if (error) throw error
      deviceTokens = data || []
    }
    // Option 3: An mehrere Users senden
    else if (body.user_ids && body.user_ids.length > 0) {
      const { data, error } = await supabase
        .from('device_tokens')
        .select('device_token, platform')
        .in('user_id', body.user_ids)
        .eq('platform', 'ios')
        .gte('last_active', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      if (error) throw error
      deviceTokens = data || []
    }

    if (deviceTokens.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active devices found' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Send notifications
    const results = await Promise.all(
      deviceTokens.map(async ({ device_token }) => {
        const result = await sendToAPNs(device_token, apnsPayload, jwtToken)

        // Log to database
        await supabase.from('notification_logs').insert({
          user_id: body.user_id || null,
          device_token,
          title: body.title,
          body: body.body,
          data: body.data || {},
          status: result.success ? 'sent' : 'failed',
          error_message: result.error || null
        })

        return {
          device_token,
          success: result.success,
          error: result.error
        }
      })
    )

    const successCount = results.filter(r => r.success).length
    const failedCount = results.filter(r => !r.success).length

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failedCount,
        results
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})
