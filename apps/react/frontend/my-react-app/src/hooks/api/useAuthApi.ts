import { useMutation } from '@tanstack/react-query';
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
                    throw new Error(error.response.data.detail);
                }
                throw new Error('Помилка Google авторизації. Спробуйте ще раз.');
            }
        },
        onSuccess: (data) => {
            setAuth(data.access_token, {
                id: data.user.id,
                email: data.user.email,
                role: data.user.role,
            });
            navigate('/');
        },
    });
};
