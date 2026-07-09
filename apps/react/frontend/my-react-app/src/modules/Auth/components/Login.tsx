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
            <label className="text-[13px] font-semibold text-[#265447] dark:text-[#A9B6B0] mb-[8px] block transition-colors">Email</label>
            <input
                type="email"
                placeholder="smarket@gmail.com"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loginMutation.isPending}
                className="w-full h-[44px] border border-[rgba(38,84,71,0.16)] dark:border-[rgba(38,84,71,0.2)] rounded-[10px] px-[16px] mb-[8px] bg-white dark:bg-[#1D2A25] font-inter text-[14px] text-[#111827] dark:text-[#EAF7F2] outline-none transition-colors duration-200 focus:border-[#265447] dark:focus:border-[#3DAE8B] placeholder-[#D1D5DB] dark:placeholder-[#6D8279]"
            />

            <label className="text-[13px] font-semibold text-[#265447] dark:text-[#A9B6B0] mb-[8px] block transition-colors">Пароль</label>
            <div className="relative mb-[8px]">
                <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Введіть пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loginMutation.isPending}
                    className="w-full h-[44px] border border-[rgba(38,84,71,0.16)] dark:border-[rgba(38,84,71,0.2)] rounded-[10px] px-[16px] pr-[40px] bg-white dark:bg-[#1D2A25] font-inter text-[14px] text-[#111827] dark:text-[#EAF7F2] outline-none transition-colors duration-200 focus:border-[#265447] dark:focus:border-[#3DAE8B] placeholder-[#D1D5DB] dark:placeholder-[#6D8279]"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-[12px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex items-center"
                >
                    <img src={eyeIcon} alt="toggle" className="w-[18px] h-[18px] opacity-70 hover:opacity-100" />
                </button>
            </div>

            <div className="flex justify-end mb-[24px]">
                <a href="/forgot-password" className="font-inter text-[14px] font-normal leading-[21px] text-[#6D8279] dark:text-[#3DAE8B] no-underline hover:underline transition-colors">
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
                className="flex items-center justify-center gap-[8px] w-full h-[46px] bg-[#265447] dark:bg-[#3DAE8B] text-white dark:text-[#111A17] rounded-[10px] border-none cursor-pointer font-inter text-[14px] font-bold transition-all duration-200 hover:bg-[#1A3E2F] dark:hover:bg-[#2C9E7C] hover:shadow-md disabled:opacity-50"
            >
                {loginMutation.isPending && <Loader2 className="w-[18px] h-[18px] animate-spin text-white dark:text-[#111A17]" />}
                <span>{loginMutation.isPending ? 'Завантаження...' : 'Увійти'}</span>
            </button>

            <p className="text-center text-[14px] mt-[24px] text-[#6B7280] dark:text-[#A9B6B0] transition-colors">
                У вас немає акаунту?{' '}
                <Link to="/register" viewTransition className="text-[#265447] dark:text-[#3DAE8B] font-semibold no-underline hover:underline transition-colors">
                    Зареєструватися
                </Link>
            </p>
        </form>
    );
};