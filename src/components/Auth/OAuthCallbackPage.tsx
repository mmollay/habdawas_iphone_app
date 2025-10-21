import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { supabase } from '../../lib/supabase';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Browser } from '@capacitor/browser';

export const OAuthCallbackPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const url = window.location.href;
        const urlParams = new URLSearchParams(window.location.search);
        const platform = urlParams.get('platform');
        const isNativeRequest = platform === 'ios';

        console.log('[OAuth Callback] Processing URL:', url);
        console.log('[OAuth Callback] Platform:', isNativeRequest ? 'Native iOS (from URL param)' : 'Web');

        // Log ALL URL parameters for debugging
        console.log('[OAuth Callback] All URL parameters:');
        urlParams.forEach((value, key) => {
          console.log(`  - ${key}: ${value}`);
        });

        // NATIVE iOS: Universal Links should open the app automatically!
        if (isNativeRequest) {
          console.log('[OAuth Callback] Native iOS request detected!');
          console.log('[OAuth Callback] ✅ Universal Links will open the app automatically!');
          console.log('[OAuth Callback] Current URL:', window.location.href);

          // Check for OAuth errors first
          const error = urlParams.get('error');
          const errorDescription = urlParams.get('error_description');

          if (error) {
            console.error('[OAuth Callback] OAuth Error:', error);
            console.error('[OAuth Callback] Error Description:', errorDescription);
            setError(`OAuth Fehler: ${errorDescription || error}`);
            return;
          }

          // Verify tokens are in URL fragment
          const fragment = window.location.hash.substring(1);
          console.log('[OAuth Callback] URL Fragment present:', !!fragment);

          if (!fragment) {
            console.error('[OAuth Callback] No fragment found in URL');
            console.error('[OAuth Callback] Full URL:', window.location.href);
            setError('Keine Authentifizierungsdaten gefunden.');
            return;
          }

          // Parse tokens to verify
          const params = new URLSearchParams(fragment);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          console.log('[OAuth Callback] Access token present:', !!accessToken);
          console.log('[OAuth Callback] Refresh token present:', !!refreshToken);

          if (!accessToken || !refreshToken) {
            console.error('[OAuth Callback] Missing tokens in fragment');
            setError('Authentifizierungsdaten unvollständig.');
            return;
          }

          // SUCCESS! Redirect to app using custom URL scheme
          console.log('[OAuth Callback] ✅ Tokens verified! Redirecting to app...');

          // Create deep link with tokens
          const deepLink = `habdawas://auth/callback#${fragment}`;
          console.log('[OAuth Callback] Redirecting to:', deepLink);

          // Redirect to app
          setTimeout(() => {
            window.location.href = deepLink;
          }, 100);
          return;
        }

        // WEB: Check if we have a hash fragment (implicit flow) or code (PKCE flow)
        const hashFragment = window.location.hash.substring(1);
        const hasHashTokens = hashFragment.includes('access_token');

        console.log('[OAuth Callback] Has hash fragment:', !!hashFragment);
        console.log('[OAuth Callback] Has hash tokens:', hasHashTokens);

        if (hasHashTokens) {
          // Implicit flow - tokens are in the hash
          console.log('[OAuth Callback] Using implicit flow (tokens in hash)');
          const params = new URLSearchParams(hashFragment);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken) {
            console.log('[OAuth Callback] Setting session from hash tokens...');
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (sessionError) {
              console.error('[OAuth Callback] Session error:', sessionError);
              setError('Anmeldung fehlgeschlagen. Bitte versuche es erneut.');
              setTimeout(() => navigate('/'), 3000);
              return;
            }

            console.log('[OAuth Callback] Success! Redirecting to home...');
            navigate('/', { replace: true });
            return;
          }
        }

        // PKCE flow - exchange code for session
        console.log('[OAuth Callback] Web platform - exchanging code for session...');
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(url);

        if (exchangeError) {
          console.error('[OAuth Callback] Exchange error:', exchangeError);
          setError('Anmeldung fehlgeschlagen. Bitte versuche es erneut.');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        console.log('[OAuth Callback] Success! Redirecting to home...');

        // Redirect to home page
        navigate('/', { replace: true });
      } catch (err) {
        console.error('[OAuth Callback] Error:', err);
        setError('Ein Fehler ist aufgetreten. Du wirst weitergeleitet...');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    // Show debug info
    const urlParams = new URLSearchParams(window.location.search);
    const debugInfo: string[] = [];
    urlParams.forEach((value, key) => {
      debugInfo.push(`${key}: ${value}`);
    });

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
          p: 3,
        }}
      >
        <Typography variant="h6" color="error">
          {error}
        </Typography>
        {debugInfo.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, width: '100%', maxWidth: 500 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Debug Info:
            </Typography>
            {debugInfo.map((info, i) => (
              <Typography key={i} variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                {info}
              </Typography>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h6">
        Anmeldung wird verarbeitet...
      </Typography>
    </Box>
  );
};
