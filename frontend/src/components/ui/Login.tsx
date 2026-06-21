import React, { useState } from 'react';
import { login } from '../../api';
import { toast } from 'sonner';

interface LoginProps {
  onSuccess: () => void;
}

export default function Login({ onSuccess }: LoginProps) {
  const [email, setEmail] = useState('admin@admin.com');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(email, password);
      localStorage.setItem('token', res.access_token);
      toast.success('Login berhasil!');
      onSuccess();
    } catch (err) {
      toast.error('Email atau password salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white dark:bg-zinc-950 overflow-hidden font-sans">
      {/* Left side - Visual/Branding */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-end bg-slate-900 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")' }}
        />
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-900/20" />

        {/* Content */}
        <div className="relative z-10 p-12 lg:p-16 text-white pb-24">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold font-jakarta tracking-tight">HR Anomaly</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold font-jakarta leading-tight mb-5 max-w-lg">
            Sistem Deteksi Cerdas Berbasis Machine Learning
          </h1>
          <p className="text-lg text-slate-300 font-inter max-w-md leading-relaxed">
            Pantau indikator kinerja dan deteksi anomali perilaku karyawan secara otomatis dengan presisi tinggi.
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 xl:p-24 relative overflow-y-auto">
        <div className="w-full max-w-md relative z-10">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold font-jakarta text-slate-900 dark:text-white mb-2">
              Selamat Datang
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-inter">
              Silakan masukkan kredensial untuk mengakses dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold font-inter text-slate-700 dark:text-slate-300">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email Anda"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-inter transition-all outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:bg-zinc-900/50 dark:border-zinc-800 dark:text-white dark:focus:bg-zinc-900 dark:focus:border-brand-500 placeholder:text-slate-400"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold font-inter text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button type="button" className="text-sm font-medium text-brand-600 hover:text-brand-500 font-inter transition-colors">
                  Lupa sandi?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password Anda"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-inter transition-all outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:bg-zinc-900/50 dark:border-zinc-800 dark:text-white dark:focus:bg-zinc-900 dark:focus:border-brand-500 placeholder:text-slate-400"
                required
              />
            </div>

            <div className="flex items-center pt-1 pb-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 transition-colors" />
                <span className="text-sm text-slate-600 font-inter group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-slate-200 transition-colors">Ingat Saya</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-600 px-4 py-4 text-white font-bold font-jakarta shadow-lg shadow-brand-500/30 transition-all hover:bg-brand-500 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? 'Memproses...' : 'Masuk ke Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
