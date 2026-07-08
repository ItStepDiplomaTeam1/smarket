import { useEffect, useRef } from 'react';

export interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
}

interface TelegramLoginButtonProps {
    botName: string;
    onAuth: (user: TelegramUser) => void;
    disabled?: boolean;
}

export const TelegramLoginButton = ({ botName, onAuth, disabled }: TelegramLoginButtonProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || disabled) return;

        // Set dynamic global callback name to prevent collisions
        const callbackName = `onTelegramAuth_${Math.random().toString(36).substring(2, 11)}`;
        (window as any)[callbackName] = (user: TelegramUser) => {
            onAuth(user);
        };

        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.async = true;
        script.setAttribute('data-telegram-login', botName);
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-radius', '10');
        script.setAttribute('data-onauth', `${callbackName}(user)`);
        script.setAttribute('data-request-access', 'write');

        containerRef.current.appendChild(script);

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
            delete (window as any)[callbackName];
        };
    }, [botName, onAuth, disabled]);

    return (
        <div 
            ref={containerRef} 
            className="flex justify-center w-full min-h-[40px] mb-[12px]" 
        />
    );
};
