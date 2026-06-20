"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

// Google Tag Manager ID
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export function ClientAnalytics() {
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize dataLayer function early to prevent race conditions
    if (typeof window !== "undefined") {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer?.push(args);
      };

      // Debug logging for analytics setup
      console.debug("Google Analytics Debug Info:", {
        GA_MEASUREMENT_ID,
        GTM_ID,
        gtagExists: !!window.gtag,
        dataLayerExists: !!window.dataLayer,
        environment: process.env.NODE_ENV,
        userAgent: navigator.userAgent,
        cookiesEnabled: navigator.cookieEnabled,
        timestamp: new Date().toISOString()
      });
    }
  }, [GA_MEASUREMENT_ID]);

  // Handle script loading errors
  const handleScriptError = (error: Error, scriptType: string) => {
    const errorMessage = `Failed to load ${scriptType}: ${error.message}`;
    console.error(errorMessage, error);
    setInitializationError(errorMessage);
    
    // Try to initialize anyway with fallback
    if (typeof window !== "undefined" && !window.gtag) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer?.push(args);
      };
    }
  };

  // Handle successful script loading
  const handleScriptLoad = (scriptType: string) => {
    console.debug(`${scriptType} loaded successfully`);
    
    // Verify gtag is available after script load
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      console.debug("gtag function verified after script load");
    }
  };

  return (
    <>
      {/* Show debug info in development */}
      {process.env.NODE_ENV === "development" && initializationError && (
        <div style={{
          position: "fixed",
          top: "10px",
          right: "10px",
          background: "#ff6b6b",
          color: "white",
          padding: "10px",
          borderRadius: "5px",
          fontSize: "12px",
          zIndex: 9999,
          maxWidth: "300px"
        }}>
          GA Error: {initializationError}
        </div>
      )}

      {/* Google Tag Manager */}
      {GTM_ID && (
        <>
          <Script 
            id="gtm-script" 
            strategy="afterInteractive"
            onLoad={() => handleScriptLoad("Google Tag Manager")}
            onError={(e) => handleScriptError(e, "Google Tag Manager")}
          >
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_ID}');
            `}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        </>
      )}

      {/* Google Analytics Privacy & Consent Management */}
      {GA_MEASUREMENT_ID && (
        <Script 
          id="gtag-privacy-init" 
          strategy="afterInteractive"
          onLoad={() => handleScriptLoad("Google Analytics privacy initialization")}
          onError={(e) => handleScriptError(e, "Google Analytics privacy initialization")}
        >
          {`
            // Initialize privacy-first Google Analytics setup
            // This runs after the standard gtag is loaded from layout.tsx
            
            (function initializePrivacyControls() {
              // Verify gtag is available
              if (typeof window.gtag === 'undefined') {
                console.warn('Google Analytics gtag function not available for privacy initialization');
                return;
              }
              
              try {
                // Disable analytics by default until consent is given
                window['ga-disable-${GA_MEASUREMENT_ID}'] = true;
                
                // Set default consent state (Consent Mode v2)
                gtag('consent', 'default', {
                  'ad_storage': 'denied',
                  'ad_user_data': 'denied',
                  'ad_personalization': 'denied',
                  'analytics_storage': 'denied',
                  'functionality_storage': 'denied',
                  'personalization_storage': 'denied',
                  'security_storage': 'granted',
                  'wait_for_update': 500
                });

                // Configure privacy-focused settings
                gtag('config', '${GA_MEASUREMENT_ID}', {
                  'anonymize_ip': true,
                  'allow_google_signals': false,
                  'allow_ad_personalization_signals': false,
                  'send_page_view': false  // We'll send manually after consent
                });

                console.debug('Google Analytics privacy controls initialized', {
                  measurementId: '${GA_MEASUREMENT_ID}',
                  analyticsDisabled: window['ga-disable-${GA_MEASUREMENT_ID}'],
                  timestamp: new Date().toISOString(),
                  dataLayerLength: window.dataLayer ? window.dataLayer.length : 0
                });
                
              } catch (error) {
                console.error('Error initializing Google Analytics privacy controls:', error);
                window.gaPrivacyInitError = error;
              }
            })();
          `}
        </Script>
      )}
    </>
  );
}
