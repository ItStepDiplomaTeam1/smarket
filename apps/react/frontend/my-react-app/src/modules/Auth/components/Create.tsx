import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google';
import { apiClient } from '@/shared/api/apiClient';
import { useAuthStore } from '../store/authStore';
import { useGoogleOAuth } from '@/hooks/api/useAuthApi';

import eyeIcon from '@/shared/assets/ButtonEye.svg';
import btngoogle from '@/shared/assets/google.svg';
import btnfacebook from '@/shared/assets/facebook.svg';
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

// --- Password strength helpers ---

type StrengthLevel = 'weak' | 'medium' | 'strong';

interface PasswordStrength {
    level: StrengthLevel;
    score: number; // 0–3
    label: string;
}

function getPasswordStrength(password: string): PasswordStrength {
    if (!password) return { level: 'weak', score: 0, label: '' };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;

    if (score === 3) return { level: 'strong', score: 3, label: 'Надійний' };
    if (score === 2) return { level: 'medium', score: 2, label: 'Середній' };
    return { level: 'weak', score: 1, label: 'Слабкий' };
}

const strengthColors: Record<StrengthLevel, string[]> = {
    weak:   ['bg-red-400',    'bg-[rgba(38,84,71,0.08)]', 'bg-[rgba(38,84,71,0.08)]'],
    medium: ['bg-yellow-400', 'bg-yellow-400',             'bg-[rgba(38,84,71,0.08)]'],
    strong: ['bg-[#265447]',  'bg-[#265447]',              'bg-[#265447]'],
};

const strengthTextColors: Record<StrengthLevel, string> = {
    weak:   'text-red-500',
    medium: 'text-yellow-500',
    strong: 'text-[#265447]',
};

// --- Field validation helpers ---

const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

function validateName(value: string): string {
    if (!value) return "Ім'я є обов'язковим.";
    if (value.length < 2) return "Ім'я повинно містити щонайменше 2 символи.";
    return '';
}

function validateEmail(value: string): string {
    if (!value) return 'Email є обов\'язковим.';
    if (!emailRegex.test(value)) return 'Будь ласка, введіть дійсний email.';
    return '';
}

function validatePassword(value: string): string {
    if (!value) return 'Пароль є обов\'язковим.';
    if (value.length < 8) return 'Мінімум 8 символів.';
    if (!/[A-Z]/.test(value)) return 'Потрібна хоча б 1 велика літера.';
    if (!/\d/.test(value)) return 'Потрібна хоча б 1 цифра.';
    return '';
}

function validateConfirm(password: string, confirm: string): string {
    if (!confirm) return 'Підтвердження пароля є обов\'язковим.';
    if (password !== confirm) return 'Паролі не співпадають.';
    return '';
}

