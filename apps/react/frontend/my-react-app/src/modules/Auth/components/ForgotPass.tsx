import { useState } from 'react';
import { useForgotPassword } from '@/hooks/api/useAuthApi';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import checkIcon from '@/shared/assets/checkgreen.svg';
import logo from '@/shared/assets/logo.svg';

const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export function ForgotPass() {
    const [email, setEmail] = useState('');
    const [isSent, setIsSent] = useState(false);
    const [emailError, setEmailError] = useState('');

    const forgotPasswordMutation = useForgotPassword();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError('');

        if (!email) {
            setEmailError('Email є обов\'язковим.');
            return;
        }

        if (!emailRegex.test(email)) {
            setEmailError('Будь ласка, введіть дійсний email.');
            return;
        }

        forgotPasswordMutation.mutate(
            { email },
            {
                onSuccess: () => {
                    setIsSent(true);
                    toast.success('Інструкції надіслано на вашу пошту.');
                },
                onError: (error) => {
                    toast.error(error.message);
                },
            }
        );
    };

    return (
        <section className="flex flex-col w-full min-h-screen bg-[#F6FAF8] dark:bg-[#0B110F] font-inter transition-colors duration-300">
            <div className="flex flex-1 justify-center items-center py-[24px] px-[16px] sm:py-[40px] sm:px-[40px]">

            {/* MAIN CARD */}
            <div className="flex w-full max-w-[1040px] h-auto md:h-[858.5px] bg-white dark:bg-[#111A17] rounded-[24px] border border-[rgba(38,84,71,0.08)] shadow-[0px_18px_48px_rgba(23,59,51,0.12)] overflow-hidden shrink-0 transition-colors duration-300">

                {/* ЛІВА ПАНЕЛЬ */}
                <div className="w-[467px] shrink-0 bg-gradient-to-b from-[#EAF7F2] to-[#F6FAF8] dark:from-[rgba(74,222,128,0.31)] dark:to-[rgba(17,26,23,0.47)] border-r border-[rgba(38,84,71,0.08)] p-[48px] text-[#173B33] dark:text-white hidden md:flex flex-col transition-colors duration-300">
                    <img src={logo} alt="Smarket Logo" className="w-[128px] mb-[32px] dark:brightness-0 dark:invert transition-all" />

                    <h2 className="font-manrope text-[32px] font-bold leading-[40px] mb-[16px]">
                        Купуйте розумніше. <br /> Заощадження <br /> більше.
                    </h2>
                    <p className="text-[14px] leading-[21px] text-[#6D8279] dark:text-[#A9B6B0] mb-[24px] transition-colors">
                        Створіть акаунт, щоб зберігати кошики, <br /> порівнювати ціни між магазинами та бачити, де <br /> вся покупка буде дешевшою.
                    </p>

                    <ul className="list-none m-0 p-0 mb-[40px]">
                        <li className="flex items-center gap-[12px] mb-[12px] text-[14px] font-medium text-[#173B33] dark:text-[#EAF7F2] transition-colors">
                            <img src={checkIcon} alt="check" className="w-[20px] h-[20px] shrink-0" /> Зберігайте списки покупок
                        </li>
                        <li className="flex items-center gap-[12px] mb-[12px] text-[14px] font-medium text-[#173B33] dark:text-[#EAF7F2] transition-colors">
                            <img src={checkIcon} alt="check" className="w-[20px] h-[20px] shrink-0" /> Порівнюйте ціни між магазинами
                        </li>
                        <li className="flex items-center gap-[12px] text-[14px] font-medium text-[#173B33] dark:text-[#EAF7F2] transition-colors">
                            <img src={checkIcon} alt="check" className="w-[20px] h-[20px] shrink-0" /> Відстежуйте свою економію
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
                            Відновлення паролю
                        </h1>

                        {!isSent ? (
                            <>
                                <p className="text-[14px] leading-[21px] text-[#6D8279] dark:text-[#A9B6B0] mb-[24px] text-left transition-colors">
                                    Введіть email, пов'язаний з вашим акаунтом. Ми надішлемо вам інструкції для створення нового паролю.
                                </p>

                                <form className="flex flex-col" onSubmit={handleSubmit}>
                                    <label className="text-[13px] font-semibold text-[#265447] dark:text-[#A9B6B0] mb-[8px] block transition-colors">Email</label>
                                    <input
                                        type="email"
                                        placeholder="smarket@gmail.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={forgotPasswordMutation.isPending}
                                        className={`w-full h-[44px] border rounded-[10px] px-[16px] mb-[4px] bg-white dark:bg-[#1D2A25] font-inter text-[14px] text-[#111827] dark:text-[#EAF7F2] placeholder-[#D1D5DB] dark:placeholder-[#6D8279] placeholder:opacity-100 outline-none transition-all duration-200 focus:border-[#265447] dark:focus:border-[#3DAE8B] ${
                                            emailError ? 'border-red-500 focus:border-red-500' : 'border-[rgba(38,84,71,0.16)] dark:border-[rgba(38,84,71,0.2)]'
                                        }`}
                                    />
                                    {emailError && (
                                        <span className="text-red-500 text-[11px] font-semibold mb-[20px]">{emailError}</span>
                                    )}

                                    <button 
                                        type="submit"
                                        disabled={forgotPasswordMutation.isPending}
                                        className="w-full h-[46px] bg-[#265447] dark:bg-[#3DAE8B] text-white dark:text-[#111A17] rounded-[10px] border-none cursor-pointer font-inter text-[14px] font-bold transition-colors duration-200 mb-[16px] hover:bg-[#1A3E2F] dark:hover:bg-[#2C9E7C] disabled:opacity-50 flex items-center justify-center gap-2 mt-[12px]"
                                    >
                                        {forgotPasswordMutation.isPending && <Loader2 className="w-[18px] h-[18px] animate-spin" />}
                                        <span>{forgotPasswordMutation.isPending ? 'Надсилання...' : 'ВІДПРАВИТИ ПОСИЛАННЯ'}</span>
                                    </button>

                                    <p className="text-center text-[14px] mt-[24px] text-[#6B7280] dark:text-[#A9B6B0] transition-colors">
                                        Згадали пароль?{' '}
                                        <a href="/auth" className="text-[#265447] dark:text-[#3DAE8B] font-semibold no-underline hover:underline transition-colors">
                                            Увійти
                                        </a>
                                    </p>
                                </form>
                            </>
                        ) : (
                            <div className="text-left mt-[16px]">
                                <div className="bg-[#EAF7F2] dark:bg-[#1C2C26] border border-[#265447]/10 dark:border-[#3DAE8B]/10 rounded-[12px] p-[20px] mb-[28px]">
                                    <p className="text-[14px] leading-[22px] text-[#265447] dark:text-[#3DAE8B] font-semibold mb-[8px]">
                                        Лист відправлено!
                                    </p>
                                    <p className="text-[13px] leading-[20px] text-[#6D8279] dark:text-[#A9B6B0]">
                                        Ми надіслали посилання для відновлення пароля на адресу <strong className="text-[#173B33] dark:text-[#EAF7F2]">{email}</strong>. Будь ласка, перевірте свою скриньку (також папку "Спам", якщо лист не надійшов протягом кількох хвилин).
                                    </p>
                                </div>
                                <a 
                                    href="/auth" 
                                    className="w-full h-[46px] bg-[#265447] dark:bg-[#3DAE8B] text-white dark:text-[#111A17] rounded-[10px] font-inter text-[14px] font-bold transition-colors duration-200 flex items-center justify-center no-underline hover:bg-[#1A3E2F] dark:hover:bg-[#2C9E7C]"
                                >
                                    Повернутися до входу
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </section>
    );
}
