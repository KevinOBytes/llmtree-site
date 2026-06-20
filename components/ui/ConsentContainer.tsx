"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import { updateGoogleConsent, initializeConsentSystem } from "@/lib/utils/consentMode";

interface CookieSettingsModalProps {
  onSave: (preferences: { analytics: boolean; marketing: boolean; functional: boolean }) => void;
  onClose: () => void;
}

function CookieSettingsModal({ onSave, onClose }: CookieSettingsModalProps) {
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [functional, setFunctional] = useState(false);

  const handleSave = () => {
    onSave({ analytics, marketing, functional });
  };

  return (
    <div className="fixed inset-0 bg-surface-primary/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass max-w-md w-full p-6 rounded-2xl relative shadow-2xl"
      >
        <h3 className="text-lg font-bold text-text-primary mb-4">Cookie Preferences</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <label className="text-text-primary text-sm font-semibold">Essential Cookies</label>
              <p className="text-text-muted text-xs">Required for basic site functionality and security.</p>
            </div>
            <input type="checkbox" checked disabled className="h-4 w-4 rounded border-border-default text-accent-violet focus:ring-accent-violet opacity-60" />
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <label className="text-text-primary text-sm font-semibold">Analytics Cookies</label>
              <p className="text-text-muted text-xs">Helps us analyze traffic and see which models/pages are visited.</p>
            </div>
            <input 
              type="checkbox" 
              checked={analytics} 
              onChange={(e) => setAnalytics(e.target.checked)}
              className="h-4 w-4 rounded border-border-default text-accent-emerald focus:ring-accent-emerald accent-accent-emerald"
            />
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <label className="text-text-primary text-sm font-semibold">Marketing Cookies</label>
              <p className="text-text-muted text-xs">Used to deliver relevant content and measure marketing effectiveness.</p>
            </div>
            <input 
              type="checkbox" 
              checked={marketing} 
              onChange={(e) => setMarketing(e.target.checked)}
              className="h-4 w-4 rounded border-border-default text-accent-emerald focus:ring-accent-emerald accent-accent-emerald"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <label className="text-text-primary text-sm font-semibold">Functional Cookies</label>
              <p className="text-text-muted text-xs">Remembers your settings, visualizer layouts, and view preferences.</p>
            </div>
            <input 
              type="checkbox" 
              checked={functional} 
              onChange={(e) => setFunctional(e.target.checked)}
              className="h-4 w-4 rounded border-border-default text-accent-emerald focus:ring-accent-emerald accent-accent-emerald"
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border-default hover:bg-surface-elevated hover:text-text-primary transition-all text-xs font-semibold text-text-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 rounded-xl bg-accent-emerald hover:bg-accent-emerald/90 transition-all text-xs font-semibold text-white"
          >
            Save Preferences
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const COOKIE_OPTIONS = {
  expires: 365,
  path: "/",
  domain: process.env.NODE_ENV === "production" ? ".kevinbytes.com" : undefined,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const
};

export function ConsentContainer() {
  const [showBanner, setShowBanner] = useState<boolean | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Initialize the consent system
    initializeConsentSystem();

    const checkConsent = () => {
      const consentGiven = Cookies.get("cookie-consent-given");
      
      if (!consentGiven) {
        setShowBanner(true);
      } else {
        setShowBanner(false);
        const analyticsEnabled = Cookies.get("analytics-enabled") === "true";
        const marketingEnabled = Cookies.get("marketing-enabled") === "true";
        const functionalEnabled = Cookies.get("functional-enabled") === "true";
        
        // Update Google Consent Mode with stored preferences
        updateGoogleConsent({
          analytics: analyticsEnabled,
          marketing: marketingEnabled,
          functional: functionalEnabled
        });
      }
    };
    
    checkConsent();
    
    const handleStorageChange = () => {
      checkConsent();
    };
    
    window.addEventListener("storage", handleStorageChange);
    const intervalId = setInterval(checkConsent, 2000);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  const handleAcceptAll = () => {
    try {
      Cookies.set("analytics-enabled", "true", COOKIE_OPTIONS);
      Cookies.set("marketing-enabled", "true", COOKIE_OPTIONS);
      Cookies.set("functional-enabled", "true", COOKIE_OPTIONS);
      Cookies.set("cookie-consent-given", "true", COOKIE_OPTIONS);
      
      updateGoogleConsent({
        analytics: true,
        marketing: true,
        functional: true
      });
    } catch (error) {
      console.error("Error setting consent cookies:", error);
    } finally {
      setShowBanner(false);
    }
  };

  const handleEssentialOnly = () => {
    try {
      Cookies.set("analytics-enabled", "false", COOKIE_OPTIONS);
      Cookies.set("marketing-enabled", "false", COOKIE_OPTIONS);
      Cookies.set("functional-enabled", "false", COOKIE_OPTIONS);
      Cookies.set("cookie-consent-given", "true", COOKIE_OPTIONS);
      
      // Clear existing tracking cookies
      const cookiesToRemove = [
        "_ga", "_gat", "_gid", "_fbp", "_clck", "_clsk", "vercel-analytics"
      ];

      cookiesToRemove.forEach(cookie => {
        try {
          Cookies.remove(cookie, { path: "/" });
          Cookies.remove(cookie, { path: "/", domain: ".kevinbytes.com" });
        } catch (e) {
          console.warn(`Failed to remove cookie: ${cookie}`, e);
        }
      });

      updateGoogleConsent({
        analytics: false,
        marketing: false,
        functional: false
      });
    } catch (error) {
      console.error("Error handling essential consent:", error);
    } finally {
      setShowBanner(false);
    }
  };

  const handleCustomize = () => {
    setShowSettings(true);
  };

  const handleSaveCustom = (preferences: { analytics: boolean; marketing: boolean; functional: boolean }) => {
    try {
      Cookies.set("analytics-enabled", preferences.analytics.toString(), COOKIE_OPTIONS);
      Cookies.set("marketing-enabled", preferences.marketing.toString(), COOKIE_OPTIONS);
      Cookies.set("functional-enabled", preferences.functional.toString(), COOKIE_OPTIONS);
      Cookies.set("cookie-consent-given", "true", COOKIE_OPTIONS);
      
      updateGoogleConsent(preferences);
    } catch (error) {
      console.error("Error saving custom preferences:", error);
    } finally {
      setShowBanner(false);
      setShowSettings(false);
    }
  };

  if (showBanner === null) return null;
  if (!showBanner) return null;

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-xl z-50 rounded-2xl glass p-5 shadow-2xl shadow-black/40 border border-border-default"
          >
            <div className="flex flex-col gap-4">
              <div className="text-xs text-text-secondary leading-relaxed">
                <p className="text-sm font-semibold text-text-primary mb-1">
                  Cookie Consent & Privacy
                </p>
                <p className="mb-2">
                  We use cookies and telemetry (including Google and Vercel Analytics) to analyze traffic and optimize the Tree of Life. You can adjust your consent categories below.
                </p>
                <p className="text-text-muted">
                  Read the parent{" "}
                  <a href="https://kevinbytes.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent-cyan hover:underline">
                    Privacy Policy
                  </a>{" "}
                  or{" "}
                  <a href="https://kevinbytes.com/cookie-policy" target="_blank" rel="noopener noreferrer" className="text-accent-cyan hover:underline">
                    Cookie Policy
                  </a>.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2.5">
                <button
                  onClick={handleEssentialOnly}
                  className="px-3.5 py-2 text-xs font-semibold text-text-secondary border border-border-default hover:bg-surface-elevated hover:text-text-primary rounded-xl transition-all"
                >
                  Essential Only
                </button>
                <button
                  onClick={handleCustomize}
                  className="px-3.5 py-2 text-xs font-semibold text-text-secondary border border-border-default hover:bg-surface-elevated hover:text-text-primary rounded-xl transition-all"
                >
                  Customize
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-accent-emerald hover:bg-accent-emerald/90 rounded-xl hover:shadow-lg hover:shadow-accent-emerald/20 transition-all"
                >
                  Accept All
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showSettings && (
          <CookieSettingsModal
            onSave={handleSaveCustom}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
