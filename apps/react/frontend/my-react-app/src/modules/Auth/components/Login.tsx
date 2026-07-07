// src/modules/Auth/components/Login.tsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import eyeIcon from '@/shared/assets/ButtonEye.svg';
import { apiClient } from '@/shared/api/apiClient';
import { useAuthStore } from '../store/authStore';
import { type MeResponse } from '@/hooks/api/useAuthApi';

interface LoginResponse {
    access_token: string;
    user: { id: string; email: string; role?: string };
}

export const LoginForm = () => {
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const setAuth = useAuthStore((state) => state.setAuth);

    const loginMutation = useMutation<LoginResponse, Error>({
        mutationFn: async () => {
            try {
                const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', { email, password });
                return response.data;
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.data?.message) {
                    throw new Error(error.response.data.message, { cause: error });
                }
                throw new Error('Помилка авторизації. Спробуйте ще раз.', { cause: error });
            }
        },
        onSuccess: async (data) => {
            setAuth(data.access_token, data.user);
            try {
                const { data: me } = await apiClient.get<MeResponse>('/api/v1/auth/me');
                useAuthStore.setState((state) => ({
                    user: state.user ? { ...state.user, name: me.username } : state.user,
                }));
            } catch {
                // якщо /me не відповів — ім'я залишиться undefined, дефолтний fallback спрацює на бекенді
            }
            toast.success(`З поверненням! Ви успішно увійшли.`);
            navigate('/');
        },
    });

    // 4. Обробник відправки
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        loginMutation.mutate();
    };

    return (
        <form className="flex flex-col" onSubmit={handleSubmit}>
            <label className="text-[13px] font-semibold text-[#265447] mb-[8px] block">Email</label>
            <input
                type="email"
                placeholder="smarket@gmail.com"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loginMutation.isPending}
                className="w-full h-[44px] border border-[rgba(38,84,71,0.16)] rounded-[10px] px-[16px] mb-[8px] bg-white font-inter text-[14px] text-[#111827] outline-none transition-colors duration-200 focus:border-[#265447]"
            />

            <label className="text-[13px] font-semibold text-[#265447] mb-[8px] block">Пароль</label>
            <div className="relative mb-[8px]">
                <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Введіть пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loginMutation.isPending}
                    className="w-full h-[44px] border border-[rgba(38,84,71,0.16)] rounded-[10px] px-[16px] pr-[40px] bg-white font-inter text-[14px] text-[#111827] outline-none transition-colors duration-200 focus:border-[#265447]"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-[12px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex items-center"
                >
                    <img src={eyeIcon} alt="toggle" className="w-[18px] h-[18px]" />
                </button>
            </div>

            <div className="flex justify-end mb-[24px]">
                <a href="/forgot-password" className="font-inter text-[14px] font-normal leading-[21px] text-[#6D8279] no-underline hover:underline">
                    Забули пароль?
                </a>
            </div>

            {/* Виведення помилки від сервера */}
            <div className={`overflow-hidden transition-all duration-300 ${loginMutation.isError ? 'max-h-[40px] opacity-100 mb-[16px]' : 'max-h-0 opacity-0'}`}>
                <p className="text-red-500 text-[13px] font-medium">{loginMutation.error?.message}</p>
            </div>

            <button 
                type="submit" 
                disabled={loginMutation.isPending}
                className="flex items-center justify-center gap-[8px] w-full h-[46px] bg-[#265447] text-white rounded-[10px] border-none cursor-pointer font-inter text-[14px] font-bold transition-all duration-200 hover:bg-[#1A3E2F] hover:shadow-md disabled:opacity-50"
            >
                {loginMutation.isPending && <Loader2 className="w-[18px] h-[18px] animate-spin" />}
                <span>{loginMutation.isPending ? 'Завантаження...' : 'Увійти'}</span>
            </button>

            <p className="text-center text-[14px] mt-[24px] text-[#6B7280]">
                У вас немає акаунту?{' '}
                <Link to="/register" viewTransition className="text-[#265447] font-semibold no-underline hover:underline">
                    Зареєструватися
                </Link>
            </p>
        </form>
    );
};