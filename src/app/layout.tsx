import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FarmConChatbot from "@/components/chatbot/FarmConChatbot";
import PostHogProvider from "@/components/providers/PostHogProvider";
import FingerprintProvider from "@/components/providers/FingerprintProvider";


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
        {/* Real Performance Optimizations */}
        <link rel="preconnect" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />

        {/* Stripe - Real Integration */}
        <script src="https://js.stripe.com/v3/"></script>

        {/* Google Translate Widget */}
        <script
          type="text/javascript"
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
        <script
          type="text/javascript"
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        />

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

        {}
        {process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID && (
          <script
            type="text/javascript"
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

        {}
        {process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID && (
          <>
            <script
              type="text/javascript"
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
            <script
              type="module"
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
                          
                          if (typeof window.Tawk_API.hideWidget === 'function') {
                            window.Tawk_API.hideWidget();
                          }
                        } catch (error) {
                          console.warn('Tawk.to API error:', error);
                        }
                      };

                      window.Tawk_API.onChatMinimized = function() {
                        try {
                          if (typeof window.Tawk_API.hideWidget === 'function') {
                            window.Tawk_API.hideWidget();
                          }
                        } catch (error) {
                          console.warn('Tawk.to API error:', error);
                        }
                      };

                      window.Tawk_API.onChatEnded = function() {
                        try {
                          if (typeof window.Tawk_API.hideWidget === 'function') {
                            window.Tawk_API.hideWidget();
                          }
                        } catch (error) {
                          console.warn('Tawk.to API error:', error);
                        }
                      };

                      try {
                        if (typeof window.Tawk_API.hideWidget === 'function') {
                          window.Tawk_API.hideWidget();
                        }
                      } catch (error) {
                        console.warn('Tawk.to API error:', error);
                      }

                      clearInterval(checkTawk);
                    }
                  }, 100);
                  setTimeout(() => clearInterval(checkTawk), 10000);
                `,
              }}
            />
          </>
        )}

        {}
        {process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID && (
          <>
            <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.OneSignalDeferred = window.OneSignalDeferred || [];
                  window.OneSignalDeferred.push(async function(OneSignal) {
                    try {
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
                          title: "Welcome to FarmCon! 🌾",
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

                    } catch (error) {
                      console.error('❌ OneSignal initialization error:', error);
                    }
                  });
                `,
              }}
            />
          </>
        )}

      </head>

      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PostHogProvider>
          <FingerprintProvider>
            {children}
            <FarmConChatbot />
          </FingerprintProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
