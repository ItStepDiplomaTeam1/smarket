import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import eyeIcon from '@/shared/assets/ButtonEye.svg';
import btngoogle from '@/shared/assets/google.svg';
import { useGoogleOAuth } from '@/hooks/api/useAuthApi';
import { TelegramLoginButton } from './TelegramLoginButton';

export function Popup() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const googleOAuthMutation = useGoogleOAuth();

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: (tokenResponse: { access_token: string }) => {
            googleOAuthMutation.mutate(tokenResponse.access_token);
        },
        flow: 'implicit',
    });

    return (
        /* Overlay */
        <div className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-[8px] flex items-center justify-center font-inter transition-colors duration-300">
            {/* Modal card */}
            <div className="relative w-[571px] max-h-[90vh] overflow-y-auto bg-white dark:bg-[#111A17] border border-[rgba(38,84,71,0.08)] rounded-[24px] p-[40px] shadow-[0px_18px_48px_rgba(23,59,51,0.12)] transition-colors duration-300">
                <div className="w-[380px] mx-auto">
                    <h1 className="font-manrope text-[30px] font-extrabold leading-[45px] text-[#265447] dark:text-white mb-[8px] text-left transition-colors">
                        Створіть акаунт
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
                        id="btn-google-popup"
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
                    <div className="flex items-center text-[#6D8279] dark:text-[#A9B6B0] text-[13px] my-[24px] gap-[10px] transition-colors">
                        <span className="flex-1 h-px bg-[rgba(38,84,71,0.08)] dark:bg-[rgba(38,84,71,0.2)] transition-colors"></span>
                        <span className="shrink-0">або зареєструйтесь через email</span>
                        <span className="flex-1 h-px bg-[rgba(38,84,71,0.08)] dark:bg-[rgba(38,84,71,0.2)] transition-colors"></span>
                    </div>

                    <form className="flex flex-col">
                        <label htmlFor="popup-name" className="text-[13px] font-semibold text-[#265447] dark:text-[#A9B6B0] mb-[8px] block transition-colors">Ім'я</label>
                        <input
                            id="popup-name"
                            type="text"
                            placeholder="Олена"
                            className="w-full h-[44px] border border-[rgba(38,84,71,0.16)] dark:border-[rgba(38,84,71,0.2)] rounded-[10px] px-[16px] mb-[16px] bg-white dark:bg-[#1D2A25] font-inter text-[14px] text-[#111827] dark:text-[#EAF7F2] placeholder-[#D1D5DB] dark:placeholder-[#6D8279] outline-none transition-colors duration-200 focus:border-[#265447] dark:focus:border-[#3DAE8B]"
                        />

                        <label htmlFor="popup-email" className="text-[13px] font-semibold text-[#265447] dark:text-[#A9B6B0] mb-[8px] block transition-colors">Email</label>
                        <input
                            id="popup-email"
                            type="email"
                            placeholder="smarket@gmail.com"
                            className="w-full h-[44px] border border-[rgba(38,84,71,0.16)] dark:border-[rgba(38,84,71,0.2)] rounded-[10px] px-[16px] mb-[16px] bg-white dark:bg-[#1D2A25] font-inter text-[14px] text-[#111827] dark:text-[#EAF7F2] placeholder-[#D1D5DB] dark:placeholder-[#6D8279] outline-none transition-colors duration-200 focus:border-[#265447] dark:focus:border-[#3DAE8B]"
                        />

                        <label htmlFor="popup-password" className="text-[13px] font-semibold text-[#265447] dark:text-[#A9B6B0] mb-[8px] block transition-colors">Пароль</label>
                        <div className="relative mb-[16px]">
                            <input
                                id="popup-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Створіть пароль"
                                className="w-full h-[44px] border border-[rgba(38,84,71,0.16)] dark:border-[rgba(38,84,71,0.2)] rounded-[10px] px-[16px] pr-[40px] bg-white dark:bg-[#1D2A25] font-inter text-[14px] text-[#111827] dark:text-[#EAF7F2] placeholder-[#D1D5DB] dark:placeholder-[#6D8279] outline-none transition-colors duration-200 focus:border-[#265447] dark:focus:border-[#3DAE8B]"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-[12px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex items-center"
                            >
                                <img src={eyeIcon} alt="toggle" className="w-[18px] h-[18px] opacity-70 hover:opacity-100" />
                            </button>
                        </div>

                        <label htmlFor="popup-confirm" className="text-[13px] font-semibold text-[#265447] dark:text-[#A9B6B0] mb-[8px] block transition-colors">Підтвердьте пароль</label>
                        <div className="relative mb-[16px]">
                            <input
                                id="popup-confirm"
                                type={showConfirm ? 'text' : 'password'}
                                placeholder="Повторіть пароль"
                                className="w-full h-[44px] border border-[rgba(38,84,71,0.16)] dark:border-[rgba(38,84,71,0.2)] rounded-[10px] px-[16px] pr-[40px] bg-white dark:bg-[#1D2A25] font-inter text-[14px] text-[#111827] dark:text-[#EAF7F2] placeholder-[#D1D5DB] dark:placeholder-[#6D8279] outline-none transition-colors duration-200 focus:border-[#265447] dark:focus:border-[#3DAE8B]"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-[12px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex items-center"
                            >
                                <img src={eyeIcon} alt="toggle" className="w-[18px] h-[18px] opacity-70 hover:opacity-100" />
                            </button>
                        </div>

                        {/* Custom checkbox */}
                        <div className="flex items-start gap-[12px] mb-[24px]">
                            <input
                                type="checkbox"
                                id="agree-popup"
                                className="
                                    appearance-none shrink-0 w-[20px] h-[20px] mt-[1px]
                                    border border-[rgba(38,84,71,0.16)] dark:border-[rgba(38,84,71,0.2)] rounded-[6px] bg-white dark:bg-[#1D2A25] cursor-pointer relative
                                    checked:bg-[#265447] dark:checked:bg-[#3DAE8B] checked:border-[#265447] dark:checked:border-[#3DAE8B]
                                    after:content-[''] after:absolute after:left-[6px] after:top-[2px]
                                    after:w-[4px] after:h-[10px]
                                    after:border-white dark:after:border-[#111A17] after:border-r-2 after:border-b-2
                                    after:rotate-45 after:opacity-0 checked:after:opacity-100 transition-colors
                                "
                            />
                            <label htmlFor="agree-popup" className="text-[13px] leading-[19.5px] text-[#4B5563] dark:text-[#A9B6B0] cursor-pointer transition-colors">
                                Я погоджуюсь з{' '}
                                <span className="font-semibold text-[#111827] dark:text-[#3DAE8B]">Умовами користування</span> та{' '}
                                <span className="font-semibold text-[#111827] dark:text-[#3DAE8B]">Політикою конфіденційності.</span>
                            </label>
                        </div>

                        <button className="w-full h-[46px] mt-[8px] bg-[#265447] dark:bg-[#3DAE8B] text-white dark:text-[#111A17] rounded-[10px] border-none cursor-pointer font-inter text-[14px] font-bold transition-all duration-200 hover:bg-[#1A3E2F] dark:hover:bg-[#2C9E7C]">
                            Зареєструватися
                        </button>

                        <p className="text-center text-[14px] mt-[24px] text-[#6B7280] dark:text-[#A9B6B0] transition-colors">
                            Вже маєте акаунт?{' '}
                            <a href="/auth" className="text-[#265447] dark:text-[#3DAE8B] font-semibold no-underline hover:underline transition-colors">
                                Увійти
                            </a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
