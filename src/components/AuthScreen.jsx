import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const authModes = {
  login: {
    eyebrow: 'Welcome Back',
    title: 'Sign in to continue your simulator session',
    description:
      'Use your email and password or continue with Google to access the deadlock simulator.',
    action: 'Login',
  },
  signup: {
    eyebrow: 'Create Access',
    title: 'Create an account before you enter the simulator',
    description:
      'Sign up with email and password, then continue into the Firebase-backed simulator workspace.',
    action: 'Create Account',
  },
};

function getFriendlyError(error) {
  switch (error?.code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Try logging in instead.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/weak-password':
      return 'Use a stronger password with at least 6 characters.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'The email or password is incorrect.';
    case 'auth/popup-closed-by-user':
      return 'The Google sign-in popup was closed before finishing.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google popup. Allow popups and try again.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled in Firebase Auth yet.';
    case 'auth/too-many-requests':
      return 'Too many attempts were made. Please wait a moment and try again.';
    default:
      return error?.message || 'Something went wrong during authentication.';
  }
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#EA4335"
        d="M12 10.2v3.94h5.48c-.24 1.27-.97 2.34-2.06 3.06l3.34 2.59c1.94-1.79 3.06-4.42 3.06-7.55 0-.72-.06-1.42-.18-2.09H12Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.78 0 5.11-.92 6.82-2.49l-3.34-2.59c-.93.62-2.11.99-3.48.99-2.67 0-4.93-1.8-5.74-4.22H2.8v2.67A10.29 10.29 0 0 0 12 22Z"
      />
      <path
        fill="#4A90E2"
        d="M6.26 13.69A6.16 6.16 0 0 1 5.94 12c0-.59.11-1.16.32-1.69V7.64H2.8A10.29 10.29 0 0 0 1.71 12c0 1.64.39 3.2 1.09 4.36l3.46-2.67Z"
      />
      <path
        fill="#FBBC05"
        d="M12 6.09c1.51 0 2.87.52 3.94 1.54l2.96-2.96C17.1 2.98 14.78 2 12 2 7.98 2 4.51 4.31 2.8 7.64l3.46 2.67c.81-2.42 3.07-4.22 5.74-4.22Z"
      />
    </svg>
  );
}

export default function AuthScreen() {
  const [mode, setMode] = useState('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const content = authModes[mode];

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        const credentials = await createUserWithEmailAndPassword(auth, email, password);

        if (displayName.trim()) {
          await updateProfile(credentials.user, { displayName: displayName.trim() });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (authError) {
      setError(getFriendlyError(authError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleAuth() {
    setError('');
    setIsSubmitting(true);

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (authError) {
      setError(getFriendlyError(authError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 text-slate-100 md:px-6 xl:px-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_24%),linear-gradient(180deg,#020617_0%,#0f172a_35%,#111827_100%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:42px_42px] [mask-image:radial-gradient(circle_at_center,black_45%,transparent_85%)]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.section
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="glass-panel flex flex-col justify-between rounded-[2rem] border border-white/10 p-8 md:p-10"
        >
          <div>
            <div className="inline-flex rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-xs uppercase tracking-[0.32em] text-cyan-200">
              Firebase Auth
            </div>
            <h1 className="mt-8 max-w-3xl text-4xl font-semibold leading-tight text-slate-50 md:text-6xl">
              Deadlock simulation, now with a personal entry point.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Sign in before entering the simulator so each user has a clean starting session and a
              consistent path for future saved progress.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Access</p>
              <p className="mt-3 text-lg font-semibold text-slate-100">Email or Google</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Continue with your preferred sign-in method without leaving the app shell.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Flow</p>
              <p className="mt-3 text-lg font-semibold text-slate-100">Protected entry</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                The simulator loads only after authentication, keeping the experience focused.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Future-ready</p>
              <p className="mt-3 text-lg font-semibold text-slate-100">Ready for saved data</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                This auth layer gives the project a clear foundation for storing user-specific work.
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
          className="glass-panel rounded-[2rem] border border-white/10 p-6 md:p-8"
        >
          <div className="flex rounded-full border border-white/10 bg-slate-950/70 p-1">
            {Object.keys(authModes).map((authMode) => {
              const active = authMode === mode;

              return (
                <button
                  key={authMode}
                  type="button"
                  onClick={() => {
                    setMode(authMode);
                    setError('');
                  }}
                  className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? 'bg-blue-500 text-white shadow-[0_0_28px_rgba(59,130,246,0.32)]'
                      : 'text-slate-300 hover:text-slate-100'
                  }`}
                >
                  {authMode === 'login' ? 'Login' : 'Signup'}
                </button>
              );
            })}
          </div>

          <div className="mt-8">
            <p className="text-xs uppercase tracking-[0.34em] text-blue-300/80">
              {content.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-50">{content.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">{content.description}</p>
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isSubmitting}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-[1.2rem] border border-white/10 bg-white px-4 py-3 font-semibold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <GoogleMark />
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-slate-500">
            <div className="h-px flex-1 bg-white/10" />
            or use email
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' ? (
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Display Name</span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-[1.2rem] border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-blue-400/60"
                />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="student@example.com"
                autoComplete="email"
                required
                className="w-full rounded-[1.2rem] border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-blue-400/60"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                className="w-full rounded-[1.2rem] border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-blue-400/60"
              />
            </label>

            {mode === 'signup' ? (
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Confirm Password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  required
                  className="w-full rounded-[1.2rem] border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-blue-400/60"
                />
              </label>
            ) : null}

            {error ? (
              <div className="rounded-[1.2rem] border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-[1.2rem] border border-blue-400/50 bg-blue-500 px-4 py-3 font-semibold text-white shadow-[0_0_28px_rgba(59,130,246,0.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Please wait...' : content.action}
            </button>
          </form>
        </motion.section>
      </div>
    </div>
  );
}
