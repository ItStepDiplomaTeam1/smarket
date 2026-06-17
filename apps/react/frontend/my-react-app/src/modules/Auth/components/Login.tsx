// src/modules/Auth/components/Login.tsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import eyeIcon from '@/shared/assets/ButtonEye.svg';
import { apiClient } from '@/shared/api/apiClient';
// useAuthStore лежить поруч у модулі, тому тут можна залишити відносний шлях:
import { useAuthStore } from '../store/authStore';

// Інтерфейси для типізації відповіді сервера
interface User {
    id: string;
    email: string;
    // Додайте інші поля, якщо вони є у вашій моделі (наприклад, name, role)
}

interface LoginResponse {
    access_token: string;
    user: User;
}

export const LoginForm = () => {
    const navigate = useNavigate();

    // 1. Локальний стан для UI та полів
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // 2. Глобальний стан Zustand
    const setAuth = useAuthStore((state) => state.setAuth);

    // 3. Серверний стан TanStack Query
    const loginMutation = useMutation<LoginResponse, Error>({
        mutationFn: async () => {
            try {
                const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', { email, password });
                return response.data;
            } catch (error) {
                // Дістаємо текст помилки саме з бекенду
                if (axios.isAxiosError(error) && error.response?.data?.message) {
                    throw new Error(error.response.data.message);
                }
                throw new Error('Помилка авторизації. Спробуйте ще раз.');
            }
        },
        onSuccess: (data) => {
            setAuth(data.access_token, data.user);
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
            {loginMutation.isError && (
                <div className="mb-[16px] text-red-500 text-[13px]">
                    {loginMutation.error?.message}
                </div>
            )}

            <button 
                type="submit" 
                disabled={loginMutation.isPending}
                className="w-full h-[46px] bg-[#265447] text-white rounded-[10px] border-none cursor-pointer font-inter text-[14px] font-bold transition-colors duration-200 hover:bg-[#1A3E2F] disabled:opacity-50"
            >
                {loginMutation.isPending ? 'Завантаження...' : 'Увійти'}
            </button>

            <p className="text-center text-[14px] mt-[24px] text-[#6B7280]">
                У вас немає акаунту?{' '}
                <a href="/create" className="text-[#265447] font-semibold no-underline hover:underline">
                    Зареєструватися
                </a>
            </p>
        </form>
    );
};