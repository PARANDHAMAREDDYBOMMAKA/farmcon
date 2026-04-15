import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import PostHogProvider from "@/components/providers/PostHogProvider";
import FingerprintProvider from "@/components/providers/FingerprintProvider";
import CookieConsent from "@/components/CookieConsent";
import AIAssistantMount from "@/components/assistant/AIAssistantMount";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://farmcon.in";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "FarmCon — Smart Agri OS for Indian Farmers",
    template: "%s · FarmCon",
  },
  description:
    "Live mandi prices, AI crop advisory, hyperlocal weather, equipment rentals, and direct-to-buyer sales — all in one platform trusted by 10,000+ farmers across India.",
  applicationName: "FarmCon",
  keywords: [
    "mandi prices",
    "farmers India",
    "crop advisory",
    "agri-tech",
    "agricultural marketplace",
    "farming app",
    "equipment rental",
    "AGMARKNET",
  ],
  authors: [{ name: "FarmCon" }],
  creator: "FarmCon",
  manifest: "/manifest.json",
  icons: {
    icon: "/farmcon.jpg",
    shortcut: "/farmcon.jpg",
    apple: "/farmcon.jpg",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: APP_URL,
    siteName: "FarmCon",
    title: "FarmCon — Smart Agri OS for Indian Farmers",
    description:
      "Live mandi prices, AI crop advisory, hyperlocal weather, equipment rentals, and direct-to-buyer sales — in one platform.",
    images: [{ url: "/farmcon.jpg", width: 1200, height: 630, alt: "FarmCon" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FarmCon — Smart Agri OS for Indian Farmers",
    description:
      "Live mandi prices, AI crop advisory, hyperlocal weather, equipment rentals, and direct-to-buyer sales.",
    images: ["/farmcon.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: APP_URL,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FarmCon",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" translate="no" className="notranslate">
      <head>
        {/* Critical Resource Hints */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://www.clarity.ms" />
        <link rel="dns-prefetch" href="https://embed.tawk.to" />
        <link rel="dns-prefetch" href="https://cdn.onesignal.com" />

        <link rel="icon" href="/farmcon.jpg" />
        <link rel="apple-touch-icon" href="/farmcon.jpg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="google" content="notranslate" />
        <meta httpEquiv="Content-Language" content="en" />

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

        {process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID && (
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
                var tawkReady = setInterval(function () {
                  if (window.Tawk_API && typeof window.Tawk_API.hideWidget === 'function') {
                    try {
                      window.Tawk_API.hideWidget();
                      window.Tawk_API.onChatMinimized = function () {
                        try { window.Tawk_API.hideWidget(); } catch (e) {}
                      };
                      window.Tawk_API.onChatEnded = function () {
                        try { window.Tawk_API.hideWidget(); } catch (e) {}
                      };
                    } catch (e) {}
                    clearInterval(tawkReady);
                  }
                }, 200);
                setTimeout(function () { clearInterval(tawkReady); }, 10000);
              `,
            }}
          />
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
                      console.log(' OneSignal initialized successfully');
                      const isPushSupported = await OneSignal.Notifications.isPushSupported();
                      const permission = await OneSignal.Notifications.permissionNative;
                      console.log('Push supported:', isPushSupported);
                      console.log('Notification permission:', permission);
                      OneSignal.User.PushSubscription.addEventListener('change', function(event) {
                        console.log('Subscription changed:', event);
                        if (event.current.optedIn) {
                          console.log(' User is subscribed to push notifications');
                        } else {
                          console.log(' User is not subscribed to push notifications');
                        }
                      });
                      try {
                        if ('setAppBadge' in navigator) {
                          console.log(' Badge API supported');
                        } else {
                          console.log('ℹ Badge API not supported in this browser');
                        }
                      } catch (badgeError) {
                        console.warn('Badge API error (non-critical):', badgeError);
                      }
                    } catch (error) {
                      console.error(' OneSignal initialization error:', error);
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

        <PostHogProvider>
          <FingerprintProvider>
            <main id="main-content">
              {children}
            </main>

            <AIAssistantMount />
            <CookieConsent />
          </FingerprintProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
