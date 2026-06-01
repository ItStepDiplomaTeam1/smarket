import { useState } from 'react';
import eyeIcon from '../assets/ButtonEye.svg';
import btngoogle from '../assets/google.svg';
import btnfacebook from '../assets/facebook.svg';
import checkIcon from '../assets/checkgreen.svg';
import logo from '../assets/logo.svg';
import basketImage from '../assets/logindefault.svg';
import strela from '../assets/strela.svg';

export function Login() {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <section className="relative flex justify-center items-center w-full min-h-screen bg-[#F6FAF8] font-inter p-10">

            {/* Back link — absolute top-right */}
            <a
                href="/"
                className="absolute top-6 right-10 flex items-center gap-2 text-sm font-semibold text-[#265447] no-underline leading-[21px] hover:underline"
            >
                <img src={strela} alt="Back" className="w-4 h-4" />
                На головну сторінку
            </a>

            <div className="flex w-[1040px] h-[858.5px] bg-white rounded-3xl border border-[rgba(38,84,71,0.08)] shadow-[0px_18px_48px_rgba(23,59,51,0.12)] overflow-hidden shrink-0">

                {/* LEFT PANEL */}
                <div className="w-[467px] shrink-0 bg-gradient-to-b from-[#EAF7F2] to-[#F6FAF8] p-12 flex flex-col text-[#173B33]">
                    <img src={logo} alt="Smarket Logo" className="w-32 mb-8" />

                    <h2 className="font-manrope text-[32px] font-bold leading-10 mb-4">
                        Купуйте розумніше. <br /> Заощаджуйте більше.
                    </h2>
                    <p className="text-sm leading-[21px] text-[#6D8279] mb-6">
                        Створіть акаунт, щоб зберігати кошики, порівнювати ціни між магазинами та бачити, де покупка буде дешевшою.
                    </p>

                    <ul className="list-none p-0 m-0 mb-10">
                        <li className="flex items-center gap-3 mb-3 text-sm">
                            <img src={checkIcon} alt="check" className="w-4 h-4 shrink-0" /> Зберігайте списки покупок
                        </li>
                        <li className="flex items-center gap-3 mb-3 text-sm">
                            <img src={checkIcon} alt="check" className="w-4 h-4 shrink-0" /> Порівнюйте ціни між магазинами
                        </li>
                        <li className="flex items-center gap-3 text-sm">
                            <img src={checkIcon} alt="check" className="w-4 h-4 shrink-0" /> Відстежуйте свою економію
                        </li>
                    </ul>

                    <img src={basketImage} alt="Basket" className="w-[320px] h-[177px] object-cover rounded-2xl mt-auto" />
                </div>

                {/* RIGHT PANEL */}
                <div className="w-[573px] flex justify-center items-center">
                    <div className="w-[380px]">
                        <h1 className="font-manrope text-[30px] font-extrabold leading-[45px] text-[#265447] mb-2">
                            Увійти в акаунт
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
                        <div className="flex items-center text-[#6D8279] text-[13px] mt-6 mb-6 gap-[10px]">
                            <span className="flex-1 h-px bg-[rgba(38,84,71,0.08)]"></span>
                            <span className="shrink-0">або увійти через email</span>
                            <span className="flex-1 h-px bg-[rgba(38,84,71,0.08)]"></span>
                        </div>

                        <form className="flex flex-col">
                            <label className="text-[13px] font-semibold text-[#265447] mb-2 block">Email</label>
                            <input
                                type="email"
                                placeholder="smarket@gmail.com"
                                className="w-full h-11 border border-[rgba(38,84,71,0.16)] rounded-[10px] px-4 mb-5 bg-white font-inter text-sm text-[#111827] outline-none transition-colors duration-200 focus:border-[#265447]"
                            />

                            <label className="text-[13px] font-semibold text-[#265447] mb-2 block">Пароль</label>
                            {/* Wrapper gets the mb so the absolute toggle stays centred on the input */}
                            <div className="relative mb-2">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Введіть пароль"
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

                            <div className="flex justify-end mb-6">
                                <a href="#" className="font-inter text-sm font-normal leading-[21px] text-[#6D8279] no-underline hover:underline">
                                    Забули пароль?
                                </a>
                            </div>

                            <button className="w-full h-[46px] bg-[#265447] text-white rounded-[10px] border-none cursor-pointer font-inter text-sm font-bold transition-colors duration-200 hover:bg-[#1A3E2F]">
                                Увійти
                            </button>

                            <p className="text-center text-sm mt-6 text-[#6B7280]">
                                У вас немає акаунту?{' '}
                                <a href="#" className="text-[#265447] font-semibold no-underline hover:underline">
                                    Зареєструватися
                                </a>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}