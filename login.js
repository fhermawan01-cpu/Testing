import { auth } from './firebase.js';
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  RecaptchaVerifier,
  signInWithPopup,
  signInWithPhoneNumber,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

let confirmationResult = null;
let recaptchaVerifier  = null;
let lastPhoneNumber    = null;

// Kalau sudah login, langsung ke success
onAuthStateChanged(auth, user => {
  if (user) {
    renderSuccess(user);
    showStep('step-success');
  }
});

// ── Helpers ──────────────────────────────────────────────

function showStep(id) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showToast(message, isError = true) {
  const existing = document.getElementById('auth-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'auth-toast';
  toast.style.cssText = `
    position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
    background: #1c1c1e; border: 1px solid ${isError ? 'rgba(244,63,94,.35)' : 'rgba(163,230,53,.35)'};
    color: ${isError ? '#f43f5e' : '#a3e635'}; padding: .7rem 1.4rem;
    border-radius: 12px; font-size: .82rem; font-weight: 500; z-index: 9999;
    white-space: nowrap; font-family: 'Space Grotesk', sans-serif;
    box-shadow: 0 8px 32px rgba(0,0,0,.5);
    animation: fadeUp .3s ease both;
  `;
  toast.textContent = (isError ? '⚠ ' : '✓ ') + message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function handleAuthError(error) {
  const map = {
    'auth/popup-closed-by-user':                      'Login dibatalin. Coba lagi ya.',
    'auth/popup-blocked':                             'Popup diblokir browser. Izinkan popup dulu.',
    'auth/account-exists-with-different-credential':  'Email sudah terdaftar dengan metode lain.',
    'auth/invalid-phone-number':                      'Format nomor HP salah.',
    'auth/too-many-requests':                         'Terlalu banyak percobaan. Tunggu sebentar.',
    'auth/invalid-verification-code':                 'Kode OTP salah.',
    'auth/code-expired':                              'Kode OTP sudah kedaluwarsa. Kirim ulang.',
    'auth/operation-not-allowed':                     'Metode ini belum diaktifkan di Firebase Console.',
    'auth/network-request-failed':                    'Koneksi bermasalah, cek internet lo.',
    'auth/cancelled-popup-request':                   'Hanya satu popup yang bisa dibuka.',
  };
  showToast(map[error.code] || error.message);
}

function renderSuccess(user) {
  const name = user.displayName || user.phoneNumber || 'Sobat';
  document.querySelector('.success-title').textContent = `Halo, ${name.split(' ')[0]}!`;

  // Tampilkan foto profil kalau ada
  if (user.photoURL) {
    const icon = document.querySelector('.success-icon');
    icon.style.background = 'none';
    icon.style.border = 'none';
    icon.style.padding = '0';
    icon.innerHTML = `<img src="${user.photoURL}" alt="foto" style="width:64px;height:64px;border-radius:20px;object-fit:cover;" />`;
  }
}

// ── Recaptcha (invisible, untuk phone auth) ───────────────

function initRecaptcha() {
  if (recaptchaVerifier) return;
  recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
  });
}

// ── Social Login ──────────────────────────────────────────

async function handleSocial(providerName) {
  let provider;
  switch (providerName) {
    case 'Google':
      provider = new GoogleAuthProvider();
      break;
    case 'Facebook':
      provider = new FacebookAuthProvider();
      break;
    case 'Apple':
      provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      break;
    default:
      return;
  }

  document.getElementById('oauthProvider').textContent = providerName;
  showStep('step-oauth');

  try {
    const result = await signInWithPopup(auth, provider);
    renderSuccess(result.user);
    showStep('step-success');
  } catch (error) {
    showStep('step-choose');
    handleAuthError(error);
  }
}

// ── Phone Auth: Kirim OTP ─────────────────────────────────

async function sendOTP() {
  const phone = document.getElementById('phoneInput').value.trim();
  const code  = document.getElementById('countryCode').value;
  const errEl = document.getElementById('phoneError');
  const btn   = document.getElementById('sendOtpBtn');

  if (!phone || phone.length < 8 || !/^\d+$/.test(phone)) {
    document.getElementById('phoneInput').classList.add('error');
    errEl.classList.add('show');
    setTimeout(() => {
      document.getElementById('phoneInput').classList.remove('error');
      errEl.classList.remove('show');
    }, 2500);
    return;
  }

  lastPhoneNumber = code + phone;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    initRecaptcha();
    confirmationResult = await signInWithPhoneNumber(auth, lastPhoneNumber, recaptchaVerifier);
    document.getElementById('otpTarget').textContent = code + ' ' + phone;
    showStep('step-otp');
    initOTP();
    startResendTimer();
  } catch (error) {
    handleAuthError(error);
    // Reset recaptcha supaya bisa dicoba lagi
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Kirim Kode OTP';
  }
}

