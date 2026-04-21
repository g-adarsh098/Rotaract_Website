import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, serverTimestamp, query, orderBy, doc, getDoc, setDoc, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz6U7zFm-2Wantw22ld56aS3gzFltJRObLAI5p43_-KyjeLqxJWgTIqOx-ZFOBh2FQ/exec';
const ADMIN_PASSKEY = 'RAC2024'; // Added missing passkey definition

const MOCK_CANDIDATES = {
  president: [
    { id: 'p1', name: 'Alex Carter', speech: 'Empowering our members through leadership, transparency, and relentless community service. Together, we can achieve more.', image: 'https://i.pravatar.cc/150?u=alex', artwork: [] },
    { id: 'p2', name: 'Jordan Lee', speech: 'Focused on innovation, holistic growth, and building lasting professional networks for every single Rotaractor.', image: 'https://i.pravatar.cc/150?u=jordan', artwork: [] }
  ],
  secretary: [
    { id: 's1', name: 'Taylor Swift', speech: 'Ensuring transparent communication and seamless coordination for all our club initiatives and mega-events.', image: 'https://i.pravatar.cc/150?u=taylor', artwork: [] },
    { id: 's2', name: 'Morgan Smith', speech: 'Organized, dedicated, and strictly ready to maintain the operational excellence of our prestigious chapter.', image: 'https://i.pravatar.cc/150?u=morgan', artwork: [] }
  ]
};

// --- COMPONENTS ---

