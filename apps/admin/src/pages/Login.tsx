import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { apiClient } from '@/lib/apiClient';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import logo from '@/assets/HeaderIcons/Logo-Smarket.svg';

interface LoginPayload {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { setToken } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data } = await apiClient.post<LoginPayload>('/auth/login', { email, password });

      // Gateway returns access_token in JSON; refresh_token is set as HttpOnly cookie automatically.
      setToken(data.access_token);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number } };
      if (axiosError.response?.status === 401) {
        setError('Невірний email або пароль.');
      } else if (axiosError.response?.status === 429) {
        setError('Забагато спроб. Будь ласка, зачекайте хвилину.');
      } else {
        setError('Сталась помилка. Перевірте підключення та спробуйте ще раз.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={logo} alt="Smarket" className="h-10 w-auto" />
        </div>

        {/* Card */}
        <div className="bg-white border border-border rounded-2xl shadow-sm p-8">
          <div className="mb-7">
            <h1 className="font-manrope text-2xl font-bold text-textMain mb-1">
              Вхід до адмін-панелі
            </h1>
            <p className="text-sm text-textMuted">
              Введіть ваші облікові дані для доступу
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold text-textMain mb-1.5">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-textMuted" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@smarket.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm text-textMain placeholder:text-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold text-textMain mb-1.5">
                Пароль
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-textMuted" />
                </div>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm text-textMain placeholder:text-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Forgot password link */}
            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-textMuted hover:text-primary transition-colors">
                Забули пароль?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary hover:bg-primaryHover text-white rounded-xl font-semibold text-sm transition-all focus:ring-2 focus:ring-primary/30 disabled:opacity-60 flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Увійти'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-textMuted mt-6">
          © {new Date().getFullYear()} Smarket — адміністративна панель
        </p>
      </div>
    </div>
  );
};

export default Login;
