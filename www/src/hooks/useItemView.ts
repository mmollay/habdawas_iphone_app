import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Einfacher Browser-Fingerprint (nicht für Sicherheit, nur für View-Tracking)
const getBrowserFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
  }

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');

  // Einfacher Hash
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(36);
};

// Session-basierte Tracking: Speichere bereits angesehene Items in SessionStorage
const hasViewedItem = (itemId: string): boolean => {
  try {
    const viewedItems = JSON.parse(sessionStorage.getItem('viewedItems') || '[]');
    return viewedItems.includes(itemId);
  } catch {
    return false;
  }
};

const markItemAsViewed = (itemId: string): void => {
  try {
    const viewedItems = JSON.parse(sessionStorage.getItem('viewedItems') || '[]');
    if (!viewedItems.includes(itemId)) {
      viewedItems.push(itemId);
      sessionStorage.setItem('viewedItems', JSON.stringify(viewedItems));
    }
  } catch (error) {
    console.error('Failed to mark item as viewed:', error);
  }
};

export const useItemView = (itemId: string | undefined, isDetailView: boolean = false) => {
  useEffect(() => {
    if (!itemId || !isDetailView) return;

    // Prüfen ob bereits in dieser Session angesehen
    if (hasViewedItem(itemId)) {
      return;
    }

    const trackView = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        // Item View tracken
        const { error } = await supabase
          .from('item_views')
          .insert({
            item_id: itemId,
            viewer_id: user?.id || null,
            session_fingerprint: user ? null : getBrowserFingerprint(),
          });

        // Fehler ignorieren wenn bereits vorhanden (unique constraint)
        if (error && !error.message.includes('unique')) {
          console.error('Failed to track view:', error);
        } else {
          // In Session als angesehen markieren
          markItemAsViewed(itemId);
        }
      } catch (error) {
        console.error('Failed to track view:', error);
      }
    };

    // Kurze Verzögerung um Bot-Traffic zu vermeiden
    const timer = setTimeout(trackView, 2000);

    return () => clearTimeout(timer);
  }, [itemId, isDetailView]);
};
