import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBh1eoay6tBYs8HA0sbERlwe7ljJ_khqPw",
  authDomain: "farmcon-5f6b9.firebaseapp.com",
  projectId: "farmcon-5f6b9",
  storageBucket: "farmcon-5f6b9.firebasestorage.app",
  messagingSenderId: "243180448760",
  appId: "1:243180448760:web:69c7893526f47e616bc40d",
  measurementId: "G-JC60YYVBTJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Only initialize analytics in browser environment
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };

// Phone authentication utilities
export const setupRecaptcha = (containerId: string) => {
  return new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved, can proceed with phone verification
    },
    'expired-callback': () => {
      // Response expired, reset reCAPTCHA
    }
  });
};

export const sendPhoneOTP = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return confirmationResult;
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  }
};

export default app;