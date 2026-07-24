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
    botId: string;
}

export const TelegramLoginButton = ({ botId }: TelegramLoginButtonProps) => {
    const origin = window.location.origin;
    const returnTo = `${origin}/auth/telegram/callback`;
    const telegramUrl = `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${encodeURIComponent(origin)}&request_access=write&return_to=${encodeURIComponent(returnTo)}`;

    return (
        <a
            href={telegramUrl}
            className="flex items-center justify-center gap-[8px] w-full h-[44px] bg-white dark:bg-[#1B2A24] border border-[rgba(38,84,71,0.16)] dark:border-[rgba(38,84,71,0.2)] rounded-[10px] mb-[12px] cursor-pointer font-inter text-[13px] font-semibold text-[#265447] dark:text-white transition-all duration-200 hover:bg-[#F9FAFB] dark:hover:bg-[#203730] hover:shadow-sm no-underline"
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.39-1.13 7.13-.14.74-.41.99-.68 1.02-.57.05-1-.38-1.55-.74l-2.18-1.46c-.97-.64-.34-.99.21-1.56l.05-.05c2.46-2.25 2.51-2.48 2.44-2.54-.07-.06-.17-.04-.24-.02-.1.02-1.65 1.05-4.66 3.08-.44.3-.84.45-1.19.44-.39-.01-1.14-.22-1.7-.4-.68-.22-1.22-.34-1.17-.72.02-.2.3-.4.84-.62 3.34-1.45 5.57-2.41 6.69-2.88 3.2-1.33 3.86-1.56 4.3-1.55.09 0 .3.02.44.14.12.1.15.25.17.36.01.08.02.28 0 .44z" fill="#24A1DE"/>
            </svg>
            <span>Продовжити з Telegram</span>
        </a>
    );
};

