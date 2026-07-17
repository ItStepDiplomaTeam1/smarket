import btngoogle from '@/shared/assets/google.svg';
import checkIcon from '@/shared/assets/checkgreen.svg';
import logo from '@/shared/assets/logo.svg';
import basketImage from '@/shared/assets/logindefault.svg';

import { LoginForm, TelegramLoginButton } from '@/modules/Auth';
import { useGoogleLogin } from '@react-oauth/google';
import { useGoogleOAuth } from '@/hooks/api/useAuthApi';

export default function AuthPage() {
    const googleOAuthMutation = useGoogleOAuth();

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: (tokenResponse: { access_token: string }) => {
            googleOAuthMutation.mutate(tokenResponse.access_token);
        },
        flow: 'implicit',
    });
    return (
        <section className="flex flex-col w-full min-h-screen bg-[#F6FAF8] dark:bg-[#0B110F] font-inter transition-colors duration-300">
            <div className="flex flex-1 justify-center items-center py-[24px] px-[16px] sm:py-[40px] sm:px-[40px]">

            {/* MAIN CARD */}
            <div className="flex w-full max-w-[1040px] h-auto md:h-[858.5px] bg-white dark:bg-[#111A17] rounded-[24px] border border-[rgba(38,84,71,0.08)] shadow-[0px_18px_48px_rgba(23,59,51,0.12)] overflow-hidden transition-colors duration-300">
                
                {/* ЛІВА ПАНЕЛЬ */}
                <div className="w-[467px] shrink-0 bg-gradient-to-b from-[#EAF7F2] to-[#F6FAF8] dark:from-[rgba(74,222,128,0.31)] dark:to-[rgba(17,26,23,0.47)] border-r border-[rgba(38,84,71,0.08)] p-[48px] text-[#173B33] dark:text-white hidden md:flex flex-col transition-colors duration-300">
                    <img src={logo} alt="Smarket Logo" className="w-[128px] mb-[32px] dark:brightness-0 dark:invert transition-all" />

                    <h2 className="font-manrope text-[32px] font-bold leading-[40px] mb-[16px]">
                        Купуйте розумніше. <br /> Заощаджуйте <br /> більше.
                    </h2>
                    <p className="text-[14px] leading-[21px] text-[#6D8279] dark:text-[#A9B6B0] mb-[24px] transition-colors">
                        Створіть акаунт, щоб зберігати кошики, <br /> порівнювати ціни між магазинами та бачити, де <br /> вся покупка буде дешевшою.
                    </p>

                    <ul className="list-none m-0 p-0 mb-[40px]">
                        <li className="flex items-center gap-[12px] mb-[12px] text-[14px] font-medium text-[#173B33] dark:text-[#EAF7F2] transition-colors">
                            <img src={checkIcon} alt="check" className="w-[20px] h-[20px] shrink-0" />
                            <span>Зберігайте списки покупок</span>
                        </li>
                        <li className="flex items-center gap-[12px] mb-[12px] text-[14px] font-medium text-[#173B33] dark:text-[#EAF7F2] transition-colors">
                            <img src={checkIcon} alt="check" className="w-[20px] h-[20px] shrink-0" />
                            <span>Порівнюйте ціни між магазинами</span>
                        </li>
                        <li className="flex items-center gap-[12px] text-[14px] font-medium text-[#173B33] dark:text-[#EAF7F2] transition-colors">
                            <img src={checkIcon} alt="check" className="w-[20px] h-[20px] shrink-0" />
                            <span>Відстежуйте свою економію</span>
                        </li>
                    </ul>

                    {/* WEEKLY BASKET DUMMY CARD */}
                    <div className="w-full bg-[#EAF7F2]/60 dark:bg-[rgba(38,84,71,0.3)] border border-[#265447]/10 dark:border-[rgba(38,84,71,0.16)] rounded-[16px] p-[16px] mt-auto font-inter text-left transition-colors duration-300">
                        <p className="text-[11px] font-bold text-[#6D8279] dark:text-[#A9B6B0] mb-[4px] uppercase tracking-wider transition-colors">Ваш тижневий кошик</p>
                        <p className="text-[14px] font-bold text-[#173B33] dark:text-white mb-[8px] transition-colors">Молоко, Кава, Олія</p>
                        <div className="inline-block bg-[#FFC72C] text-[#111A17] text-[11px] font-bold px-[8px] py-[3px] rounded-[4px] mb-[16px]">
                            Економія 426 грн
                        </div>
                        <div className="flex justify-between items-center text-[#173B33] dark:text-white text-[13px] font-bold transition-colors">
                            <span>АТБ</span>
                            <span>1 842 грн</span>
                        </div>
                    </div>
                </div>

                {/* ПРАВА ПАНЕЛЬ */}
                <div className="flex-1 flex justify-center items-center py-[32px] px-[24px] sm:py-[40px]">
                    <div className="w-full max-w-[380px] m-0 flex flex-col">
                        <img src={logo} alt="Smarket Logo" className="w-[128px] mb-[24px] md:hidden dark:brightness-0 dark:invert transition-all" />
                        <h1 className="font-manrope text-[30px] font-extrabold leading-[45px] text-[#265447] dark:text-white mb-[8px] text-left transition-colors">
                            Увійти в акаунт
                        </h1>
                        <p className="text-[14px] leading-[21px] text-[#6D8279] dark:text-[#A9B6B0] mb-[24px] text-left transition-colors">
                            Почніть порівнювати ціни та збирати вигідні кошики вже сьогодні.
                        </p>

                        {/* Social buttons */}
                        {googleOAuthMutation.isError && (
                            <p className="text-red-500 text-[12px] mb-[8px] text-center">
                                {googleOAuthMutation.error?.message}
                            </p>
                        )}

                        <button
                            id="btn-google-login"
                            type="button"
                            onClick={() => handleGoogleLogin()}
                            disabled={googleOAuthMutation.isPending}
                            className="flex items-center justify-center gap-[8px] w-full h-[44px] bg-white dark:bg-[#1B2A24] border border-[rgba(38,84,71,0.16)] dark:border-[rgba(38,84,71,0.2)] rounded-[10px] mb-[12px] cursor-pointer font-inter text-[13px] font-semibold text-[#265447] dark:text-white transition-all duration-200 hover:bg-[#F9FAFB] dark:hover:bg-[#203730] disabled:opacity-50"
                        >
                            <img src={btngoogle} alt="Google" className="w-[20px] h-[20px]" />
                            <span>{googleOAuthMutation.isPending ? 'Завантаження...' : 'Продовжити з Google'}</span>
                        </button>
                        <TelegramLoginButton 
                            botId={import.meta.env.VITE_TELEGRAM_BOT_ID || '8912413936'}
                        />

                        {/* OR divider */}
                        <div className="flex items-center text-[#6D8279] dark:text-[#A9B6B0] text-[13px] mt-[24px] mb-[24px] gap-[10px] transition-colors">
                            <span className="flex-1 h-px bg-[rgba(38,84,71,0.08)] dark:bg-[rgba(38,84,71,0.2)] transition-colors"></span>
                            <span className="shrink-0">або увійти через email</span>
                            <span className="flex-1 h-px bg-[rgba(38,84,71,0.08)] dark:bg-[rgba(38,84,71,0.2)] transition-colors"></span>
                        </div>

                        {/* ВСТАВЛЯЄМО НАШ РОЗУМНИЙ КОМПОНЕНТ ФОРМИ */}
                        <LoginForm />
                        
                    </div>
                </div>
            </div>
        </div>
        </section>
    );
}