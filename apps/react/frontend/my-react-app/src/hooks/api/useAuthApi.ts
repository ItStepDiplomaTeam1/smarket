import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiClient } from '@/shared/api/apiClient';
import { useAuthStore } from '@/modules/Auth/store/authStore';

interface OAuthUser {
    id: string;
    email: string;
    role: string;
}

interface OAuthResponse {
    access_token: string;
    token_type: string;
    user: OAuthUser;
}

export interface MeResponse {
    id: string;
    email: string;
    username: string;
    role: string;
}

export const useFetchMe = () => {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    return useQuery<MeResponse>({
        queryKey: ['me'],
        queryFn: async () => {
            const { data } = await apiClient.get<MeResponse>('/api/v1/auth/me');
            return data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
};

export const useGoogleOAuth = () => {
    const setAuth = useAuthStore((state) => state.setAuth);
    const navigate = useNavigate();

    return useMutation<OAuthResponse, Error, string>({
        mutationFn: async (credential: string) => {
            try {
                const response = await apiClient.post<OAuthResponse>('/api/v1/auth/oauth/google', {
                    access_token: credential,
                });
                return response.data;
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.data?.detail) {
                    throw new Error(error.response.data.detail, { cause: error });
                }
                throw new Error('Помилка Google авторизації. Спробуйте ще раз.', { cause: error });
            }
        },
        onSuccess: async (data) => {
            setAuth(data.access_token, {
                id: data.user.id,
                email: data.user.email,
                role: data.user.role,
            });
            try {
                const { data: me } = await apiClient.get<MeResponse>('/api/v1/auth/me');
                useAuthStore.setState((state) => ({
                    user: state.user ? { ...state.user, name: me.username } : state.user,
                }));
            } catch {
                // fallback
            }
            navigate('/');
        },
    });
};

import { type TelegramUser } from '@/modules/Auth/components/TelegramLoginButton';

export const useTelegramOAuth = () => {
    const setAuth = useAuthStore((state) => state.setAuth);
    const navigate = useNavigate();

    return useMutation<OAuthResponse, Error, TelegramUser>({
        mutationFn: async (telegramData: TelegramUser) => {
            try {
                const response = await apiClient.post<OAuthResponse>('/api/v1/auth/telegram', telegramData);
                return response.data;
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.data?.detail) {
                    throw new Error(error.response.data.detail, { cause: error });
                }
                throw new Error('Помилка Telegram авторизації. Спробуйте ще раз.', { cause: error });
            }
        },
        onSuccess: async (data) => {
            setAuth(data.access_token, {
                id: data.user.id,
                email: data.user.email,
                role: data.user.role,
            });
            try {
                const { data: me } = await apiClient.get<MeResponse>('/api/v1/auth/me');
                useAuthStore.setState((state) => ({
                    user: state.user ? { ...state.user, name: me.username } : state.user,
                }));
            } catch {
                // fallback
            }
            navigate('/');
        },
    });
};

