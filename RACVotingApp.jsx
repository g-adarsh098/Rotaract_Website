import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, serverTimestamp, query, orderBy, doc, getDoc, setDoc, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// --- FIREBASE CONFIGURATION ---
// Replace these with your actual Firebase Project config!
const firebaseConfig = {
  apiKey: "AIzaSyDajJHZWhPeum1VP6SbrgNFxoS-a2PceAU",
  authDomain: "rotaract-website-646f7.firebaseapp.com",
  projectId: "rotaract-website-646f7",
  storageBucket: "rotaract-website-646f7.firebasestorage.app",
  messagingSenderId: "835309348999",
  appId: "1:835309348999:web:21c50996c53cf09126b022"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

// --- CONFIGURATION & MOCK DATA ---
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzKBHOhE4y_8ebaIlXasOsQcaixBMtGObDZaQacBa-bTuNmrQUsdO0SQSgzI1iQKLA/exec';
const ADMIN_PASSKEY = 'RAC2024'; // Added missing passkey definition

const MOCK_CANDIDATES = {
  logo: '/logo.png',
  president: [
    { id: 'p1', name: 'Alex Carter', speech: 'Empowering our members through leadership, transparency, and relentless community service. Together, we can achieve more.', image: 'https://i.pravatar.cc/150?u=alex', poster: '', video: '' },
    { id: 'p2', name: 'Jordan Lee', speech: 'Focused on innovation, holistic growth, and building lasting professional networks for every single Rotaractor.', image: 'https://i.pravatar.cc/150?u=jordan', poster: '', video: '' }
  ]
};

// --- COMPONENTS ---

const Login = ({ onLogin, onGoToAdmin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState('');

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanContact = contact.trim();

    if (!name.trim() || !cleanEmail || !cleanContact || !department.trim() || !year.trim()) {
      setError('⚠️ Please fill in all fields to proceed.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('⚠️ Invalid Email: Please enter a valid email address.');
      return;
    }

    // Contact number validation (must be exactly 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(cleanContact)) {
      setError('⚠️ Invalid Number: Contact number must be exactly 10 digits.');
      return;
    }

    try {
      // Check for duplicate voter in Firestore (Parallel checks for performance)
      const emailQuery = query(collection(db, "votes"), where("email", "==", cleanEmail));
      const contactQuery = query(collection(db, "votes"), where("contact", "==", cleanContact));

      const [emailSnap, contactSnap] = await Promise.all([
        getDocs(emailQuery),
        getDocs(contactQuery)
      ]);

      if (!emailSnap.empty) {
        setError('⚠️ Duplicate Entry: This email address is already registered in our records.');
        return;
      }

      if (!contactSnap.empty) {
        setError('⚠️ Duplicate Entry: This contact number is already registered in our records.');
        return;
      }

      // Mapping user details to maintain compatibility
      onLogin({ name: name.trim(), email: cleanEmail, contact: cleanContact, department: department.trim(), year: year.trim(), roll: 'N/A' });
    } catch (err) {
      console.error("Verification error:", err);
      setError('⚠️ Connection Error: Unable to verify voter status. Please check your internet.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[100dvh] p-4 bg-[#050505]">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-[#222] rounded-3xl shadow-2xl overflow-hidden relative my-4 sm:my-8">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#A0522D] via-[#D4AF37] to-[#A0522D]"></div>
        <div className="p-6 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-black text-[#D4AF37] mb-2 tracking-tighter drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">RAC PSVPEC</h1>
            <p className="text-gray-400 text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase">Official Election Portal</p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-white placeholder-gray-600"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-white placeholder-gray-600"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Contact Number</label>
              <input
                type="tel"
                value={contact}
                onChange={e => setContact(e.target.value)}
                className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-white placeholder-gray-600"
                placeholder="+1 234 567 8900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Department</label>
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-white placeholder-gray-600"
                placeholder="e.g. Computer Science"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Year</label>
              <select
                value={year}
                onChange={e => setYear(e.target.value)}
                className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-white placeholder-gray-600"
              >
                <option value="" disabled>Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>

              </select>
            </div>

            {error && <p className="text-red-500 text-sm font-medium bg-red-950/30 p-3 rounded-lg border border-red-900/50 mt-2">{error}</p>}

            <button
              type="submit"
              className="w-full py-3.5 px-4 mt-6 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#ebd074] transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)]"
            >
              Continue
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={onGoToAdmin}
              className="text-gray-500 text-xs font-semibold uppercase tracking-wider hover:text-[#D4AF37] transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="24 24 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Admin Access
            </button>
          </div>
        </div>
      </div>
      <a
        href="https://okokservice.tech"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 text-xs text-[#D4AF37] font-bold tracking-wider z-50 bg-black/80 backdrop-blur-md border border-[#D4AF37]/40 px-4 py-2 rounded-full hover:bg-[#D4AF37] hover:text-black transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] flex items-center gap-2"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        Made By okokservice.tech
      </a>
    </div>
  );
};

const AdminLogin = ({ onAdminLogin, onBackToVoter }) => {
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleGoogleAdminLogin = async () => {
    setIsAuthenticating(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (user.email === 'adarshg1502@gmail.com') {
        onAdminLogin();
      } else {
        setError('Access Denied: Only authorized administrators can access this portal.');
      }
    } catch (err) {
      console.error(err);
      setError('Authentication failed: ' + err.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-[#050505]">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-[#D4AF37]/30 rounded-2xl shadow-[0_0_40px_rgba(212,175,55,0.1)] overflow-hidden relative my-8">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4AF37] via-[#fff] to-[#D4AF37]"></div>
        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white mb-2 tracking-wide">Admin Portal</h1>
            <p className="text-[#D4AF37] text-xs font-semibold tracking-widest uppercase letter-spacing-2">Secure Google Access</p>
          </div>

          <div className="space-y-6">
            <p className="text-gray-400 text-sm text-center px-4">
              Please sign in with your authorized Google account to access the administrative dashboard.
            </p>

            <button
              onClick={handleGoogleAdminLogin}
              disabled={isAuthenticating}
              className="w-full py-4 px-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-3 transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAuthenticating ? (
                <div className="animate-spin w-5 h-5 border-2 border-gray-400 border-t-black rounded-full"></div>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              {isAuthenticating ? 'Authenticating...' : 'Sign in with Google'}
            </button>

            {error && (
              <div className="text-red-500 text-sm font-medium bg-red-950/30 p-4 rounded-xl border border-red-900/50 flex gap-3 animate-pulse">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                {error}
              </div>
            )}
          </div>

          <div className="mt-10 text-center border-t border-[#222] pt-8">
            <button type="button" onClick={onBackToVoter} className="text-gray-500 text-xs font-semibold uppercase tracking-wider hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto group">
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              Back to Voter Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const getEmbedUrl = (url) => {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}`;

  // Vimeo
  const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1&loop=1`;

  // Google Drive
  const driveMatch = url.match(/(?:https?:\/\/)?(?:drive\.google\.com\/(?:file\/d\/|open\?id=))([a-zA-Z0-9_-]+)/);
  if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;

  return null;
};

const CandidateCard = ({ candidate, isSelected, onSelect }) => {
  const [mediaIndex, setMediaIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const touchStartRef = React.useRef(0);

  const mediaList = [
    { type: 'image', url: candidate.poster || candidate.image },
    { type: 'video', url: candidate.video }
  ].filter(m => m.url);

  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartRef.current - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) setMediaIndex(prev => (prev + 1) % mediaList.length);
      else setMediaIndex(prev => (prev - 1 + mediaList.length) % mediaList.length);
    }
  };

  return (
    <div
      className={`relative group rounded-2xl overflow-hidden transition-all duration-500 border-2 flex flex-col h-full ${isSelected
        ? 'border-[#D4AF37] bg-[#1a1508] shadow-[0_0_40px_rgba(212,175,55,0.2)] scale-[1.02]'
        : 'border-[#222] bg-[#0a0a0a] hover:border-[#444] hover:bg-[#111]'
        }`}
    >
      {isSelected && (
        <div className="absolute top-4 right-4 bg-[#D4AF37] text-black w-8 h-8 rounded-full flex items-center justify-center z-20 shadow-[0_0_10px_rgba(212,175,55,0.5)]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
        </div>
      )}

      <div
        className="relative h-72 sm:h-80 touch-pan-y cursor-pointer group/media"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => setIsLightboxOpen(true)}
      >
        <div className="absolute inset-0 overflow-hidden">
          {mediaList.length > 0 ? (
            mediaList.map((media, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out transform ${idx === mediaIndex ? 'opacity-100 translate-x-0' : idx < mediaIndex ? 'opacity-0 -translate-x-full' : 'opacity-0 translate-x-full'
                  }`}
              >
                {/* Background Blur Layer */}
                <div className="absolute inset-0 z-0">
                  {media.type === 'image' ? (
                    <img
                      src={media.url}
                      className="w-full h-full object-cover blur-2xl opacity-40 scale-110"
                      alt=""
                    />
                  ) : (
                    <div className="w-full h-full bg-black/60 blur-2xl"></div>
                  )}
                </div>

                {/* Foreground Media Layer */}
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                  {media.type === 'video' ? (
                    getEmbedUrl(media.url) ? (
                      <iframe
                        src={getEmbedUrl(media.url)}
                        className="w-full h-full object-contain border-0"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        title={`${candidate.name} campaign video`}
                      />
                    ) : (
                      <video
                        src={media.url}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    )
                  ) : (
                    <img
                      src={media.url}
                      alt={`${candidate.name} poster`}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>

                {/* Click to Enlarge Hint */}
                <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/20 transition-colors flex items-center justify-center z-20">
                  <div className="opacity-0 group-hover/media:opacity-100 bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border border-white/10 transition-all transform translate-y-4 group-hover/media:translate-y-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                    Tap to Enlarge
                  </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent pointer-events-none z-30"></div>
              </div>
            ))
          ) : (
            <div className="w-full h-full bg-[#111] flex items-center justify-center">
              <img src={candidate.image} className="w-32 h-32 rounded-full opacity-50 blur-sm" />
            </div>
          )}
        </div>

        {/* Profile Circle Overlay */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-40">
          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 p-1 transition-all duration-500 shadow-2xl ${isSelected ? 'border-[#D4AF37] rotate-3' : 'border-[#A0522D] group-hover:border-[#b8633b]'}`}>
            <img src={candidate.image} alt={candidate.name} className="w-full h-full object-cover rounded-full bg-[#0a0a0a]" />
          </div>
        </div>

        {/* Media Indicators / Swipe Hint */}
        {mediaList.length > 1 && (
          <div className="absolute top-4 left-4 flex gap-1.5 z-40">
            {mediaList.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setMediaIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === mediaIndex ? 'w-8 bg-[#D4AF37]' : 'w-2 bg-white/30'}`}
              ></button>
            ))}
          </div>
        )}

        {mediaList.length > 1 && mediaIndex === 0 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-bounce-x text-white/50 z-40 hidden sm:block">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </div>
        )}
      </div>

      {/* Lightbox / Focused Media View */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#050505]/90 backdrop-blur-2xl animate-in fade-in duration-300"
            onClick={() => setIsLightboxOpen(false)}
          ></div>

          <div className="relative z-[1001] w-full max-w-5xl h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-0 right-0 sm:-top-12 p-3 text-white/70 hover:text-[#D4AF37] transition-all bg-white/5 sm:bg-transparent rounded-full backdrop-blur-md sm:backdrop-blur-none z-[1002]"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="relative w-full max-h-[80vh] flex items-center justify-center rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/5">
              {/* Internal Blurred Backdrop for Lightbox */}
              <div className="absolute inset-0 pointer-events-none">
                {mediaList[mediaIndex].type === 'image' && (
                  <img src={mediaList[mediaIndex].url} className="w-full h-full object-cover blur-3xl opacity-30 scale-150" alt="" />
                )}
              </div>

              {mediaList[mediaIndex].type === 'video' ? (
                getEmbedUrl(mediaList[mediaIndex].url) ? (
                  <iframe
                    src={getEmbedUrl(mediaList[mediaIndex].url)}
                    className="w-full aspect-video max-h-[80vh] border-0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={mediaList[mediaIndex].url}
                    autoPlay
                    controls
                    className="max-w-full max-h-[80vh] object-contain"
                  />
                )
              ) : (
                <img
                  src={mediaList[mediaIndex].url}
                  className="max-w-full max-h-[80vh] object-contain select-none"
                  alt="Focused Media"
                />
              )}
            </div>

            {/* Lightbox Controls */}
            {mediaList.length > 1 && (
              <div className="mt-8 flex gap-4 items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMediaIndex(prev => (prev - 1 + mediaList.length) % mediaList.length);
                  }}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="flex gap-2">
                  {mediaList.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${idx === mediaIndex ? 'w-8 bg-[#D4AF37]' : 'w-2 bg-white/20'}`}
                    ></div>
                  ))}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMediaIndex(prev => (prev + 1) % mediaList.length);
                  }}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}

            <div className="mt-6 text-center px-6">
              <h4 className="text-[#D4AF37] font-bold text-lg">{candidate.name}</h4>
              <p className="text-gray-400 text-sm mt-1 uppercase tracking-[0.2em]">{mediaList[mediaIndex].type === 'video' ? 'Campaign Video' : 'Campaign Poster'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 sm:p-8 pt-12 sm:pt-16 flex flex-col items-center text-center flex-grow justify-between min-h-[280px]">
        <div className="flex flex-col items-center">
          <h3 className={`text-2xl sm:text-3xl font-bold mb-2 transition-colors ${isSelected ? 'text-[#D4AF37]' : 'text-white group-hover:text-gray-200'}`}>
            {candidate.name}
          </h3>
          <div className={`w-12 h-1 mb-4 rounded-full transition-all duration-500 ${isSelected ? 'w-24 bg-[#D4AF37]' : 'bg-[#A0522D]'}`}></div>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed italic line-clamp-4">
            "{candidate.speech}"
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={`w-full py-4 rounded-xl font-black text-sm sm:text-base uppercase tracking-widest transition-all duration-300 transform active:scale-95 ${isSelected
            ? 'bg-[#D4AF37] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]'
            : 'bg-transparent border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black shadow-lg'
            }`}
        >
          {isSelected ? '✓ Selected' : 'Vote Me'}
        </button>
      </div>
    </div>
  );
};

const VotingPage = ({ user, onVote, onLogout, onGoToAdmin, candidates }) => {
  const [selections, setSelections] = useState({ president: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelect = (role, candidateId) => {
    setSelections(prev => ({ ...prev, [role]: candidateId }));
  };

  const submitVote = async () => {
    if (!selections.president) return;
    setIsSubmitting(true);
    await onVote(selections);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen pb-32 relative">
      {/* Background Image Layer */}
      <div className="fixed inset-0 z-0">
        <img src="/wmremove-transformed.png" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60"></div>
      </div>
      <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto p-4 sm:px-6 lg:px-8 flex justify-between items-center h-20">
          <div className="flex items-center gap-3 sm:gap-4">
            <img src={candidates.logo || '/logo.png'} alt="RAC PSVPEC Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#D4AF37] tracking-tight">RAC PSVPEC</h1>
              <p className="text-gray-400 text-xs sm:text-sm mt-0.5">Voter: <span className="text-white font-medium">{user.name}</span></p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 items-center">
            {user.email === 'adarshg1502@gmail.com' && (
              <button onClick={onGoToAdmin} className="text-xs sm:text-sm text-black bg-[#D4AF37] hover:bg-[#ebd074] transition-colors px-3 py-2 sm:px-4 sm:py-2 rounded-md font-bold flex items-center gap-2 shadow-[0_0_10px_rgba(212,175,55,0.4)]">
                Admin Panel
              </button>
            )}
            <button onClick={onLogout} className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors border border-[#333] px-3 py-2 sm:px-4 sm:py-2 rounded-md hover:bg-[#111] flex items-center gap-2">
              <svg className="w-4 h-4 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto p-4 sm:px-6 lg:px-8 py-12">
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-light text-white tracking-widest uppercase mb-2">
              President <span className="text-[#D4AF37] font-bold">Candidates</span>
            </h2>
            <div className="w-24 h-1 bg-[#222] mx-auto rounded-full"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
            {candidates.president.map(c => (
              <CandidateCard
                key={c.id}
                candidate={c}
                isSelected={selections.president === c.id}
                onSelect={() => handleSelect('president', c.id)}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-black/60 backdrop-blur-xl border-t border-white/10 p-4 sm:p-5 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm font-medium text-center sm:text-left">
            {selections.president
              ? <span className="text-[#D4AF37] flex items-center gap-2 justify-center sm:justify-start font-bold">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Selection made. Ready to cast your vote.
              </span>
              : <span className="text-gray-400">Please select a candidate to proceed.</span>}
          </div>
          <button
            onClick={submitVote}
            disabled={!selections.president || isSubmitting}
            className={`w-full sm:w-auto px-10 py-3.5 font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${selections.president && !isSubmitting
              ? 'bg-[#D4AF37] text-black hover:bg-[#ebd074] shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transform hover:-translate-y-1 active:translate-y-0'
              : 'bg-[#222] text-gray-600 cursor-not-allowed border border-[#333]'
              }`}
          >
            {isSubmitting ? 'Casting Vote...' : 'Submit Final Vote'}
          </button>
        </div>
      </div>
      <a
        href="https://okokservice.tech"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 right-4 text-xs text-[#D4AF37] font-bold tracking-wider z-[60] bg-black/80 backdrop-blur-md border border-[#D4AF37]/40 px-4 py-2 rounded-full hover:bg-[#D4AF37] hover:text-black transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] flex items-center gap-2"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        okokservice.tech
      </a>
    </div>
  );
};

const SuccessView = ({ onLogout }) => (
  <div className="flex items-center justify-center min-h-screen p-4 bg-[#050505]">
    <div className="bg-[#0a0a0a] border border-[#222] p-10 sm:p-14 rounded-3xl max-w-lg w-full text-center relative overflow-hidden shadow-2xl">
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl"></div>

      <div className="w-24 h-24 bg-[#1a1508] border-2 border-[#D4AF37] text-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
      </div>

      <h2 className="text-4xl font-black text-white mb-4">Vote Recorded</h2>
      <p className="text-gray-400 mb-10 leading-relaxed text-sm sm:text-base">
        Thank you for participating in the RAC PSVPEC elections. Your voice shapes our future.
      </p>

      <button
        onClick={onLogout}
        className="w-full py-4 bg-transparent hover:bg-[#111] text-[#D4AF37] font-bold uppercase tracking-wider rounded-xl transition-all border-2 border-[#D4AF37] hover:shadow-[0_0_15px_rgba(212,175,55,0.2)]"
      >
        Return to Home
      </button>
    </div>
  </div>
);

const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

const AdminDashboard = ({ onLogout, candidates, setCandidates }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('results'); // 'results' | 'candidates'
  const [editingCandidates, setEditingCandidates] = useState(JSON.parse(JSON.stringify(candidates)));
  const [uploading, setUploading] = useState({}); // { [candidateId]: boolean }
  const [uploadProgress, setUploadProgress] = useState({}); // { [candidateId]: number }

  const fetchResults = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "votes"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedVotes = querySnapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        timestamp: d.data().createdAt ? d.data().createdAt.toDate().toLocaleString() : d.data().timestamp
      }));
      setResults(fetchedVotes);
      setLoading(false);
    } catch (e) {
      console.error("Error fetching votes from Firestore:", e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const handleCandidateChange = (role, id, field, value) => {
    const updated = { ...editingCandidates };
    const idx = updated[role].findIndex(c => c.id === id);
    if (idx !== -1) {
      updated[role][idx][field] = value;
      setEditingCandidates(updated);
    }
  };

  const handleFileUpload = async (role, id, field, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // OPTION 1: If it's a small image, convert to Base64 and store directly in Firestore
    if (file.type.startsWith('image/') && file.size < 800 * 1024) {
      try {
        setUploading(prev => ({ ...prev, [id]: true }));
        setUploadProgress(prev => ({ ...prev, [id]: 100 }));
        const base64Link = await convertToBase64(file);

        setEditingCandidates(prev => {
          const updated = { ...prev };
          if (field === 'logo') {
            updated.logo = base64Link;
          } else {
            const idx = updated[role].findIndex(c => c.id === id);
            if (idx !== -1) {
              updated[role][idx][field] = base64Link;
            }
          }
          return updated;
        });

        setUploading(prev => ({ ...prev, [id]: false }));
        return;
      } catch (err) {
        console.error("Base64 conversion failed", err);
      }
    }

    // OPTION 2: For larger files or videos, use Firebase Storage
    // File type validation
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (field === 'poster' && !isImage) {
      alert("Please upload an image file for the poster.");
      return;
    }
    if (field === 'video' && !isVideo) {
      alert("Please upload a video file for the campaign video.");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      alert("File is too large. Max limit is 100MB.");
      return;
    }

    setUploading(prev => ({ ...prev, [id]: true }));
    setUploadProgress(prev => ({ ...prev, [id]: 0 }));

    const storageRef = ref(storage, `${field === 'logo' ? 'branding' : 'candidates'}/${id}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Store task in a ref to allow cancellation
    if (!window.uploadTasks) window.uploadTasks = {};
    window.uploadTasks[id] = uploadTask;

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        console.log(`Upload progress for ${id}: ${progress}%`);
        setUploadProgress(prev => ({ ...prev, [id]: progress }));
      },
      (error) => {
        console.error("Upload error details:", error);
        let msg = "Upload failed: " + error.message;

        if (error.code === 'storage/unauthorized') {
          msg = "❌ Permission Denied: Your Firebase Storage rules are blocking the upload. Please go to Firebase Console -> Storage -> Rules and set them to allow writes for authenticated users.";
        } else if (error.code === 'storage/canceled') {
          msg = "Upload canceled.";
        } else if (error.code === 'storage/unknown') {
          msg = "❌ Unknown Error: This often happens if Firebase Storage is not enabled or if there's a CORS issue. Please check the browser console for details.";
        }

        alert(msg);
        setUploading(prev => ({ ...prev, [id]: false }));
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          console.log(`Upload complete for ${id}: ${url}`);
          setEditingCandidates(prev => {
            const updated = { ...prev };
            if (field === 'logo') {
              updated.logo = url;
            } else {
              const idx = updated[role].findIndex(c => c.id === id);
              if (idx !== -1) {
                updated[role][idx][field] = url;
              }
            }
            return updated;
          });
        } catch (err) {
          console.error("Failed to get download URL", err);
          alert("Failed to get the final link for the uploaded file.");
        } finally {
          setUploading(prev => ({ ...prev, [id]: false }));
          delete window.uploadTasks[id];
        }
      }
    );
  };

  const cancelUpload = (id) => {
    if (window.uploadTasks && window.uploadTasks[id]) {
      window.uploadTasks[id].cancel();
      setUploading(prev => ({ ...prev, [id]: false }));
    }
  };

  const saveCandidates = async () => {
    try {
      await setDoc(doc(db, "settings", "electionData"), { candidates: editingCandidates });
      setCandidates(editingCandidates);
      alert("Candidates updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update candidates");
    }
  };

  const renderBarGraph = (role, title) => {
    const counts = {};
    candidates[role].forEach(c => counts[c.name] = 0);
    results.forEach(vote => {
      if (counts[vote[role]] !== undefined) counts[vote[role]]++;
    });
    const maxVotes = Math.max(...Object.values(counts), 1);

    return (
      <div className="bg-[#0a0a0a] border border-[#222] p-6 rounded-2xl mb-8">
        <h3 className="text-[#D4AF37] font-bold tracking-wider uppercase mb-6">{title}</h3>
        <div className="space-y-4">
          {candidates[role].map(c => {
            const count = counts[c.name];
            const percentage = (count / maxVotes) * 100;
            return (
              <div key={c.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-gray-200">{c.name}</span>
                  <span className="text-[#D4AF37] font-mono">{count} votes</span>
                </div>
                <div className="w-full bg-[#111] rounded-full h-4 overflow-hidden border border-[#333]">
                  <div className="bg-gradient-to-r from-[#A0522D] to-[#D4AF37] h-full rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 bg-[#0a0a0a] p-6 rounded-2xl border border-[#222]">
          <div>
            <h1 className="text-3xl font-black text-[#D4AF37] tracking-tight">Admin Console</h1>
            <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-semibold">Election Management</p>
          </div>
          <div className="flex w-full sm:w-auto gap-4">
            <button onClick={onLogout} className="px-5 py-2.5 bg-red-950/30 text-red-500 border border-red-900/50 rounded-lg hover:bg-red-900/40 hover:text-red-400 transition-all text-sm font-semibold">
              Secure Exit
            </button>
          </div>
        </header>

        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setActiveTab('results')}
            className={`px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${activeTab === 'results' ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'bg-[#111] text-gray-400 border border-[#333] hover:text-white'}`}
          >
            Live Results
          </button>
          <button
            onClick={() => setActiveTab('candidates')}
            className={`px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${activeTab === 'candidates' ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'bg-[#111] text-gray-400 border border-[#333] hover:text-white'}`}
          >
            Manage Candidates
          </button>
        </div>

        {activeTab === 'results' && (
          <>
            <div className="mb-8">
              {renderBarGraph('president', 'Presidential Race')}
            </div>

            <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#111]">
                <h3 className="text-white font-bold tracking-wider">Voter Log ({results.length} total)</h3>
                <button onClick={fetchResults} className="flex justify-center items-center gap-2 px-4 py-2 bg-[#1a1508] border border-[#D4AF37]/30 text-[#D4AF37] rounded-lg hover:bg-[#D4AF37] hover:text-black transition-all text-xs font-bold uppercase">
                  <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Refresh Log
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#050505] border-b border-[#222]">
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Voter</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Vote Selection</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#111]">
                    {results.map((row, i) => (
                      <tr key={i} className="hover:bg-[#111] transition-colors">
                        <td className="p-4 text-xs text-gray-600">{row.timestamp}</td>
                        <td className="p-4 text-sm text-gray-300">
                          <div className="font-bold text-white">{row.voterName}</div>
                          <div className="text-xs text-gray-500">{row.email}</div>
                          {(row.department || row.year) && <div className="text-xs text-gray-500">{row.department} - Year {row.year}</div>}
                        </td>
                        <td className="p-4 text-sm text-[#D4AF37] font-bold">{row.president}</td>
                      </tr>
                    ))}
                    {results.length === 0 && !loading && (
                      <tr><td colSpan="4" className="p-8 text-center text-gray-500">No votes yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'candidates' && (
          <div className="space-y-8">
            {/* Logo Management Section */}
            <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                <div>
                  <h2 className="text-xl font-bold text-[#D4AF37]">Branding & Logo</h2>
                  <p className="text-gray-500 text-xs mt-1">Update the club logo shown in the header</p>
                </div>
                <button onClick={saveCandidates} className="w-full sm:w-auto px-6 py-2.5 bg-[#D4AF37] text-black font-bold uppercase tracking-wider text-sm rounded-lg hover:bg-[#ebd074] shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                  Save All Changes
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-8 bg-[#111] p-6 rounded-2xl border border-[#222] relative overflow-hidden">
                {uploading['club_logo'] && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
                    <div className="text-[#D4AF37] font-black text-lg mb-2">{uploadProgress['club_logo'] || 0}%</div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Processing Logo...</span>
                  </div>
                )}

                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-[#050505] rounded-2xl border-2 border-[#333] p-4 flex items-center justify-center group relative overflow-hidden">
                  <img src={editingCandidates.logo || '/logo.png'} alt="Current Logo" className="max-w-full max-h-full object-contain" />
                  <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <span className="text-[10px] font-bold text-white uppercase bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-3 py-1.5 rounded-md">Upload</span>
                    <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(null, 'club_logo', 'logo', e)} />
                  </label>
                </div>

                <div className="flex-1 w-full space-y-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Direct Logo URL (Base64 or External)</label>
                  <input
                    type="text"
                    value={editingCandidates.logo || ''}
                    onChange={e => setEditingCandidates(prev => ({ ...prev, logo: e.target.value }))}
                    className="w-full bg-[#050505] border border-[#333] text-white rounded-lg p-3 text-sm focus:border-[#D4AF37] outline-none transition-colors"
                    placeholder="https://example.com/logo.png or paste Base64..."
                  />
                  <p className="text-[10px] text-gray-600 italic">Tip: Use the upload button on the image to automatically convert your file to a link.</p>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 sm:p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-[#D4AF37]">Edit Candidates</h2>
              </div>

              {['president'].map(role => (
                <div key={role} className="mb-12 last:mb-0">
                  <h3 className="text-lg text-white font-bold uppercase tracking-wider mb-6 border-b border-[#333] pb-2">{role}s</h3>
                  <div className="grid xl:grid-cols-2 gap-8">
                    {editingCandidates[role].map(c => (
                      <div key={c.id} className="bg-[#111] border border-[#222] p-6 rounded-2xl flex flex-col gap-6 relative overflow-hidden">
                        {uploading[c.id] && (
                          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center">
                            <div className="relative w-20 h-20 mb-4">
                              <svg className="w-full h-full" viewBox="0 0 100 100">
                                <circle className="text-gray-800 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                                <circle className="text-[#D4AF37] stroke-current transition-all duration-300" strokeWidth="8" strokeLinecap="round" cx="50" cy="50" r="40" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * (uploadProgress[c.id] || 0)) / 100}></circle>
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-white">
                                {uploadProgress[c.id] || 0}%
                              </div>
                            </div>
                            <span className="text-xs font-black text-[#D4AF37] uppercase tracking-[0.2em] animate-pulse">Uploading Media...</span>
                            <p className="text-[10px] text-gray-500 mt-2 mb-4">Please do not close this window</p>
                            <button
                              onClick={() => cancelUpload(c.id)}
                              className="px-4 py-2 bg-red-950/30 text-red-500 border border-red-900/50 rounded-lg text-[10px] font-bold uppercase hover:bg-red-900/50 transition-all"
                            >
                              Cancel Upload
                            </button>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-6">
                          <div className="flex flex-col items-center gap-3">
                            <div className="relative group mb-2">
                              <img src={c.image} alt="profile" className="w-24 h-24 rounded-full object-cover border-2 border-[#D4AF37]" />
                              <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(role, c.id, 'image', e)} />
                              </label>
                            </div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase mb-2">Profile Photo</span>
                            <input
                              type="text"
                              placeholder="Image URL..."
                              value={c.image || ''}
                              onChange={e => handleCandidateChange(role, c.id, 'image', e.target.value)}
                              className="w-24 bg-[#050505] border border-[#333] text-white rounded-lg p-1.5 text-[8px] focus:border-[#D4AF37] outline-none text-center"
                            />
                          </div>

                          <div className="flex-1 space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Candidate Name</label>
                              <input type="text" value={c.name} onChange={e => handleCandidateChange(role, c.id, 'name', e.target.value)} className="w-full bg-[#050505] border border-[#333] text-white rounded-lg p-3 text-sm focus:border-[#D4AF37] focus:outline-none transition-colors" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Campaign Speech</label>
                              <textarea value={c.speech} onChange={e => handleCandidateChange(role, c.id, 'speech', e.target.value)} className="w-full bg-[#050505] border border-[#333] text-white rounded-lg p-3 text-sm focus:border-[#D4AF37] focus:outline-none h-24 resize-none transition-colors"></textarea>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-[#222] grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Campaign Poster (Image)</label>
                            <div className="relative aspect-video bg-[#050505] rounded-xl overflow-hidden border border-[#333] group mb-2">
                              {c.poster ? (
                                <img src={c.poster} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs font-medium italic">No Poster</div>
                              )}
                              <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                                <span className="bg-[#D4AF37] text-black px-4 py-2 rounded-lg text-xs font-bold">Upload File</span>
                                <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(role, c.id, 'poster', e)} />
                              </label>
                            </div>
                            <input
                              type="text"
                              placeholder="Or paste Poster URL here..."
                              value={c.poster || ''}
                              onChange={e => handleCandidateChange(role, c.id, 'poster', e.target.value)}
                              className="w-full bg-[#050505] border border-[#333] text-white rounded-lg p-2.5 text-[10px] focus:border-[#D4AF37] outline-none transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Campaign Video</label>
                            <div className="relative aspect-video bg-[#050505] rounded-xl overflow-hidden border border-[#333] group mb-2">
                              {c.video ? (
                                <video src={c.video} className="w-full h-full object-cover" muted />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs font-medium italic">No Video</div>
                              )}
                              <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                                <span className="bg-[#D4AF37] text-black px-4 py-2 rounded-lg text-xs font-bold">Upload File</span>
                                <input type="file" className="hidden" accept="video/*" onChange={e => handleFileUpload(role, c.id, 'video', e)} />
                              </label>
                            </div>
                            <input
                              type="text"
                              placeholder="Or paste Video URL here..."
                              value={c.video || ''}
                              onChange={e => handleCandidateChange(role, c.id, 'video', e.target.value)}
                              className="w-full bg-[#050505] border border-[#333] text-white rounded-lg p-2.5 text-[10px] focus:border-[#D4AF37] outline-none transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN APP ENTRY ---
export default function RACVotingApp() {
  const [view, setView] = useState('login'); // 'login', 'voting', 'success', 'admin'
  const [user, setUser] = useState({ name: '', email: '', contact: '', department: '', year: '', roll: '' });
  const [candidates, setCandidates] = useState(MOCK_CANDIDATES);
  const [loadingApp, setLoadingApp] = useState(true);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const docRef = doc(db, 'settings', 'electionData');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().candidates) {
          setCandidates(docSnap.data().candidates);
        } else {
          // If no candidates in DB, initialize with MOCK_CANDIDATES
          await setDoc(docRef, { candidates: MOCK_CANDIDATES });
        }
      } catch (err) {
        console.error("Failed to load candidates", err);
      }
      setLoadingApp(false);
    };
    fetchCandidates();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setView('voting');
  };

  const handleVote = async (selections) => {
    const payload = {
      voterName: user.name,
      email: user.email,
      contact: user.contact,
      department: user.department,
      year: user.year,
      president: candidates.president.find(c => c.id === selections.president)?.name,
      timestamp: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, "votes"), {
        ...payload,
        createdAt: serverTimestamp()
      });

      fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => console.log("GAS Sync fail", err));

      setView('success');
    } catch (error) {
      console.error("Voting submission failed:", error);
      alert("Failed to save vote to Database.");
    }
  };

  const handleLogout = () => {
    setUser({ name: '', email: '', contact: '', department: '', year: '', roll: '' });
    setView('login');
  };

  if (loadingApp) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-[#222] border-t-[#D4AF37] rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-[#D4AF37] selection:text-black antialiased">
      {view === 'login' && <Login onLogin={handleLogin} onGoToAdmin={() => setView('admin_login')} />}
      {view === 'admin_login' && <AdminLogin onAdminLogin={() => setView('admin')} onBackToVoter={() => setView('login')} />}
      {view === 'voting' && <VotingPage user={user} onVote={handleVote} onLogout={handleLogout} onGoToAdmin={() => setView('admin')} candidates={candidates} />}
      {view === 'success' && <SuccessView onLogout={handleLogout} />}
      {view === 'admin' && <AdminDashboard onLogout={handleLogout} candidates={candidates} setCandidates={setCandidates} />}
    </div>
  );
}