// ── Phone Auth: Verifikasi OTP ────────────────────────────

async function verifyOTP() {
  const inputs = document.querySelectorAll('.otp-input');
  const otp    = [...inputs].map(i => i.value).join('');
  const btn    = document.getElementById('verifyOtpBtn');
  const errEl  = document.getElementById('otpError');

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Memverifikasi...';

  try {
    const result = await confirmationResult.confirm(otp);
    renderSuccess(result.user);
    showStep('step-success');
  } catch (error) {
    inputs.forEach(i => i.classList.add('error'));
    errEl.classList.add('show');
    btn.disabled = false;
    btn.textContent = 'Verifikasi';
    handleAuthError(error);
    setTimeout(() => {
      inputs.forEach(i => i.classList.remove('error'));
      errEl.classList.remove('show');
    }, 2500);
  }
}

// ── OTP Input UI ──────────────────────────────────────────

function initOTP() {
  // Clone untuk hapus event listener lama
  document.querySelectorAll('.otp-input').forEach(inp => {
    const clone = inp.cloneNode(true);
    clone.value = '';
    clone.classList.remove('filled', 'error');
    inp.replaceWith(clone);
  });

  document.querySelectorAll('.otp-input').forEach((inp, i, all) => {
    inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/\D/, '');
      inp.classList.toggle('filled', !!inp.value);
      if (inp.value && all[i + 1]) all[i + 1].focus();
      checkOTPComplete();
    });

    inp.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !inp.value && all[i - 1]) {
        all[i - 1].focus();
        all[i - 1].value = '';
        all[i - 1].classList.remove('filled');
      }
    });

    inp.addEventListener('paste', e => {
      e.preventDefault();
      const data = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      [...data].slice(0, 6).forEach((ch, j) => {
        if (all[j]) { all[j].value = ch; all[j].classList.add('filled'); }
      });
      const next = Math.min(data.length, 5);
      if (all[next]) all[next].focus();
      checkOTPComplete();
    });
  });

  document.querySelectorAll('.otp-input')[0].focus();
}

function checkOTPComplete() {
  const full = [...document.querySelectorAll('.otp-input')].every(i => i.value.length === 1);
  document.getElementById('verifyOtpBtn').disabled = !full;
}

// ── Resend Timer ──────────────────────────────────────────

let resendInterval;

function startResendTimer() {
  const btn   = document.getElementById('resendBtn');
  const timer = document.getElementById('resendTimer');
  let   sec   = 60;

  btn.disabled = true;
  timer.textContent = sec;

  clearInterval(resendInterval);
  resendInterval = setInterval(() => {
    sec--;
    timer.textContent = sec;
    if (sec <= 0) {
      clearInterval(resendInterval);
      btn.disabled = false;
      btn.textContent = 'Kirim ulang kode';
    }
  }, 1000);
}

async function resendOTP() {
  const btn = document.getElementById('resendBtn');
  btn.disabled = true;
  btn.textContent = 'Mengirim...';

  try {
    if (recaptchaVerifier) { recaptchaVerifier.clear(); recaptchaVerifier = null; }
    initRecaptcha();
    confirmationResult = await signInWithPhoneNumber(auth, lastPhoneNumber, recaptchaVerifier);
    btn.innerHTML = 'Kirim ulang (<span id="resendTimer">60</span>s)';
    startResendTimer();
    initOTP();
    showToast('Kode baru sudah dikirim!', false);
  } catch (error) {
    handleAuthError(error);
    btn.disabled = false;
    btn.textContent = 'Kirim ulang kode';
  }
}

// ── Expose ke window (untuk onclick di HTML) ──────────────
window.showStep     = showStep;
window.handleSocial = handleSocial;
window.sendOTP      = sendOTP;
window.verifyOTP    = verifyOTP;
window.resendOTP    = resendOTP;
