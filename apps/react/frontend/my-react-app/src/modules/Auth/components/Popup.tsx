import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import eyeIcon from '@/shared/assets/ButtonEye.svg';
import btngoogle from '@/shared/assets/google.svg';
import btnfacebook from '@/shared/assets/facebook.svg';
import { useGoogleOAuth } from '@/hooks/api/useAuthApi';

export function Popup() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const googleOAuthMutation = useGoogleOAuth();

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: (tokenResponse) => {
            googleOAuthMutation.mutate(tokenResponse.access_token);
        },
        flow: 'implicit',
    });

    return (
        /* Overlay */
        <div className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-[8px] flex items-center justify-center font-inter">
            {/* Modal card */}
            <div className="relative w-[571px] max-h-[90vh] overflow-y-auto bg-white rounded-[24px] p-[40px] shadow-[0px_18px_48px_rgba(23,59,51,0.12)]">
                <div className="w-[380px] mx-auto">
                    <h1 className="font-manrope text-[30px] font-extrabold leading-[45px] text-[#265447] mb-[8px] text-left">
                        Створіть акаунт
                    </h1>
                    <p className="text-[14px] leading-[21px] text-[#6D8279] mb-[24px] text-left">
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
                        className="flex items-center justify-center gap-[8px] w-full h-[44px] bg-white border border-[rgba(38,84,71,0.16)] rounded-[10px] mb-[12px] cursor-pointer font-inter text-[13px] font-semibold text-[#265447] transition-colors duration-200 hover:bg-[#F9FAFB] disabled:opacity-50"
                    >
                        <img src={btngoogle} alt="Google" className="w-[20px] h-[20px]" />
                        <span>{googleOAuthMutation.isPending ? 'Завантаження...' : 'Продовжити з Google'}</span>
                    </button>
                    <button className="flex items-center justify-center gap-[8px] w-full h-[44px] bg-white border border-[rgba(38,84,71,0.16)] rounded-[10px] mb-[12px] cursor-pointer font-inter text-[13px] font-semibold text-[#265447] transition-colors duration-200 hover:bg-[#F9FAFB]">
                        <img src={btnfacebook} alt="Facebook" className="w-[20px] h-[20px]" />
                        <span>Продовжити з Facebook</span>
                    </button>

                    {/* OR divider */}
                    <div className="flex items-center text-[#6D8279] text-[13px] my-[24px] gap-[10px]">
                        <span className="flex-1 h-px bg-[rgba(38,84,71,0.08)]"></span>
                        <span className="shrink-0">або зареєструйтесь через email</span>
                        <span className="flex-1 h-px bg-[rgba(38,84,71,0.08)]"></span>
                    </div>

                    <form className="flex flex-col">
                        <label htmlFor="popup-name" className="text-[13px] font-semibold text-[#265447] mb-[8px] block">Ім'я</label>
                        <input
                            id="popup-name"
                            type="text"
                            placeholder="Олена"
                            className="w-full h-[44px] border border-[rgba(38,84,71,0.16)] rounded-[10px] px-[16px] mb-[16px] bg-white font-inter text-[14px] text-[#111827] outline-none transition-colors duration-200 focus:border-[#265447]"
                        />

                        <label htmlFor="popup-email" className="text-[13px] font-semibold text-[#265447] mb-[8px] block">Email</label>
                        <input
                            id="popup-email"
                            type="email"
                            placeholder="smarket@gmail.com"
                            className="w-full h-[44px] border border-[rgba(38,84,71,0.16)] rounded-[10px] px-[16px] mb-[16px] bg-white font-inter text-[14px] text-[#111827] outline-none transition-colors duration-200 focus:border-[#265447]"
                        />

                        <label htmlFor="popup-password" className="text-[13px] font-semibold text-[#265447] mb-[8px] block">Пароль</label>
                        <div className="relative mb-[16px]">
                            <input
                                id="popup-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Створіть пароль"
                                className="w-full h-[44px] border border-[rgba(38,84,71,0.16)] rounded-[10px] px-[16px] pr-[40px] bg-white font-inter text-[14px] text-[#111827] outline-none transition-colors duration-200 focus:border-[#265447]"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-[12px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex items-center"
                            >
                                <img src={eyeIcon} alt="toggle" className="w-[18px] h-[18px]" />
                            </button>
                        </div>

                        <label htmlFor="popup-confirm" className="text-[13px] font-semibold text-[#265447] mb-[8px] block">Підтвердьте пароль</label>
                        <div className="relative mb-[16px]">
                            <input
                                id="popup-confirm"
                                type={showConfirm ? 'text' : 'password'}
                                placeholder="Повторіть пароль"
                                className="w-full h-[44px] border border-[rgba(38,84,71,0.16)] rounded-[10px] px-[16px] pr-[40px] bg-white font-inter text-[14px] text-[#111827] outline-none transition-colors duration-200 focus:border-[#265447]"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-[12px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex items-center"
                            >
                                <img src={eyeIcon} alt="toggle" className="w-[18px] h-[18px]" />
                            </button>
                        </div>

                        {/* Custom checkbox */}
                        <div className="flex items-start gap-[12px] mb-[24px]">
                            <input
                                type="checkbox"
                                id="agree-popup"
                                className="
                                    appearance-none shrink-0 w-[20px] h-[20px] mt-[1px]
                                    border border-[rgba(38,84,71,0.16)] rounded-[6px] bg-white cursor-pointer relative
                                    checked:bg-[#265447] checked:border-[#265447]
                                    after:content-[''] after:absolute after:left-[6px] after:top-[2px]
                                    after:w-[4px] after:h-[10px]
                                    after:border-white after:border-r-2 after:border-b-2
                                    after:rotate-45 after:opacity-0 checked:after:opacity-100
                                "
                            />
                            <label htmlFor="agree-popup" className="text-[13px] leading-[19.5px] text-[#6D8279] cursor-pointer">
                                Я погоджуюсь з{' '}
                                <span className="font-semibold text-[#265447]">Умовами користування</span> та{' '}
                                <span className="font-semibold text-[#265447]">Політикою конфіденційності.</span>
                            </label>
                        </div>

                        <button className="w-full h-[46px] mt-[8px] bg-[#265447] text-white rounded-[10px] border-none cursor-pointer font-inter text-[14px] font-bold transition-colors duration-200 hover:bg-[#1A3E2F]">
                            Зареєструватися
                        </button>

                        <p className="text-center text-[14px] mt-[24px] text-[#6B7280]">
                            Вже маєте акаунт?{' '}
                            <a href="/auth" className="text-[#265447] font-semibold no-underline hover:underline">
                                Увійти
                            </a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
