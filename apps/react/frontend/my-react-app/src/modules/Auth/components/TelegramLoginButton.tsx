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
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.64 8.8C16.49 10.38 15.84 14.19 15.51 15.93C15.37 16.67 15.1 16.92 14.83 16.95C14.26 17 13.83 16.57 13.28 16.21C12.42 15.65 11.94 15.3 11.1 14.75C10.13 14.11 10.76 13.76 11.31 13.19C11.46 13.04 13.92 10.79 13.97 10.58C13.98 10.55 13.98 10.43 13.91 10.37C13.84 10.31 13.74 10.33 13.67 10.35C13.57 10.37 12.02 11.4 9.01 13.43C8.57 13.73 8.17 13.88 7.82 13.87C7.43 13.86 6.68 13.65 6.12 13.47C5.44 13.25 4.9 13.13 4.95 12.75C4.97 12.55 5.25 12.35 5.79 12.13C9.13 10.68 11.36 9.72 12.48 9.25C15.68 7.92 16.34 7.69 16.78 7.7C16.87 7.7 17.08 7.72 17.22 7.84C17.34 7.94 17.37 8.09 17.39 8.2C17.4 8.28 17.41 8.48 17.39 8.64C17.37 8.82 16.64 8.8Z" fill="#24A1DE"/>
            </svg>
            <span>Продовжити з Telegram</span>
        </a>
    );
};

