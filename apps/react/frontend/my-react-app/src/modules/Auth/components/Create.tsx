import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google';
import { apiClient } from '@/shared/api/apiClient';
import { Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useGoogleOAuth, type MeResponse } from '@/hooks/api/useAuthApi';
import { TelegramLoginButton } from './TelegramLoginButton';

import eyeIcon from '@/shared/assets/ButtonEye.svg';
import btngoogle from '@/shared/assets/google.svg';
import checkIcon from '@/shared/assets/checkgreen.svg';
import logo from '@/shared/assets/logo.svg';
import basketImage from '@/shared/assets/logindefault.svg';

interface User {
    id: string;
    name: string;
    email: string;
}

interface RegisterResponse {
    access_token: string;
    user: User;
}

const PasswordChecklist = ({ password }: { password: string }) => {
    const rules = [
        { label: 'Мінімум 8 символів', check: () => password.length >= 8 },
        { label: 'Велика літера', check: () => /[A-Z]/.test(password) },
        { label: 'Мала літера', check: () => /[a-z]/.test(password) },
        { label: 'Цифра', check: () => /\d/.test(password) },
        { label: 'Спецсимвол (!@#$%^&*)', check: () => /[!@#$%^&*()\-_=+[\]{}|;:,.<>?/~`]/.test(password) },
    ];

    if (!password) return null;

    return (
        <div className="mt-[6px] flex flex-col gap-[2px] mb-[6px]">
            {rules.map((rule, idx) => {
                const isValid = rule.check();
                return (
                    <div key={idx} className={`flex items-center gap-[6px] text-[11px] font-medium transition-colors duration-300 ${isValid ? 'text-[#265447] dark:text-[#3DAE8B]' : 'text-gray-400 dark:text-[#6D8279]'}`}>
                        {isValid ? (
                            <Check className="w-[12px] h-[12px] shrink-0" strokeWidth={3} />
                        ) : (
                            <div className="w-[12px] h-[12px] shrink-0 rounded-full border border-gray-300 dark:border-[#265447] flex items-center justify-center" />
                        )}
                        <span>{rule.label}</span>
                    </div>
                );
            })}
        </div>
    );
};


const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

function validateName(value: string): string {
    if (!value) return "Ім'я є обов'язковим.";
    if (value.length < 2) return "Ім'я повинно містити щонайменше 2 символи.";
    return '';
}

function validateEmail(value: string): string {
    if (!value) return 'Email є обов\'язковим.';
    if (!emailRegex.test(value)) return 'Будь ласка, введіть дійсний email.';
    if (value.includes('..')) return 'Email не може містити дві крапки підряд.';

    const parts = value.split('@');
    if (parts.length === 2) {
        const domain = parts[1].toLowerCase();
        const domainName = domain.split('.')[0];
        const tld = domain.split('.').slice(1).join('.');

        const popularDomains = ['gmail', 'yahoo', 'hotmail', 'outlook', 'icloud'];
        if (popularDomains.includes(domainName)) {
            if (['c', 'co', 'con', 'comn', 'xom', 'cpm'].includes(tld)) {
                return `Можливо, ви мали на увазі ${domainName}.com?`;
            }
            if (tld === 'ua' || tld === 'net') {
                 // Усе с кайфом
            }
        }
        
        if (domainName === 'ukr' && ['ne', 'nrt', 'ner'].includes(tld)) {
             return 'Можливо, ви мали на увазі ukr.net?';
        }
    }

    return '';
}

function validatePassword(value: string): string {
    if (!value) return 'Пароль є обов\'язковим.';
    if (value.length < 8) return 'Мінімум 8 символів.';
    if (!/[A-Z]/.test(value)) return 'Потрібна хоча б 1 велика літера.';
    if (!/[a-z]/.test(value)) return 'Потрібна хоча б 1 мала літера.';
    if (!/\d/.test(value)) return 'Потрібна хоча б 1 цифра.';
    if (!/[!@#$%^&*()\-_=+[\]{}|;:,.<>?/~`]/.test(value)) return 'Потрібен хоча б 1 спецсимвол.';
    return '';
}

function validateConfirm(password: string, confirm: string): string {
    if (!confirm) return 'Підтвердження пароля є обов\'язковим.';
    if (password !== confirm) return 'Паролі не співпадають.';
    return '';
}


export function Create() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const googleOAuthMutation = useGoogleOAuth();

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: (tokenResponse: { access_token: string }) => {
            googleOAuthMutation.mutate(tokenResponse.access_token);
        },
        flow: 'implicit',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agree, setAgree] = useState(false);

    const [touched, setTouched] = useState({
        name: false,
        email: false,
        password: false,
        confirm: false,
    });

    const [serverError, setServerError] = useState('');

    const nameError    = touched.name     ? validateName(name)                          : '';
    const emailError   = touched.email    ? validateEmail(email)                        : '';
    const passwordError = touched.password ? validatePassword(password)                 : '';
    const confirmError = touched.confirm  ? validateConfirm(password, confirmPassword)  : '';

    const handleBlur = useCallback((field: keyof typeof touched) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
    }, []);

    const registerMutation = useMutation<RegisterResponse, Error>({
        mutationFn: async () => {
            try {
                const response = await apiClient.post<RegisterResponse>('/api/v1/auth/register', {
                    name,
                    email,
                    password,
                });
                return response.data;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    if (error.response?.data?.detail) {
                        const detail = error.response.data.detail;
                        if (Array.isArray(detail) && detail.length > 0 && detail[0].msg) {
                            throw new Error(detail[0].msg, { cause: error });
                        } else if (typeof detail === 'string') {
                            throw new Error(detail, { cause: error });
                        }
                    } else if (error.response?.data?.message) {
                        throw new Error(error.response.data.message, { cause: error });
                    }
                }
                throw new Error('Помилка реєстрації. Спробуйте ще раз.', { cause: error });
            }
        },
        onSuccess: async (data) => {
            setAuth(data.access_token, data.user);
            try {
                const { data: me } = await apiClient.get<MeResponse>('/api/v1/auth/me');
                useAuthStore.setState((state) => ({
                    user: state.user ? { ...state.user, name: me.username } : state.user,
                }));
            } catch {
                // fallback — ім'я залишиться undefined
            }
            toast.success(`Вітаємо, ${name}! Ви успішно зареєструвались.`);
            navigate('/');
        },
        onError: (error) => {
            setServerError(error.message);
        },
    });

    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setServerError('');

        setTouched({ name: true, email: true, password: true, confirm: true });

        const hasErrors =
            validateName(name) ||
            validateEmail(email) ||
            validatePassword(password) ||
            validateConfirm(password, confirmPassword);

        if (hasErrors) return;

        if (!agree) {
            setServerError('Ви повинні погодитися з Умовами користування.');
            return;
        }

        registerMutation.mutate();
    };

    const fieldBorder = (error: string, isTouched: boolean) =>
        isTouched && error
            ? 'border-red-500 focus:border-red-500'
            : 'border-[rgba(38,84,71,0.16)] dark:border-[rgba(38,84,71,0.2)] focus:border-[#265447] dark:focus:border-[#3DAE8B]';

    return (
        <section className="flex flex-col w-full min-h-screen bg-[#F6FAF8] dark:bg-[#0B110F] font-inter transition-colors duration-300">
            <div className="flex justify-center items-start py-[24px] px-[16px] sm:py-[40px] sm:px-[40px]">

            {/* Height follows form content (no fixed clip) so the register button stays in bounds */}
            <div className="flex w-full max-w-[1040px] bg-white dark:bg-[#111A17] rounded-[24px] border border-[rgba(38,84,71,0.08)] shadow-[0px_18px_48px_rgba(23,59,51,0.12)] overflow-hidden transition-colors duration-300">
                {/* Left panel */}
                <div className="w-[467px] shrink-0 hidden md:flex flex-col bg-gradient-to-b from-[#EAF7F2] to-[#F6FAF8] dark:from-[rgba(74,222,128,0.31)] dark:to-[rgba(17,26,23,0.47)] border-r border-[rgba(38,84,71,0.08)] p-[48px] text-[#173B33] dark:text-white transition-colors duration-300">
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

                {/* Right panel */}
                <div className="flex-1 flex justify-center">
                    <div className="w-full max-w-[380px] px-[24px] py-[32px] sm:py-[40px]">
                        <img src={logo} alt="Smarket Logo" className="w-[128px] mb-[24px] md:hidden dark:brightness-0 dark:invert transition-all" />
                        <h1 className="font-manrope text-[28px] sm:text-[30px] font-extrabold leading-[1.3] text-[#265447] dark:text-white mb-[6px] transition-colors">
                            Створіть акаунт
                        </h1>
                        <p className="text-[14px] leading-[21px] text-[#6D8279] dark:text-[#A9B6B0] mb-[16px] transition-colors">
                            Почніть порівнювати ціни та збирати вигідні кошики вже сьогодні.
                        </p>

                        {googleOAuthMutation.isError && (
                            <p className="text-red-500 text-[12px] mb-[8px] text-center">
                                {googleOAuthMutation.error?.message}
                            </p>
                        )}

                        <button
                            id="btn-google-register"
                            type="button"
                            onClick={() => handleGoogleLogin()}
                            disabled={googleOAuthMutation.isPending}
                            className="flex items-center justify-center gap-[8px] w-full h-[44px] bg-white dark:bg-[#1B2A24] border border-[rgba(38,84,71,0.16)] dark:border-[rgba(38,84,71,0.2)] rounded-[10px] mb-[12px] cursor-pointer font-inter text-[13px] font-semibold text-[#111827] dark:text-white transition-all duration-200 hover:bg-[#F9FAFB] dark:hover:bg-[#203730] hover:shadow-sm disabled:opacity-50"
                        >
                            {googleOAuthMutation.isPending ? (
                                <Loader2 className="w-[20px] h-[20px] animate-spin text-[#265447] dark:text-[#3DAE8B]" />
                            ) : (
                                <img src={btngoogle} alt="Google" className="w-[20px] h-[20px]" />
                            )}
                            <span>{googleOAuthMutation.isPending ? 'Завантаження...' : 'Продовжити з Google'}</span>
                        </button>
                        <TelegramLoginButton 
                            botId={import.meta.env.VITE_TELEGRAM_BOT_ID || '8912413936'}
                        />

                        <div className="flex items-center text-[#6D8279] dark:text-[#A9B6B0] text-[13px] my-[16px] gap-[10px] transition-colors">
                            <span className="flex-1 h-px bg-[rgba(38,84,71,0.08)] dark:bg-[rgba(38,84,71,0.2)] transition-colors"></span>
                            <span className="shrink-0">або зареєструйтесь через email</span>
                            <span className="flex-1 h-px bg-[rgba(38,84,71,0.08)] dark:bg-[rgba(38,84,71,0.2)] transition-colors"></span>
                        </div>

                        <form className="flex flex-col" onSubmit={handleSubmit} noValidate>
                            {/* Name */}
                            <label htmlFor="reg-name" className="text-[13px] font-semibold text-[#265447] dark:text-[#A9B6B0] mb-[6px] block transition-colors">Ім'я</label>
                            <input
                                id="reg-name"
                                type="text"
                                placeholder="Олена"
                                autoFocus
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onBlur={() => handleBlur('name')}
                                disabled={registerMutation.isPending}
                                className={`w-full h-[44px] border rounded-[10px] px-[16px] bg-white dark:bg-[#1D2A25] font-inter text-[14px] text-[#111827] dark:text-[#EAF7F2] outline-none transition-colors duration-200 placeholder-[#D1D5DB] dark:placeholder-[#6D8279] ${fieldBorder(nameError, touched.name)}`}
                            />
                            <div className={`overflow-hidden transition-all duration-300 ${nameError ? 'max-h-[40px] opacity-100 mt-[4px] mb-[8px]' : 'max-h-0 opacity-0 mb-[12px]'}`}>
                                <p className="text-[12px] text-red-500 font-medium">{nameError}</p>
                            </div>

                            {/* Email */}
                            <label htmlFor="reg-email" className="text-[13px] font-semibold text-[#265447] dark:text-[#A9B6B0] mb-[6px] block transition-colors">Email</label>
                            <input
                                id="reg-email"
                                type="email"
                                placeholder="smarket@gmail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={() => handleBlur('email')}
                                disabled={registerMutation.isPending}
                                className={`w-full h-[44px] border rounded-[10px] px-[16px] bg-white dark:bg-[#1D2A25] font-inter text-[14px] text-[#111827] dark:text-[#EAF7F2] outline-none transition-colors duration-200 placeholder-[#D1D5DB] dark:placeholder-[#6D8279] ${fieldBorder(emailError, touched.email)}`}
                            />
                            <div className={`overflow-hidden transition-all duration-300 ${emailError ? 'max-h-[40px] opacity-100 mt-[4px] mb-[8px]' : 'max-h-0 opacity-0 mb-[12px]'}`}>
                                <p className="text-[12px] text-red-500 font-medium">{emailError}</p>
                            </div>

                            {/* Password */}
                            <label htmlFor="reg-password" className="text-[13px] font-semibold text-[#265447] dark:text-[#A9B6B0] mb-[6px] block transition-colors">Пароль</label>
                            <div className="relative">
                                <input
                                    id="reg-password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Створіть пароль"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onBlur={() => handleBlur('password')}
                                    disabled={registerMutation.isPending}
                                    className={`w-full h-[44px] border rounded-[10px] px-[16px] pr-[40px] bg-white dark:bg-[#1D2A25] font-inter text-[14px] text-[#111827] dark:text-[#EAF7F2] outline-none transition-colors duration-200 placeholder-[#D1D5DB] dark:placeholder-[#6D8279] ${fieldBorder(passwordError, touched.password)}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-[12px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex items-center"
                                >
                                    <img src={eyeIcon} alt="toggle" className="w-[18px] h-[18px] opacity-70 dark:opacity-100" />
                                </button>
                            </div>

                            {/* Strength Checklist */}
                            <PasswordChecklist password={password} />

                            <div className={`overflow-hidden transition-all duration-300 ${passwordError ? 'max-h-[40px] opacity-100 mt-[4px] mb-[8px]' : 'max-h-0 opacity-0 mb-[12px]'}`}>
                                <p className="text-[12px] text-red-500 font-medium">{passwordError}</p>
                            </div>

                            {/* Confirm password */}
                            <label htmlFor="reg-confirm" className="text-[13px] font-semibold text-[#265447] dark:text-[#A9B6B0] mb-[6px] block transition-colors">Підтвердьте пароль</label>
                            <div className="relative">
                                <input
                                    id="reg-confirm"
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="Повторіть пароль"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        if (!touched.confirm) setTouched((prev) => ({ ...prev, confirm: true }));
                                    }}
                                    onBlur={() => handleBlur('confirm')}
                                    disabled={registerMutation.isPending}
                                    className={`w-full h-[44px] border rounded-[10px] px-[16px] pr-[40px] bg-white dark:bg-[#1D2A25] font-inter text-[14px] text-[#111827] dark:text-[#EAF7F2] outline-none transition-colors duration-200 placeholder-[#D1D5DB] dark:placeholder-[#6D8279] ${fieldBorder(confirmError, touched.confirm)}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-[12px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex items-center"
                                >
                                    <img src={eyeIcon} alt="toggle" className="w-[18px] h-[18px] opacity-70 dark:opacity-100" />
                                </button>
                            </div>
                            <div className={`overflow-hidden transition-all duration-300 ${confirmError ? 'max-h-[40px] opacity-100 mt-[4px] mb-[8px]' : 'max-h-0 opacity-0 mb-[12px]'}`}>
                                <p className="text-[12px] text-red-500 font-medium">{confirmError}</p>
                            </div>

                            {/* Agree */}
                            <div className="flex items-start gap-[12px] mb-[16px]">
                                <input
                                    type="checkbox"
                                    id="agree"
                                    checked={agree}
                                    onChange={(e) => setAgree(e.target.checked)}
                                    disabled={registerMutation.isPending}
                                    className="appearance-none shrink-0 w-[20px] h-[20px] mt-[1px] border border-[rgba(38,84,71,0.16)] dark:border-[rgba(38,84,71,0.2)] rounded-[6px] bg-white dark:bg-[#1D2A25] cursor-pointer relative checked:bg-[#265447] dark:checked:bg-[#3DAE8B] checked:border-[#265447] dark:checked:border-[#3DAE8B] after:content-[''] after:absolute after:left-[6px] after:top-[2px] after:w-[4px] after:h-[10px] after:border-white dark:after:border-[#111A17] after:border-r-2 after:border-b-2 after:rotate-45 after:opacity-0 checked:after:opacity-100 transition-colors"
                                />
                                <label htmlFor="agree" className="text-[13px] leading-[19.5px] text-[#4B5563] dark:text-[#A9B6B0] cursor-pointer transition-colors">
                                    Я погоджуюсь з <span className="font-semibold text-[#111827] dark:text-[#3DAE8B]">Умовами користування</span> та <span className="font-semibold text-[#111827] dark:text-[#3DAE8B]">Політикою конфіденційності.</span>
                                </label>
                            </div>

                            {/* Server error */}
                            <div className={`overflow-hidden transition-all duration-300 ${serverError ? 'max-h-[40px] opacity-100 mb-[12px]' : 'max-h-0 opacity-0'}`}>
                                <p className="text-red-500 text-[13px] font-medium">{serverError}</p>
                            </div>

                            <button
                                type="submit"
                                disabled={registerMutation.isPending}
                                className="flex items-center justify-center gap-[8px] w-full h-[46px] mt-[4px] bg-[#265447] dark:bg-[#3DAE8B] text-white dark:text-[#111A17] rounded-[10px] border-none cursor-pointer font-inter text-[14px] font-bold transition-all duration-200 hover:bg-[#1A3E2F] dark:hover:bg-[#2C9E7C] hover:shadow-md disabled:opacity-50 shrink-0"
                            >
                                {registerMutation.isPending && <Loader2 className="w-[18px] h-[18px] animate-spin" />}
                                <span>{registerMutation.isPending ? 'Завантаження...' : 'Зареєструватися'}</span>
                            </button>

                            <p className="text-center text-[14px] mt-[16px] mb-[8px] text-[#6B7280] dark:text-[#A9B6B0] transition-colors">
                                Вже маєте акаунт? <Link to="/auth" viewTransition className="text-[#265447] dark:text-[#3DAE8B] font-semibold no-underline hover:underline transition-colors">Увійти</Link>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        </section>
    );
}