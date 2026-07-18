import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { apiClient } from '@/shared/api/apiClient';
import { useAuthStore } from '@/modules/Auth/store/authStore';

interface OAuthUser {
    id: string;
    email: string;
    role: string;
    settings?: Record<string, any>;
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
    photo_url?: string;
    settings?: Record<string, any>;
}

export const useFetchMe = () => {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    const query = useQuery<MeResponse>({
        queryKey: ['me'],
        queryFn: async () => {
            const { data } = await apiClient.get<MeResponse>('/api/v1/auth/me');
            return data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        if (query.data && isAuthenticated) {
            useAuthStore.setState((state) => {
                if (!state.user) return state;
                return {
                    user: {
                        ...state.user,
                        name: query.data.username || state.user.name,
                        photoUrl: query.data.photo_url || state.user.photoUrl,
                    }
                };
            });
        }
    }, [query.data, isAuthenticated]);

    return query;
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
                photoUrl: data.user.settings?.photo_url,
            });
            try {
                const { data: me } = await apiClient.get<MeResponse>('/api/v1/auth/me');
                const savedName = localStorage.getItem(`smarket_user_name_${me.email}`);
                useAuthStore.setState((state) => ({
                    user: state.user ? { ...state.user, name: savedName || me.username, photoUrl: me.photo_url || state.user.photoUrl } : state.user,
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
                photoUrl: data.user.settings?.photo_url,
            });
            try {
                const { data: me } = await apiClient.get<MeResponse>('/api/v1/auth/me');
                useAuthStore.setState((state) => ({
                    user: state.user ? { ...state.user, name: me.username, photoUrl: me.photo_url || state.user.photoUrl } : state.user,
                }));
            } catch {
                // fallback
            }
            navigate('/');
        },
    });
};

export interface RegisterPendingResponse {
    message: string;
    email: string;
}

export interface RegisterVerifyRequest {
    email: string;
    code: string;
}

export const useRegisterVerify = () => {
    const setAuth = useAuthStore((state) => state.setAuth);
    const navigate = useNavigate();

    return useMutation<OAuthResponse, Error, RegisterVerifyRequest>({
        mutationFn: async ({ email, code }) => {
            try {
                const response = await apiClient.post<OAuthResponse>('/api/v1/auth/register/verify', {
                    email,
                    code,
                });
                return response.data;
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.data?.detail) {
                    throw new Error(error.response.data.detail, { cause: error });
                }
                throw new Error('Помилка верифікації коду. Спробуйте ще раз.', { cause: error });
            }
        },
        onSuccess: async (data) => {
            setAuth(data.access_token, {
                id: data.user.id,
                email: data.user.email,
                role: data.user.role,
                photoUrl: data.user.settings?.photo_url,
            });
            try {
                const { data: me } = await apiClient.get<MeResponse>('/api/v1/auth/me');
                useAuthStore.setState((state) => ({
                    user: state.user ? { ...state.user, name: me.username, photoUrl: me.photo_url || state.user.photoUrl } : state.user,
                }));
            } catch {
                // fallback
            }
            navigate('/');
        },
    });
};


export interface ForgotPasswordRequest {
    email: string;
}

export interface ForgotPasswordResponse {
    message: string;
}

export const useForgotPassword = () => {
    return useMutation<ForgotPasswordResponse, Error, ForgotPasswordRequest>({
        mutationFn: async ({ email }) => {
            try {
                const response = await apiClient.post<ForgotPasswordResponse>('/api/v1/auth/forgot-password', { email });
                return response.data;
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.data?.detail) {
                    throw new Error(error.response.data.detail, { cause: error });
                }
                throw new Error('Помилка відправки запиту. Спробуйте ще раз.', { cause: error });
            }
        },
    });
};

export interface ResetPasswordRequest {
    email: string;
    token: string;
    new_password: string;
}

export interface ResetPasswordResponse {
    message: string;
}

export const useResetPassword = () => {
    const navigate = useNavigate();

    return useMutation<ResetPasswordResponse, Error, ResetPasswordRequest>({
        mutationFn: async ({ email, token, new_password }) => {
            try {
                const response = await apiClient.post<ResetPasswordResponse>('/api/v1/auth/reset-password', {
                    email,
                    token,
                    new_password,
                });
                return response.data;
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.data?.detail) {
                    throw new Error(error.response.data.detail, { cause: error });
                }
                throw new Error('Помилка оновлення пароля. Спробуйте ще раз.', { cause: error });
            }
        },
        onSuccess: () => {
            toast.success('Пароль успішно оновлено. Тепер ви можете увійти.');
            navigate('/auth');
        },
    });
};

export interface ChangePasswordRequest {
    old_password: string;
    new_password: string;
}

export interface ChangePasswordResponse {
    message: string;
}

export const useChangePassword = () => {
    return useMutation<ChangePasswordResponse, Error, ChangePasswordRequest>({
        mutationFn: async ({ old_password, new_password }) => {
            try {
                const response = await apiClient.patch<ChangePasswordResponse>('/api/v1/auth/password', {
                    old_password,
                    new_password,
                });
                return response.data;
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.data?.detail) {
                    throw new Error(error.response.data.detail, { cause: error });
                }
                throw new Error('Не вдалося змінити пароль. Спробуйте ще раз.', { cause: error });
            }
        },
    });
};

export interface ChangeEmailRequest {
    new_email: string;
    current_password: string;
}

export interface ChangeEmailResponse {
    message: string;
}

export const useChangeEmail = () => {
    return useMutation<ChangeEmailResponse, Error, ChangeEmailRequest>({
        mutationFn: async ({ new_email, current_password }) => {
            try {
                const response = await apiClient.patch<ChangeEmailResponse>('/api/v1/auth/email', {
                    new_email,
                    current_password,
                });
                return response.data;
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.data?.detail) {
                    throw new Error(error.response.data.detail, { cause: error });
                }
                throw new Error('Не вдалося змінити email. Спробуйте ще раз.', { cause: error });
            }
        },
    });
};


