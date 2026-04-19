import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? 'Erreur');
      }
      navigate('/backoffice');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F7F9] p-5">
      <div
        className="bg-white border border-[#EAEDEF] rounded-2xl p-12 w-full max-w-sm
                   shadow-[0_4px_24px_rgba(32,44,52,0.08)] animate-fade-up"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-full border-[1.5px] border-[#40A2C0] flex items-center justify-center
                       font-[Cormorant_Garamond,serif] text-base text-[#40A2C0] font-medium"
          >
            B
          </div>
          <span className="text-xs font-medium tracking-[3px] uppercase">BRENSO</span>
        </div>

        <h2 className="font-[Cormorant_Garamond,serif] text-2xl font-normal text-[#202C34] mb-8">
          Espace coach
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-semibold tracking-[2px] uppercase text-[#202C34]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="votre@email.com"
              required
              className="w-full bg-white border border-[#EAEDEF] rounded-xl px-3.5 py-2.5
                         text-[13px] text-[#202C34] outline-none transition-all placeholder:text-[#BFC5CC]
                         focus:border-[#40A2C0] focus:shadow-[0_0_0_3px_rgba(64,162,192,0.08)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-semibold tracking-[2px] uppercase text-[#202C34]">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Votre mot de passe"
              required
              className="w-full bg-white border border-[#EAEDEF] rounded-xl px-3.5 py-2.5
                         text-[13px] text-[#202C34] outline-none transition-all placeholder:text-[#BFC5CC]
                         focus:border-[#40A2C0] focus:shadow-[0_0_0_3px_rgba(64,162,192,0.08)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-[#202C34] text-white rounded-full py-3.5 text-xs font-bold
                       tracking-widest uppercase transition-all hover:bg-[#40A2C0] hover:-translate-y-px
                       disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px]"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>

          {error && (
            <p className="text-[12px] text-[#EA226C] text-center mt-1">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}
