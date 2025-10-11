import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FarmConChatbot from "@/components/chatbot/FarmConChatbot";
import PostHogProvider from "@/components/providers/PostHogProvider";


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

        {/* Microsoft Clarity - Analytics & Session Recording */}
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

        {/* Tawk.to - Live Chat Support (Bottom-Left) */}
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
                  // Customize Tawk.to position and styling
                  const checkTawk = setInterval(() => {
                    if (window.Tawk_API) {
                      // Position on bottom-right (same place as AI chatbot)
                      window.Tawk_API.customStyle = {
                        visibility: {
                          desktop: { position: 'br', xOffset: 20, yOffset: 20 },
                          mobile: { position: 'br', xOffset: 10, yOffset: 80 }
                        }
                      };

                      window.Tawk_API.onLoad = function() {
                        console.log('✅ Tawk.to Live Support loaded');
                        window.Tawk_API.setAttributes({ name: 'FarmCon User' });
                        // Hide widget by default - only show when "Talk to Human" is clicked
                        window.Tawk_API.hideWidget();
                      };

                      // When chat is minimized, hide the widget completely
                      window.Tawk_API.onChatMinimized = function() {
                        window.Tawk_API.hideWidget();
                      };

                      // When chat is ended, hide the widget completely
                      window.Tawk_API.onChatEnded = function() {
                        window.Tawk_API.hideWidget();
                      };

                      // Hide immediately if already loaded
                      window.Tawk_API.hideWidget();

                      clearInterval(checkTawk);
                    }
                  }, 100);
                  setTimeout(() => clearInterval(checkTawk), 10000);
                `,
              }}
            />
          </>
        )}

        

        {/* OneSignal Web Push Notifications */}
        {process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID && (
          <>
            <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.OneSignalDeferred = window.OneSignalDeferred || [];
                  OneSignalDeferred.push(async function(OneSignal) {
                    await OneSignal.init({
                      appId: "${process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID}",
                      allowLocalhostAsSecureOrigin: true,
                      notifyButton: {
                        enable: true,
                        displayPredicate: function() {
                          return true;
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
                        title: "FarmCon",
                        message: "Thanks for enabling notifications! Get updates on orders, weather, and market prices."
                      }
                    });
                    console.log('✅ OneSignal initialized');
                  });
                `,
              }}
            />
          </>
        )}

      </head>

      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PostHogProvider>
          {children}
          <FarmConChatbot />
        </PostHogProvider>
      </body>
    </html>
  );
}
