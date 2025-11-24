import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "@/styles/accessibility.css";
import FarmConChatbot from "@/components/chatbot/FarmConChatbot";
import PostHogProvider from "@/components/providers/PostHogProvider";
import FingerprintProvider from "@/components/providers/FingerprintProvider";
import CookieConsent from "@/components/CookieConsent";
import ElevenLabsWidget from "@/components/ElevenLabsWidget";
import { AccessibilityProvider } from "@/components/accessibility/AccessibilityProvider";
import { AccessibilityPanel } from "@/components/accessibility/AccessibilityPanel";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FarmCon - Farm Connect Platform",
  description: "Connect farmers, suppliers, and buyers on one platform",
  manifest: "/manifest.json",
  icons: {
    icon: "/farmcon.jpg",
    shortcut: "/farmcon.jpg",
    apple: "/farmcon.jpg",
  },
  themeColor: "#10b981",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FarmCon",
  },
  formatDetection: {
    telephone: false,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Critical Resource Hints */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://translate.google.com" />
        <link rel="dns-prefetch" href="https://www.clarity.ms" />
        <link rel="dns-prefetch" href="https://embed.tawk.to" />
        <link rel="dns-prefetch" href="https://cdn.onesignal.com" />

        {/* Favicon / manifest for browser tab */}
        <link rel="icon" href="/farmcon.jpg" />
        <link rel="apple-touch-icon" href="/farmcon.jpg" />
        <link rel="manifest" href="/manifest.json" />

        {/* Hide Google Translate Banner and Branding */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .goog-te-banner-frame.skiptranslate,
              .goog-te-gadget-icon,
              .goog-te-balloon-frame,
              div#goog-gt-,
              .skiptranslate > iframe {
                display: none !important;
              }
              body {
                top: 0px !important;
              }
              .goog-logo-link,
              .goog-te-gadget span,
              .goog-te-combo option:first-child {
                display: none !important;
              }
              .goog-te-combo {
                padding: 8px;
                border: 1px solid #d1d5db;
                border-radius: 0.5rem;
                font-size: 0.875rem;
                outline: none;
              }
            `,
          }}
        />
      </head>

      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Stripe Script */}
        <Script src="https://js.stripe.com/v3/" strategy="lazyOnload" />

        {/* Google Translate Widget */}
        <Script
          id="google-translate-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              function googleTranslateElementInit() {
                new google.translate.TranslateElement({
                  pageLanguage: 'en',
                  includedLanguages: 'en,hi,ta,te,kn,ml,mr,bn,pa,gu,ur,or',
                  layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                  autoDisplay: false,
                  multilanguagePage: true
                }, 'google_translate_element');
              }
            `,
          }}
        />
        <Script
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />

        {/* Microsoft Clarity */}
        {process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID && (
          <Script
            id="clarity-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID}");
              `,
            }}
          />
        )}

        {/* Tawk.to Live Chat */}
        {process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID && (
          <>
            <Script
              id="tawk-init"
              strategy="lazyOnload"
              dangerouslySetInnerHTML={{
                __html: `
                  var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
                  (function(){
                    var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
                    s1.async=true;
                    s1.src='https://embed.tawk.to/${process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID}/${process.env.NEXT_PUBLIC_TAWK_WIDGET_ID || 'default'}';
                    s1.charset='UTF-8';
                    s1.setAttribute('crossorigin','*');
                    s0.parentNode.insertBefore(s1,s0);
                  })();
                `,
              }}
            />
            <Script
              id="tawk-config"
              strategy="lazyOnload"
              dangerouslySetInnerHTML={{
                __html: `
                  const checkTawk = setInterval(() => {
                    if (window.Tawk_API && window.Tawk_API.hideWidget) {
                      window.Tawk_API.customStyle = {
                        visibility: {
                          desktop: { position: 'br', xOffset: 20, yOffset: 20 },
                          mobile: { position: 'br', xOffset: 10, yOffset: 80 }
                        }
                      };
                      window.Tawk_API.onLoad = function() {
                        console.log('✅ Tawk.to Live Support loaded');
                        try {
                          window.Tawk_API.setAttributes({ name: 'FarmCon User' });
                          // Show Tawk.to by default
                          if (typeof window.Tawk_API.showWidget === 'function') {
                            window.Tawk_API.showWidget();
                          }
                          // Dispatch event to hide AI chatbot
                          window.dispatchEvent(new CustomEvent('tawk-opened'));
                        } catch (error) {
                          console.warn('Tawk.to API error:', error);
                        }
                      };
                      window.Tawk_API.onChatStarted = function() {
                        try {
                          // Add event to show option to return to AI chat
                          console.log('Chat started with human agent');
                        } catch (error) {
                          console.warn('Tawk.to API error:', error);
                        }
                      };
                      window.Tawk_API.onPrechatSubmit = function(data) {
                        try {
                          // Set custom attributes when pre-chat form is submitted
                          window.Tawk_API.setAttributes({
                            'ai_available': 'true',
                            'return_option': 'Type "AI" to return to FarmCon AI assistant'
                          });
                        } catch (error) {
                          console.warn('Tawk.to API error:', error);
                        }
                      };
                      // Add CSS to customize Tawk.to widget
                      const tawkStyle = document.createElement('style');
                      tawkStyle.innerHTML = \`
                        #tawk-return-to-ai {
                          position: fixed;
                          bottom: 90px;
                          right: 20px;
                          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                          color: white;
                          padding: 8px 14px;
                          border-radius: 50px;
                          font-size: 12px;
                          font-weight: 600;
                          cursor: pointer;
                          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
                          z-index: 99999999;
                          display: flex;
                          align-items: center;
                          gap: 6px;
                          transition: all 0.3s ease;
                          border: 2px solid white;
                          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                        }
                        #tawk-return-to-ai.hidden {
                          display: none !important;
                        }
                        #tawk-return-to-ai:hover {
                          transform: translateY(-2px) scale(1.05);
                          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.6);
                          background: linear-gradient(135deg, #059669 0%, #047857 100%);
                        }
                        #tawk-return-to-ai:active {
                          transform: translateY(0) scale(0.98);
                        }
                        @media (max-width: 640px) {
                          #tawk-return-to-ai {
                            bottom: 80px;
                            right: 10px;
                            padding: 7px 12px;
                            font-size: 11px;
                          }
                        }
                      \`;
                      document.head.appendChild(tawkStyle);
                      // Create return to AI button - always visible
                      const returnButton = document.createElement('button');
                      returnButton.id = 'tawk-return-to-ai';
                      returnButton.innerHTML = \`
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M9 11l-6 6v-6a9 9 0 0 1 9-9 9 9 0 0 1 9 9 9 9 0 0 1-9 9"></path>
                        </svg>
                        <span>AI Chat</span>
                      \`;
                      returnButton.onclick = function() {
                        try {
                          if (typeof window.Tawk_API.minimize === 'function') {
                            window.Tawk_API.minimize();
                          }
                          if (typeof window.Tawk_API.hideWidget === 'function') {
                            window.Tawk_API.hideWidget();
                          }
                          window.dispatchEvent(new CustomEvent('tawk-closed'));
                        } catch (error) {
                          console.warn('Tawk.to API error:', error);
                        }
                      };
                      document.body.appendChild(returnButton);
                      // Event handlers for Tawk.to
                      window.Tawk_API.onChatMaximized = function() {
                        try {
                          window.dispatchEvent(new CustomEvent('tawk-opened'));
                        } catch (error) {
                          console.warn('Tawk.to API error:', error);
                        }
                      };
                      window.Tawk_API.onChatMinimized = function() {
                        try {
                          if (typeof window.Tawk_API.hideWidget === 'function') {
                            window.Tawk_API.hideWidget();
                          }
                          window.dispatchEvent(new CustomEvent('tawk-closed'));
                        } catch (error) {
                          console.warn('Tawk.to API error:', error);
                        }
                      };
                      window.Tawk_API.onChatEnded = function() {
                        try {
                          if (typeof window.Tawk_API.hideWidget === 'function') {
                            window.Tawk_API.hideWidget();
                          }
                          window.dispatchEvent(new CustomEvent('tawk-closed'));
                        } catch (error) {
                          console.warn('Tawk.to API error:', error);
                        }
                      };
                      clearInterval(checkTawk);
                    }
                  }, 100);
                  setTimeout(() => clearInterval(checkTawk), 10000);
                `,
              }}
            />
          </>
        )}

        {/* OneSignal Push Notifications */}
        {process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID && (
          <>
            <Script
              src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
              strategy="lazyOnload"
            />
            <Script
              id="onesignal-init"
              strategy="lazyOnload"
              dangerouslySetInnerHTML={{
                __html: `
                  window.OneSignalDeferred = window.OneSignalDeferred || [];
                  window.OneSignalDeferred.push(async function(OneSignal) {
                    try {
                      if (window.location.pathname.includes('/auth/')) {
                        console.log('Skipping OneSignal on auth page');
                        return;
                      }
                      await OneSignal.init({
                        appId: "${process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID}",
                        allowLocalhostAsSecureOrigin: true,
                        safari_web_id: "web.onesignal.auto.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                        notifyButton: {
                          enable: true,
                          displayPredicate: function() {
                            return OneSignal.User.PushSubscription.optedIn !== true;
                          },
                          size: 'medium',
                          theme: 'default',
                          position: 'bottom-left',
                          offset: {
                            bottom: '20px',
                            left: '20px'
                          },
                          showCredit: false,
                          text: {
                            'tip.state.unsubscribed': 'Subscribe to notifications',
                            'tip.state.subscribed': "You're subscribed to notifications",
                            'tip.state.blocked': "You've blocked notifications",
                            'message.prenotify': 'Click to subscribe to notifications',
                            'message.action.subscribed': "Thanks! You're subscribed!",
                            'message.action.resubscribed': "You're subscribed!",
                            'message.action.unsubscribed': "You won't receive notifications again",
                            'dialog.main.title': 'Manage Site Notifications',
                            'dialog.main.button.subscribe': 'SUBSCRIBE',
                            'dialog.main.button.unsubscribe': 'UNSUBSCRIBE',
                            'dialog.blocked.title': 'Unblock Notifications',
                            'dialog.blocked.message': "Follow these instructions to allow notifications:"
                          }
                        },
                        welcomeNotification: {
                          title: "Welcome to FarmCon!",
                          message: "Thanks for enabling notifications! Get updates on orders, weather alerts, and market prices.",
                          url: window.location.origin + "/dashboard"
                        },
                        promptOptions: {
                          slidedown: {
                            enabled: true,
                            autoPrompt: true,
                            timeDelay: 5,
                            pageViews: 1
                          }
                        }
                      });
                      console.log('✅ OneSignal initialized successfully');
                      const isPushSupported = await OneSignal.Notifications.isPushSupported();
                      const permission = await OneSignal.Notifications.permissionNative;
                      console.log('Push supported:', isPushSupported);
                      console.log('Notification permission:', permission);
                      OneSignal.User.PushSubscription.addEventListener('change', function(event) {
                        console.log('Subscription changed:', event);
                        if (event.current.optedIn) {
                          console.log('✅ User is subscribed to push notifications');
                        } else {
                          console.log('❌ User is not subscribed to push notifications');
                        }
                      });
                      try {
                        if ('setAppBadge' in navigator) {
                          console.log('✅ Badge API supported');
                        } else {
                          console.log('ℹ️ Badge API not supported in this browser');
                        }
                      } catch (badgeError) {
                        console.warn('Badge API error (non-critical):', badgeError);
                      }
                    } catch (error) {
                      console.error('❌ OneSignal initialization error:', error);
                      if (error.message && error.message.includes('badge')) {
                        console.warn('Badge API not supported, continuing without badges');
                      }
                    }
                  });
                `,
              }}
            />
          </>
        )}

        <AccessibilityProvider>
          <PostHogProvider>
            <FingerprintProvider>
              {/* Skip to main content link */}
              <a href="#main-content" className="skip-link">
                Skip to main content
              </a>

              {/* Main content wrapper */}
              <main id="main-content" tabIndex={-1}>
                {children}
              </main>

              <ElevenLabsWidget />
              <FarmConChatbot />
              <CookieConsent />

              {/* Accessibility settings panel */}
              <AccessibilityPanel />
            </FingerprintProvider>
          </PostHogProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
