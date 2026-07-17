import { useEffect, useState } from 'react';
import { useTelegramOAuth } from '@/hooks/api/useAuthApi';
import type { TelegramUser } from '@/modules/Auth';

function getTelegramParams(): Record<string, string> {
    const params: Record<string, string> = {};

    const searchParams = new URLSearchParams(window.location.search);
    for (const [key, value] of searchParams) {
        params[key] = value;
    }

    const hash = window.location.hash.replace(/^#/, '');
    const hashParams = new URLSearchParams(hash);
    for (const [key, value] of hashParams) {
        if (!(key in params)) {
            params[key] = value;
        }
    }

    const tgAuthResult = params['tgAuthResult'];
    if (tgAuthResult) {
        try {
            let base64 = tgAuthResult.replace(/-/g, '+').replace(/_/g, '/');
            while (base64.length % 4) {
                base64 += '=';
            }
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const decodedJson = new TextDecoder().decode(bytes);
            const decodedData = JSON.parse(decodedJson);
            for (const [key, value] of Object.entries(decodedData)) {
                params[key] = String(value);
            }
        } catch (e) {
            console.error('Failed to parse tgAuthResult:', e);
        }
    }

    return params;
}

export default function TelegramCallbackPage() {
    const [error, setError] = useState<string | null>(null);
    const telegramOAuthMutation = useTelegramOAuth();

    useEffect(() => {
        const params = getTelegramParams();
        const id = params['id'];
        const hash = params['hash'];
        const authDate = params['auth_date'];

        if (!id || !hash || !authDate) {
            setError('Помилка авторизації через Telegram. Не отримано дані від Telegram. Спробуйте ще раз.');
            return;
        }

        const userData: TelegramUser = {
            id: Number(id),
            first_name: params['first_name'] || '',
            last_name: params['last_name'] || undefined,
            username: params['username'] || undefined,
            photo_url: params['photo_url'] || undefined,
            auth_date: Number(authDate),
            hash,
        };

        telegramOAuthMutation.mutate(userData);
    }, []);

    useEffect(() => {
        if (telegramOAuthMutation.isError) {
            setError(telegramOAuthMutation.error?.message || 'Помилка авторизації через Telegram. Спробуйте ще раз.');
        }
    }, [telegramOAuthMutation.isError, telegramOAuthMutation.error]);

    useEffect(() => {
        if (!error) return;
        const timeout = setTimeout(() => {
            window.location.replace('/auth');
        }, 3000);
        return () => clearTimeout(timeout);
    }, [error]);

    if (telegramOAuthMutation.isPending) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <p className="text-[#6D8279] text-[14px]">Авторизація через Telegram...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="text-center max-w-[400px] p-[32px]">
                    <p className="text-[#D32F2F] text-[15px] font-semibold mb-[8px]">Помилка входу</p>
                    <p className="text-[#6D8279] text-[13px]">{error}</p>
                    <p className="text-[#6D8279] text-[12px] mt-[16px]">Перенаправлення на сторінку входу...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <p className="text-[#6D8279] text-[14px]">Авторизація через Telegram...</p>
        </div>
    );
}
