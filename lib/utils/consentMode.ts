/**
 * Google Consent Mode v2 utilities
 * Handles proper consent state management according to GDPR requirements
 */

interface ConsentState {
  ad_storage: 'granted' | 'denied';
  ad_user_data: 'granted' | 'denied';
  ad_personalization: 'granted' | 'denied';
  analytics_storage: 'granted' | 'denied';
  functionality_storage: 'granted' | 'denied';
  personalization_storage: 'granted' | 'denied';
  security_storage: 'granted'; // Always granted as it's essential
}

interface ConsentPreferences {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    [key: `ga-disable-${string}`]: boolean;
  }
}

/**
 * Convert user preferences to Google Consent Mode states
 */
export function mapPreferencesToConsentState(preferences: ConsentPreferences): ConsentState {
  return {
    // Analytics storage - granted only if user consents to analytics
    analytics_storage: preferences.analytics ? 'granted' : 'denied',
    
    // Marketing/advertising - granted only if user consents to marketing
    ad_storage: preferences.marketing ? 'granted' : 'denied',
    ad_user_data: preferences.marketing ? 'granted' : 'denied',
    ad_personalization: preferences.marketing ? 'granted' : 'denied',
    
    // Functionality - granted if user consents to functional cookies
    functionality_storage: preferences.functional ? 'granted' : 'denied',
    personalization_storage: preferences.functional ? 'granted' : 'denied',
    
    // Security storage - always granted (essential cookies)
    security_storage: 'granted'
  };
}

/**
 * Update Google Consent Mode with user preferences
 */
export function updateGoogleConsent(preferences: ConsentPreferences): void {
  if (typeof window === 'undefined') {
    console.warn('Window not available, cannot update consent');
    return;
  }

  // Check if gtag is available, with retry mechanism
  const attemptConsentUpdate = (retryCount = 0) => {
    if (!window.gtag) {
      if (retryCount < 5) {
        console.debug(`Google Analytics not ready, retrying consent update (${retryCount + 1}/5)`);
        setTimeout(() => attemptConsentUpdate(retryCount + 1), 500);
        return;
      } else {
        console.error('Google Analytics not initialized after 5 retries, cannot update consent');
        return;
      }
    }

    const consentState = mapPreferencesToConsentState(preferences);
    
    try {
      // Send consent update to Google
      window.gtag('consent', 'update', consentState);
      
      // Also update the GA disable flag for analytics
      const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
      if (measurementId) {
        const wasDisabled = window[`ga-disable-${measurementId}`];
        window[`ga-disable-${measurementId}`] = !preferences.analytics;
        
        console.debug('Google Analytics Status Change:', {
          measurementId,
          previouslyDisabled: wasDisabled,
          nowDisabled: !preferences.analytics,
          analyticsConsent: preferences.analytics,
          timestamp: new Date().toISOString()
        });
      }

      console.debug('Google Consent Mode updated:', {
        preferences,
        consentState,
        gaDisabled: !preferences.analytics,
        dataLayerLength: window.dataLayer ? window.dataLayer.length : 0
      });

      // Send a test event and page view when analytics is first enabled
      if (preferences.analytics && window.gtag) {
        // Send consent granted event
        window.gtag('event', 'consent_granted', {
          event_category: 'consent',
          event_label: 'analytics_enabled',
          custom_parameter: {
            consent_timestamp: new Date().toISOString()
          }
        });
        
        // Enable automatic page view tracking if analytics consent is granted
        if (measurementId) {
          window.gtag('config', measurementId, { send_page_view: true });
        }
        
        console.debug('Analytics consent granted - test events sent');
      }
    } catch (error) {
      console.error('Error updating Google Consent Mode:', error);
    }
  };

  attemptConsentUpdate();
}

/**
 * Set default consent state (all denied except security)
 */
export function setDefaultConsent(): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  const defaultState: ConsentState = {
    ad_storage: 'denied',
    ad_user_data: 'denied', 
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
    security_storage: 'granted'
  };

  window.gtag('consent', 'default', {
    ...defaultState,
    wait_for_update: 500 // Wait up to 500ms for consent update
  });

  // Disable GA by default
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (measurementId) {
    window[`ga-disable-${measurementId}`] = true;
  }

  console.debug('Default consent state set:', defaultState);
}

/**
 * Initialize consent system
 * Should be called early in the application lifecycle
 */
export function initializeConsentSystem(): void {
  if (typeof window === 'undefined') return;

  // Ensure dataLayer exists
  window.dataLayer = window.dataLayer || [];
  
  // Set up gtag function if not already defined
  if (!window.gtag) {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
  }

  // Set default consent state
  setDefaultConsent();
}

/**
 * Get current consent state for debugging
 */
export function getCurrentConsentState(): Promise<unknown> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.gtag) {
      resolve({ error: 'Google Analytics not initialized' });
      return;
    }

    // Get current consent state (if gtag supports it)
    window.gtag('get', 'consentState', (consentState: unknown) => {
      resolve(consentState);
    });
  });
}