// --- Component ---

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

    // Per-field errors (shown after first blur or submit attempt)
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

    const strength = getPasswordStrength(password);

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
                if (axios.isAxiosError(error) && error.response?.data?.message) {
                    throw new Error(error.response.data.message, { cause: error });
                }
                throw new Error('Помилка реєстрації. Спробуйте ще раз.', { cause: error });
            }
        },
        onSuccess: (data) => {
            setAuth(data.access_token, data.user);
            navigate('/');
        },
        onError: (error) => {
            setServerError(error.message);
        },
    });

    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setServerError('');

        // Mark all fields as touched so errors appear
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

    // Derived border classes
    const fieldBorder = (error: string, isTouched: boolean) =>
        isTouched && error
            ? 'border-red-400 focus:border-red-400'
            : 'border-[rgba(38,84,71,0.16)] focus:border-[#265447]';

    return (
        <section className="flex flex-col w-full min-h-screen bg-[#F6FAF8] font-inter">
            <div className="flex flex-1 justify-center items-center p-[40px]">

            <div className="flex w-[1040px] h-[858.5px] bg-white rounded-[24px] border border-[rgba(38,84,71,0.08)] shadow-[0px_18px_48px_rgba(23,59,51,0.12)] overflow-hidden shrink-0">
                {/* Left panel */}
                <div className="w-[467px] shrink-0 bg-gradient-to-b from-[#EAF7F2] to-[#F6FAF8] border-r border-[rgba(38,84,71,0.08)] p-[48px] text-[#173B33]">
                    <img src={logo} alt="Smarket Logo" className="w-[128px] mb-[32px]" />
                    <h2 className="font-manrope text-[32px] font-bold leading-[40px] mb-[16px]">
                        Купуйте розумніше. <br /> Заощаджуйте <br /> більше.
                    </h2>
                    <p className="text-[14px] leading-[21px] text-[#6D8279] mb-[24px]">
                        Створіть акаунт, щоб зберігати кошики, <br /> порівнювати ціни між магазинами та бачити, де <br /> вся покупка буде дешевшою.
                    </p>
                    <ul className="list-none m-0 p-0 mb-[40px]">
                        <li className="flex items-center gap-[12px] mb-[12px] text-[14px] font-medium">
                            <img src={checkIcon} alt="check" className="w-[20px] h-[20px] shrink-0" />
                            <span>Зберігайте списки покупок</span>
                        </li>
                        <li className="flex items-center gap-[12px] mb-[12px] text-[14px] font-medium">
                            <img src={checkIcon} alt="check" className="w-[20px] h-[20px] shrink-0" />
                            <span>Порівнюйте ціни між магазинами</span>
                        </li>
                        <li className="flex items-center gap-[12px] text-[14px] font-medium">
                            <img src={checkIcon} alt="check" className="w-[20px] h-[20px] shrink-0" />
                            <span>Відстежуйте свою економію</span>
                        </li>
                    </ul>
                    <img src={basketImage} alt="Ваш тижневий кошик" className="w-[360px] max-w-none h-auto -ml-[18px] block" />
                </div>

                {/* Right panel */}
                <div className="w-[573px] flex justify-center items-center">
                    <div className="w-[380px]">
                        <h1 className="font-manrope text-[30px] font-extrabold leading-[45px] text-[#265447] mb-[8px]">
                            Створіть акаунт
                        </h1>
                        <p className="text-[14px] leading-[21px] text-[#6D8279] mb-[24px]">
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
                            className="flex items-center justify-center gap-[8px] w-full h-[44px] bg-white border border-[rgba(38,84,71,0.16)] rounded-[10px] mb-[12px] cursor-pointer font-inter text-[13px] font-semibold text-[#111827] transition-colors duration-200 hover:bg-[#F9FAFB] disabled:opacity-50"
                        >
                            <img src={btngoogle} alt="Google" className="w-[20px] h-[20px]" />
                            <span>{googleOAuthMutation.isPending ? 'Завантаження...' : 'Продовжити з Google'}</span>
                        </button>
                        <button className="flex items-center justify-center gap-[8px] w-full h-[44px] bg-white border border-[rgba(38,84,71,0.16)] rounded-[10px] mb-[12px] cursor-pointer font-inter text-[13px] font-semibold text-[#111827] transition-colors duration-200 hover:bg-[#F9FAFB]">
                            <img src={btnfacebook} alt="Facebook" className="w-[20px] h-[20px]" />
                            <span>Продовжити з Facebook</span>
                        </button>

                        <div className="flex items-center text-[#6D8279] text-[13px] mt-[24px] mb-[24px] gap-[10px]">
                            <span className="flex-1 h-px bg-[rgba(38,84,71,0.08)]"></span>
                            <span className="shrink-0">або зареєструйтесь через email</span>
                            <span className="flex-1 h-px bg-[rgba(38,84,71,0.08)]"></span>
                        </div>

                        <form className="flex flex-col" onSubmit={handleSubmit} noValidate>
                            {/* Name */}
                            <label htmlFor="reg-name" className="text-[13px] font-semibold text-[#265447] mb-[8px] block">Ім'я</label>
                            <input
                                id="reg-name"
                                type="text"
                                placeholder="Олена"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onBlur={() => handleBlur('name')}
                                disabled={registerMutation.isPending}
                                className={`w-full h-[44px] border rounded-[10px] px-[16px] bg-white font-inter text-[14px] text-[#111827] outline-none transition-colors duration-200 ${fieldBorder(nameError, touched.name)}`}
                            />
                            {nameError && (
                                <p className="mt-[4px] mb-[8px] text-[12px] text-red-500 font-medium">{nameError}</p>
                            )}
                            {!nameError && <div className="mb-[16px]" />}

                            {/* Email */}
                            <label htmlFor="reg-email" className="text-[13px] font-semibold text-[#265447] mb-[8px] block">Email</label>
                            <input
                                id="reg-email"
                                type="email"
                                placeholder="smarket@gmail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={() => handleBlur('email')}
                                disabled={registerMutation.isPending}
                                className={`w-full h-[44px] border rounded-[10px] px-[16px] bg-white font-inter text-[14px] text-[#111827] outline-none transition-colors duration-200 ${fieldBorder(emailError, touched.email)}`}
                            />
                            {emailError && (
                                <p className="mt-[4px] mb-[8px] text-[12px] text-red-500 font-medium">{emailError}</p>
                            )}
                            {!emailError && <div className="mb-[16px]" />}

                            {/* Password */}
                            <label htmlFor="reg-password" className="text-[13px] font-semibold text-[#265447] mb-[8px] block">Пароль</label>
                            <div className="relative">
                                <input
                                    id="reg-password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Створіть пароль"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onBlur={() => handleBlur('password')}
                                    disabled={registerMutation.isPending}
                                    className={`w-full h-[44px] border rounded-[10px] px-[16px] pr-[40px] bg-white font-inter text-[14px] text-[#111827] outline-none transition-colors duration-200 ${fieldBorder(passwordError, touched.password)}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-[12px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex items-center"
                                >
                                    <img src={eyeIcon} alt="toggle" className="w-[18px] h-[18px]" />
                                </button>
                            </div>

                            {/* Strength bar */}
                            {password && (
                                <div className="mt-[8px]">
                                    <div className="flex gap-[4px] mb-[4px]">
                                        <div className={`flex-1 h-[4px] rounded-full transition-colors duration-300 ${strengthColors[strength.level][0]}`} />
                                        <div className={`flex-1 h-[4px] rounded-full transition-colors duration-300 ${strengthColors[strength.level][1]}`} />
                                        <div className={`flex-1 h-[4px] rounded-full transition-colors duration-300 ${strengthColors[strength.level][2]}`} />
                                    </div>
                                    <p className={`text-[11px] font-semibold ${strengthTextColors[strength.level]}`}>
                                        {strength.label}
                                    </p>
                                </div>
                            )}

                            {passwordError && (
                                <p className="mt-[4px] mb-[8px] text-[12px] text-red-500 font-medium">{passwordError}</p>
                            )}
                            {!passwordError && <div className="mb-[16px]" />}

                            {/* Confirm password */}
                            <label htmlFor="reg-confirm" className="text-[13px] font-semibold text-[#265447] mb-[8px] block">Підтвердьте пароль</label>
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
                                    className={`w-full h-[44px] border rounded-[10px] px-[16px] pr-[40px] bg-white font-inter text-[14px] text-[#111827] outline-none transition-colors duration-200 ${fieldBorder(confirmError, touched.confirm)}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-[12px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex items-center"
                                >
                                    <img src={eyeIcon} alt="toggle" className="w-[18px] h-[18px]" />
                                </button>
                            </div>
                            {confirmError && (
                                <p className="mt-[4px] mb-[8px] text-[12px] text-red-500 font-medium">{confirmError}</p>
                            )}
                            {!confirmError && <div className="mb-[16px]" />}

                            {/* Agree */}
                            <div className="flex items-start gap-[12px] mb-[24px]">
                                <input
                                    type="checkbox"
                                    id="agree"
                                    checked={agree}
                                    onChange={(e) => setAgree(e.target.checked)}
                                    disabled={registerMutation.isPending}
                                    className="appearance-none shrink-0 w-[20px] h-[20px] mt-[1px] border border-[rgba(38,84,71,0.16)] rounded-[6px] bg-white cursor-pointer relative checked:bg-[#265447] checked:border-[#265447] after:content-[''] after:absolute after:left-[6px] after:top-[2px] after:w-[4px] after:h-[10px] after:border-white after:border-r-2 after:border-b-2 after:rotate-45 after:opacity-0 checked:after:opacity-100"
                                />
                                <label htmlFor="agree" className="text-[13px] leading-[19.5px] text-[#4B5563] cursor-pointer">
                                    Я погоджуюсь з <span className="font-semibold text-[#111827]">Умовами користування</span> та <span className="font-semibold text-[#111827]">Політикою конфіденційності.</span>
                                </label>
                            </div>

                            {/* Server error */}
                            {serverError && (
                                <div className="mb-[16px] text-red-500 text-[13px] font-medium">{serverError}</div>
                            )}

                            <button
                                type="submit"
                                disabled={registerMutation.isPending}
                                className="w-full h-[46px] mt-[8px] bg-[#265447] text-white rounded-[10px] border-none cursor-pointer font-inter text-[14px] font-bold transition-colors duration-200 hover:bg-[#1A3E2F] disabled:opacity-50"
                            >
                                {registerMutation.isPending ? 'Завантаження...' : 'Зареєструватися'}
                            </button>

                            <p className="text-center text-[14px] mt-[24px] text-[#6B7280]">
                                Вже маєте акаунт? <Link to="/auth" className="text-[#265447] font-semibold no-underline hover:underline">Увійти</Link>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        </section>
    );
}