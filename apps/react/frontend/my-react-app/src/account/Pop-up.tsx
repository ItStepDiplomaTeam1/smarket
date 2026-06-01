import { useState } from 'react';
import eyeIcon from '../assets/ButtonEye.svg';
import btngoogle from '../assets/google.svg';
import btnfacebook from '../assets/facebook.svg';

export function Popup() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    return (
        /* Overlay */
        <div className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-[8px] flex items-center justify-center font-inter">
            {/* Modal card */}
            <div className="relative w-[571px] max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-10 shadow-[0px_18px_48px_rgba(23,59,51,0.12)]">
                <div className="w-[380px] mx-auto">
                    <h1 className="font-manrope text-[30px] font-extrabold leading-[45px] text-[#265447] mb-2">
                        Створіть акаунт
                    </h1>
                    <p className="text-sm leading-[21px] text-[#6D8279] mb-6">
                        Почніть порівнювати ціни та збирати вигідні кошики вже сьогодні.
                    </p>

                    {/* Social buttons */}
                    <button className="flex items-center justify-center gap-2 w-full h-11 bg-white border border-[rgba(38,84,71,0.16)] rounded-[10px] mb-3 cursor-pointer font-inter text-[13px] font-semibold text-[#265447] transition-colors duration-200 hover:bg-[#F9FAFB]">
                        <img src={btngoogle} alt="Google" className="w-5 h-5" />
                        Продовжити з Google
                    </button>
                    <button className="flex items-center justify-center gap-2 w-full h-11 bg-white border border-[rgba(38,84,71,0.16)] rounded-[10px] mb-3 cursor-pointer font-inter text-[13px] font-semibold text-[#265447] transition-colors duration-200 hover:bg-[#F9FAFB]">
                        <img src={btnfacebook} alt="Facebook" className="w-5 h-5" />
                        Продовжити з Facebook
                    </button>

                    {/* OR divider */}
                    <div className="flex items-center text-[#6D8279] text-[13px] my-6 gap-[10px]">
                        <span className="flex-1 h-px bg-[rgba(38,84,71,0.08)]"></span>
                        <span className="shrink-0">або зареєструйтесь через email</span>
                        <span className="flex-1 h-px bg-[rgba(38,84,71,0.08)]"></span>
                    </div>

                    <form className="flex flex-col">
                        <label className="text-[13px] font-semibold text-[#265447] mb-2 block">Ім'я</label>
                        <input
                            type="text"
                            placeholder="Олена"
                            className="w-full h-11 border border-[rgba(38,84,71,0.16)] rounded-[10px] px-4 mb-4 bg-white font-inter text-sm text-[#111827] outline-none transition-colors duration-200 focus:border-[#265447]"
                        />

                        <label className="text-[13px] font-semibold text-[#265447] mb-2 block">Email</label>
                        <input
                            type="email"
                            placeholder="smarket@gmail.com"
                            className="w-full h-11 border border-[rgba(38,84,71,0.16)] rounded-[10px] px-4 mb-4 bg-white font-inter text-sm text-[#111827] outline-none transition-colors duration-200 focus:border-[#265447]"
                        />

                        <label className="text-[13px] font-semibold text-[#265447] mb-2 block">Пароль</label>
                        <div className="relative mb-4">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Створіть пароль"
                                className="w-full h-11 border border-[rgba(38,84,71,0.16)] rounded-[10px] px-4 pr-10 bg-white font-inter text-sm text-[#111827] outline-none transition-colors duration-200 focus:border-[#265447]"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex items-center"
                            >
                                <img src={eyeIcon} alt="toggle" className="w-[18px] h-[18px]" />
                            </button>
                        </div>

                        <label className="text-[13px] font-semibold text-[#265447] mb-2 block">Підтвердьте пароль</label>
                        <div className="relative mb-4">
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                placeholder="Повторіть пароль"
                                className="w-full h-11 border border-[rgba(38,84,71,0.16)] rounded-[10px] px-4 pr-10 bg-white font-inter text-sm text-[#111827] outline-none transition-colors duration-200 focus:border-[#265447]"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex items-center"
                            >
                                <img src={eyeIcon} alt="toggle" className="w-[18px] h-[18px]" />
                            </button>
                        </div>

                        {/* Custom checkbox */}
                        <div className="flex items-start gap-3 mb-6">
                            <input
                                type="checkbox"
                                id="agree-popup"
                                className="
                                    appearance-none shrink-0 w-5 h-5 mt-[1px]
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

                        <button className="w-full h-[46px] bg-[#265447] text-white rounded-[10px] border-none cursor-pointer font-inter text-sm font-bold transition-colors duration-200 hover:bg-[#1A3E2F]">
                            Зареєструватися
                        </button>

                        <p className="text-center text-sm mt-6 text-[#6B7280]">
                            Вже маєте акаунт?{' '}
                            <a href="#" className="text-[#265447] font-semibold no-underline hover:underline">
                                Увійти
                            </a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}