const Login = ({ onLogin, onGoToAdmin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [error, setError] = useState('');

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanContact = contact.trim();

    if (!name.trim() || !cleanEmail || !cleanContact) {
      setError('Please fill in all fields to proceed.');
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
      onLogin({ name: name.trim(), email: cleanEmail, contact: cleanContact, roll: 'N/A' });
    } catch (err) {
      console.error("Verification error:", err);
      setError('⚠️ Connection Error: Unable to verify voter status. Please check your internet.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-[#050505]">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-[#222] rounded-2xl shadow-2xl overflow-hidden relative my-8">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#A0522D] via-[#D4AF37] to-[#A0522D]"></div>
        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-[#D4AF37] mb-2 tracking-wide drop-shadow-[0_0_10px_rgba(212,175,55,0.2)]">RAC PSVPEC</h1>
            <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase letter-spacing-2">Official Election Portal</p>
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Admin Access
            </button>
          </div>
        </div>
      </div>
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

const CandidateCard = ({ candidate, isSelected, onSelect }) => {
  const [mediaIndex, setMediaIndex] = useState(0);
  const mediaList = [
    { type: 'image', url: candidate.image },
    ...(candidate.artwork || [])
  ];

  useEffect(() => {
    if (mediaList.length <= 1) return;
    const interval = setInterval(() => {
      setMediaIndex(prev => (prev + 1) % mediaList.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [mediaList.length]);

  const currentMedia = mediaList[mediaIndex];

  return (
    <div
      onClick={onSelect}
      className={`relative group cursor-pointer rounded-2xl overflow-hidden transition-all duration-500 border-2 ${isSelected
        ? 'border-[#D4AF37] bg-[#1a1508] shadow-[0_0_40px_rgba(212,175,55,0.2)] scale-[1.02]'
        : 'border-[#222] bg-[#0a0a0a] hover:border-[#444] hover:bg-[#111]'
        }`}
    >
      {isSelected && (
        <div className="absolute top-4 right-4 bg-[#D4AF37] text-black w-8 h-8 rounded-full flex items-center justify-center z-20 shadow-[0_0_10px_rgba(212,175,55,0.5)]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
        </div>
      )}

      <div className="relative h-64 overflow-hidden">
        {mediaList.map((media, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out transform ${idx === mediaIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
              }`}
          >
            {media.type === 'video' ? (
              <video
                src={media.url}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={media.url}
                alt={`${candidate.name} artwork ${idx}`}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"></div>
          </div>
        ))}
        
        {/* Profile Circle Overlay */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
          <div className={`w-24 h-24 rounded-full overflow-hidden border-4 p-1 transition-all duration-500 ${isSelected ? 'border-[#D4AF37] rotate-3' : 'border-[#A0522D] group-hover:border-[#b8633b]'}`}>
            <img src={candidate.image} alt={candidate.name} className="w-full h-full object-cover rounded-full bg-[#0a0a0a]" />
          </div>
        </div>

        {/* Media Indicators */}
        {mediaList.length > 1 && (
          <div className="absolute top-4 left-4 flex gap-1.5 z-20">
            {mediaList.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1 rounded-full transition-all duration-300 ${idx === mediaIndex ? 'w-6 bg-[#D4AF37]' : 'w-2 bg-white/30'}`}
              ></div>
            ))}
          </div>
        )}
      </div>

      <div className="p-6 sm:p-8 pt-16 flex flex-col items-center text-center h-full">
        <h3 className={`text-2xl font-bold mb-2 transition-colors ${isSelected ? 'text-[#D4AF37]' : 'text-white group-hover:text-gray-200'}`}>
          {candidate.name}
        </h3>

        <div className={`w-12 h-1 mb-4 transition-all duration-300 ${isSelected ? 'bg-[#D4AF37] w-20' : 'bg-[#A0522D] opacity-60'}`}></div>

        <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-grow italic line-clamp-3">
          "{candidate.speech}"
        </p>

        <button
          className={`w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300 ${isSelected
            ? 'bg-[#D4AF37] text-black shadow-lg'
            : 'bg-transparent border border-[#A0522D] text-[#A0522D] group-hover:bg-[#A0522D] group-hover:text-white'
            }`}
        >
          {isSelected ? 'Selected' : 'Vote ' + candidate.name.split(' ')[0]}
        </button>
      </div>
    </div>
  );
};

const VotingPage = ({ user, onVote, onLogout, onGoToAdmin, candidates }) => {
  const [selections, setSelections] = useState({ president: null, secretary: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelect = (role, candidateId) => {
    setSelections(prev => ({ ...prev, [role]: candidateId }));
  };

  const submitVote = async () => {
    if (!selections.president || !selections.secretary) return;
    setIsSubmitting(true);
    await onVote(selections);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen pb-32">
      <header className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-lg border-b border-[#222]">
        <div className="max-w-6xl mx-auto p-4 sm:px-6 lg:px-8 flex justify-between items-center h-20">
          <div className="flex items-center gap-3 sm:gap-4">
            <img src="/logo.png" alt="RAC PSVPEC Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
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

      <main className="max-w-6xl mx-auto p-4 sm:px-6 lg:px-8 py-12">
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-light text-white tracking-widest uppercase mb-2">
              President <span className="text-[#D4AF37] font-bold">Candidates</span>
            </h2>
            <div className="w-24 h-1 bg-[#222] mx-auto rounded-full"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
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

        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-light text-white tracking-widest uppercase mb-2">
              Secretary <span className="text-[#D4AF37] font-bold">Candidates</span>
            </h2>
            <div className="w-24 h-1 bg-[#222] mx-auto rounded-full"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {candidates.secretary.map(c => (
              <CandidateCard
                key={c.id}
                candidate={c}
                isSelected={selections.secretary === c.id}
                onSelect={() => handleSelect('secretary', c.id)}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-[#333] p-4 sm:p-5 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm font-medium text-center sm:text-left">
            {selections.president && selections.secretary
              ? <span className="text-[#D4AF37] flex items-center gap-2 justify-center sm:justify-start">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                All selections made. Ready to cast your vote.
              </span>
              : <span className="text-gray-400">Please select one candidate per category to proceed.</span>}
          </div>
          <button
            onClick={submitVote}
            disabled={!selections.president || !selections.secretary || isSubmitting}
            className={`w-full sm:w-auto px-10 py-3.5 font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${selections.president && selections.secretary && !isSubmitting
              ? 'bg-[#D4AF37] text-black hover:bg-[#ebd074] shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transform hover:-translate-y-0.5'
              : 'bg-[#222] text-gray-600 cursor-not-allowed border border-[#333]'
              }`}
          >
            {isSubmitting ? 'Casting Vote...' : 'Submit Final Vote'}
          </button>
        </div>
      </div>
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

const AdminDashboard = ({ onLogout, candidates, setCandidates }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('results'); // 'results' | 'candidates'
  const [editingCandidates, setEditingCandidates] = useState(JSON.parse(JSON.stringify(candidates)));
  const [uploading, setUploading] = useState({}); // { [candidateId]: boolean }

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

    setUploading(prev => ({ ...prev, [id]: true }));
    try {
      const storageRef = ref(storage, `candidates/${id}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);

      const updated = { ...editingCandidates };
      const idx = updated[role].findIndex(c => c.id === id);
      if (idx !== -1) {
        if (field === 'artwork') {
          const type = file.type.startsWith('video') ? 'video' : 'image';
          updated[role][idx].artwork = [...(updated[role][idx].artwork || []), { type, url }];
        } else {
          updated[role][idx][field] = url;
        }
        setEditingCandidates(updated);
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(prev => ({ ...prev, [id]: false }));
    }
  };

  const removeArtwork = (role, id, artIdx) => {
    const updated = { ...editingCandidates };
    const idx = updated[role].findIndex(c => c.id === id);
    if (idx !== -1) {
      updated[role][idx].artwork.splice(artIdx, 1);
      setEditingCandidates(updated);
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
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {renderBarGraph('president', 'Presidential Race')}
              {renderBarGraph('secretary', 'Secretary Race')}
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
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">President</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Secretary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#111]">
                    {results.map((row, i) => (
                      <tr key={i} className="hover:bg-[#111] transition-colors">
                        <td className="p-4 text-xs text-gray-600">{row.timestamp}</td>
                        <td className="p-4 text-sm text-gray-300">
                          <div className="font-bold text-white">{row.voterName}</div>
                          <div className="text-xs text-gray-500">{row.email}</div>
                        </td>
                        <td className="p-4 text-sm text-[#D4AF37]">{row.president}</td>
                        <td className="p-4 text-sm text-[#A0522D]">{row.secretary}</td>
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
          <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 sm:p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-[#D4AF37]">Edit Candidates</h2>
              <button onClick={saveCandidates} className="px-6 py-2.5 bg-[#D4AF37] text-black font-bold uppercase tracking-wider text-sm rounded-lg hover:bg-[#ebd074] shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                Save Changes
              </button>
            </div>

            {['president', 'secretary'].map(role => (
              <div key={role} className="mb-12 last:mb-0">
                <h3 className="text-lg text-white font-bold uppercase tracking-wider mb-6 border-b border-[#333] pb-2">{role}s</h3>
                <div className="grid xl:grid-cols-2 gap-8">
                  {editingCandidates[role].map(c => (
                    <div key={c.id} className="bg-[#111] border border-[#222] p-6 rounded-2xl flex flex-col gap-6 relative overflow-hidden">
                      {uploading[c.id] && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                          <div className="animate-spin w-8 h-8 border-2 border-transparent border-t-[#D4AF37] rounded-full mb-2"></div>
                          <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">Uploading Media...</span>
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex flex-col items-center gap-3">
                          <div className="relative group">
                            <img src={c.image} alt="profile" className="w-24 h-24 rounded-full object-cover border-2 border-[#D4AF37]" />
                            <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(role, c.id, 'image', e)} />
                            </label>
                          </div>
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Profile Photo</span>
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

                      <div className="pt-4 border-t border-[#222]">
                        <div className="flex justify-between items-center mb-4">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Candidate Artwork (Images/Videos)</label>
                          <label className="cursor-pointer bg-[#1a1508] border border-[#D4AF37]/30 text-[#D4AF37] px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase hover:bg-[#D4AF37] hover:text-black transition-all">
                            Add Media
                            <input type="file" className="hidden" accept="image/*,video/*" onChange={e => handleFileUpload(role, c.id, 'artwork', e)} />
                          </label>
                        </div>
                        
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                          {c.artwork?.map((art, idx) => (
                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-[#333] group">
                              {art.type === 'video' ? (
                                <video src={art.url} className="w-full h-full object-cover" muted />
                              ) : (
                                <img src={art.url} className="w-full h-full object-cover" />
                              )}
                              <button 
                                onClick={() => removeArtwork(role, c.id, idx)}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                              {art.type === 'video' && (
                                <div className="absolute bottom-1 left-1 bg-black/50 p-0.5 rounded">
                                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                </div>
                              )}
                            </div>
                          ))}
                          {(!c.artwork || c.artwork.length === 0) && (
                            <div className="col-span-full py-4 text-center border-2 border-dashed border-[#222] rounded-xl text-gray-600 text-xs font-medium">
                              No artwork added yet. Upload images or videos to showcase candidate's work.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN APP ENTRY ---
export default function RACVotingApp() {
  const [view, setView] = useState('login'); // 'login', 'voting', 'success', 'admin'
  const [user, setUser] = useState({ name: '', email: '', contact: '', roll: '' });
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
      president: candidates.president.find(c => c.id === selections.president)?.name,
      secretary: candidates.secretary.find(c => c.id === selections.secretary)?.name,
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
    setUser({ name: '', roll: '' });
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
