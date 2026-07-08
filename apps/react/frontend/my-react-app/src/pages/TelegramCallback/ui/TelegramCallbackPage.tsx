import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTelegramOAuth } from '@/hooks/api/useAuthApi';
import type { TelegramUser } from '@/modules/Auth';

export default function TelegramCallbackPage() {
    const [searchParams] = useSearchParams();
    const telegramOAuthMutation = useTelegramOAuth();

    useEffect(() => {
        const id = searchParams.get('id');
        const hash = searchParams.get('hash');
        const authDate = searchParams.get('auth_date');

        if (!id || !hash || !authDate) {
            window.location.replace('/auth');
            return;
        }

        const userData: TelegramUser = {
            id: Number(id),
            first_name: searchParams.get('first_name') || '',
            last_name: searchParams.get('last_name') || undefined,
            username: searchParams.get('username') || undefined,
            photo_url: searchParams.get('photo_url') || undefined,
            auth_date: Number(authDate),
            hash,
        };

        telegramOAuthMutation.mutate(userData);
    }, []);

    return null;
}
