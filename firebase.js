import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getAnalytics }   from "https://www.gstatic.com/firebasejs/12.15.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey:            "AIzaSyCzUTvzAn3-eq96voBUr9u3ArguWaRl2Jw",
  authDomain:        "website-testing-13264.firebaseapp.com",
  projectId:         "website-testing-13264",
  storageBucket:     "website-testing-13264.firebasestorage.app",
  messagingSenderId: "224908867961",
  appId:             "1:224908867961:web:095321354e1d71b9eb97a8",
  measurementId:     "G-E52HZBKLBZ"
};

const app = initializeApp(firebaseConfig);

export const auth      = getAuth(app);
export const analytics = getAnalytics(app);
