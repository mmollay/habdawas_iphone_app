/*
  # Add Onboarding Completion Tracking

  1. Neue Felder
    - `onboarding_completed` (boolean) - Gibt an ob der User das Onboarding abgeschlossen hat
    - `onboarding_completed_at` (timestamptz) - Zeitpunkt des Abschlusses

  2. Änderungen
    - Neue User haben onboarding_completed = false als Default
    - Nach Abschluss wird onboarding_completed auf true gesetzt

  3. Zweck
    - Ermöglicht das Anzeigen eines Onboarding-Wizards für neue User
    - Tracking des Onboarding-Fortschritts
*/

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed 
ON public.profiles(onboarding_completed) 
WHERE onboarding_completed = false;
