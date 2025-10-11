/**
 * i18next Configuration
 * Multi-language support for FarmCon
 *
 * Supported Languages:
 * - English (en)
 * - Hindi (hi)
 * - Tamil (ta)
 * - Telugu (te)
 * - Bengali (bn)
 * - Kannada (kn)
 * - Marathi (mr)
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Translation resources
const resources = {
  en: {
    translation: {
      // Common
      welcome: 'Welcome to FarmCon',
      home: 'Home',
      about: 'About',
      products: 'Products',
      cart: 'Cart',
      orders: 'Orders',
      profile: 'Profile',
      logout: 'Logout',
      login: 'Login',
      signup: 'Sign Up',
      search: 'Search',

      // Dashboard
      dashboard: 'Dashboard',
      myOrders: 'My Orders',
      myProducts: 'My Products',
      suppliers: 'Suppliers',
      buyers: 'Buyers',

      // Products
      addToCart: 'Add to Cart',
      buyNow: 'Buy Now',
      price: 'Price',
      quantity: 'Quantity',
      available: 'Available',
      outOfStock: 'Out of Stock',

      // Weather
      weather: 'Weather',
      temperature: 'Temperature',
      humidity: 'Humidity',
      rainfall: 'Rainfall',
      forecast: 'Forecast',

      // Market Prices
      marketPrices: 'Market Prices',
      mandiPrices: 'Mandi Prices',
      commodity: 'Commodity',
      minPrice: 'Min Price',
      maxPrice: 'Max Price',
      modalPrice: 'Modal Price',

      // Notifications
      notifications: 'Notifications',
      newOrder: 'New Order',
      orderShipped: 'Order Shipped',
      orderDelivered: 'Order Delivered',

      // Messages
      successMessage: 'Success!',
      errorMessage: 'Error occurred',
      loading: 'Loading...',
      saveChanges: 'Save Changes',
      cancel: 'Cancel',
    },
  },
  hi: {
    translation: {
      // Common
      welcome: 'FarmCon में आपका स्वागत है',
      home: 'होम',
      about: 'हमारे बारे में',
      products: 'उत्पाद',
      cart: 'कार्ट',
      orders: 'आदेश',
      profile: 'प्रोफ़ाइल',
      logout: 'लॉग आउट',
      login: 'लॉगिन',
      signup: 'साइन अप करें',
      search: 'खोजें',

      // Dashboard
      dashboard: 'डैशबोर्ड',
      myOrders: 'मेरे आदेश',
      myProducts: 'मेरे उत्पाद',
      suppliers: 'आपूर्तिकर्ता',
      buyers: 'खरीदार',

      // Products
      addToCart: 'कार्ट में डालें',
      buyNow: 'अभी खरीदें',
      price: 'कीमत',
      quantity: 'मात्रा',
      available: 'उपलब्ध',
      outOfStock: 'स्टॉक में नहीं',

      // Weather
      weather: 'मौसम',
      temperature: 'तापमान',
      humidity: 'आर्द्रता',
      rainfall: 'वर्षा',
      forecast: 'पूर्वानुमान',

      // Market Prices
      marketPrices: 'बाजार मूल्य',
      mandiPrices: 'मंडी भाव',
      commodity: 'वस्तु',
      minPrice: 'न्यूनतम मूल्य',
      maxPrice: 'अधिकतम मूल्य',
      modalPrice: 'मॉडल मूल्य',

      // Notifications
      notifications: 'सूचनाएं',
      newOrder: 'नया आदेश',
      orderShipped: 'आदेश भेज दिया गया',
      orderDelivered: 'आदेश वितरित',

      // Messages
      successMessage: 'सफलता!',
      errorMessage: 'त्रुटि हुई',
      loading: 'लोड हो रहा है...',
      saveChanges: 'परिवर्तन सहेजें',
      cancel: 'रद्द करें',
    },
  },
  ta: {
    translation: {
      // Common
      welcome: 'FarmCon க்கு வரவேற்கிறோம்',
      home: 'முகப்பு',
      about: 'எங்களை பற்றி',
      products: 'தயாரிப்புகள்',
      cart: 'கூடை',
      orders: 'ஆர்டர்கள்',
      profile: 'சுயவிவரம்',
      logout: 'வெளியேறு',
      login: 'உள்நுழைய',
      signup: 'பதிவு செய்யவும்',
      search: 'தேடல்',

      // Dashboard
      dashboard: 'டாஷ்போர்டு',
      myOrders: 'என் ஆர்டர்கள்',
      myProducts: 'என் தயாரிப்புகள்',
      suppliers: 'சப்ளையர்கள்',
      buyers: 'வாங்குபவர்கள்',

      // Products
      addToCart: 'கூடையில் சேர்க்கவும்',
      buyNow: 'இப்போது வாங்கவும்',
      price: 'விலை',
      quantity: 'அளவு',
      available: 'கிடைக்கும்',
      outOfStock: 'இருப்பில் இல்லை',

      // Weather
      weather: 'வானிலை',
      temperature: 'வெப்பநிலை',
      humidity: 'ஈரப்பதம்',
      rainfall: 'மழை',
      forecast: 'முன்னறிவிப்பு',

      // Market Prices
      marketPrices: 'சந்தை விலைகள்',
      mandiPrices: 'மண்டி விலைகள்',
      commodity: 'பொருள்',
      minPrice: 'குறைந்தபட்ச விலை',
      maxPrice: 'அதிகபட்ச விலை',
      modalPrice: 'மாதிரி விலை',

      // Notifications
      notifications: 'அறிவிப்புகள்',
      newOrder: 'புதிய ஆர்டர்',
      orderShipped: 'ஆர்டர் அனுப்பப்பட்டது',
      orderDelivered: 'ஆர்டர் வழங்கப்பட்டது',

      // Messages
      successMessage: 'வெற்றி!',
      errorMessage: 'பிழை ஏற்பட்டது',
      loading: 'ஏற்றுகிறது...',
      saveChanges: 'மாற்றங்களை சேமிக்கவும்',
      cancel: 'ரத்துசெய்',
    },
  },
  te: {
    translation: {
      // Common
      welcome: 'FarmCon కు స్వాగతం',
      home: 'హోమ్',
      about: 'మా గురించి',
      products: 'ఉత్పత్తులు',
      cart: 'కార్ట్',
      orders: 'ఆర్డర్లు',
      profile: 'ప్రొఫైల్',
      logout: 'లాగ్అవుట్',
      login: 'లాగిన్',
      signup: 'సైన్ అప్',
      search: 'శోధించండి',

      // Dashboard
      dashboard: 'డాష్‌బోర్డ్',
      myOrders: 'నా ఆర్డర్లు',
      myProducts: 'నా ఉత్పత్తులు',
      suppliers: 'సప్లయర్లు',
      buyers: 'కొనుగోలుదారులు',

      // Products
      addToCart: 'కార్ట్‌కు జోడించండి',
      buyNow: 'ఇప్పుడు కొనండి',
      price: 'ధర',
      quantity: 'పరిమాణం',
      available: 'అందుబాటులో ఉంది',
      outOfStock: 'స్టాక్ అయిపోయింది',

      // Weather
      weather: 'వాతావరణం',
      temperature: 'ఉష్ణోగ్రత',
      humidity: 'తేమ',
      rainfall: 'వర్షపాతం',
      forecast: 'అంచనా',

      // Market Prices
      marketPrices: 'మార్కెట్ ధరలు',
      mandiPrices: 'మండీ ధరలు',
      commodity: 'వస్తువు',
      minPrice: 'కనీస ధర',
      maxPrice: 'గరిష్ట ధర',
      modalPrice: 'మోడల్ ధర',

      // Notifications
      notifications: 'నోటిఫికేషన్లు',
      newOrder: 'కొత్త ఆర్డర్',
      orderShipped: 'ఆర్డర్ షిప్ చేయబడింది',
      orderDelivered: 'ఆర్డర్ డెలివర్ చేయబడింది',

      // Messages
      successMessage: 'విజయం!',
      errorMessage: 'లోపం సంభవించింది',
      loading: 'లోడ్ అవుతోంది...',
      saveChanges: 'మార్పులను సేవ్ చేయండి',
      cancel: 'రద్దు చేయండి',
    },
  },
}

// Initialize i18next
i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Fallback language
    debug: false, // Set to true for debugging

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      // Order of language detection
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Cache user language
      caches: ['localStorage'],
    },
  })

export default i18n
