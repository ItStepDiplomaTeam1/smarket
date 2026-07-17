import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useResetPassword } from '@/hooks/api/useAuthApi';
import { Loader2, Check } from 'lucide-react';
import eyeIcon from '@/shared/assets/ButtonEye.svg';
import logo from '@/shared/assets/logo.svg';

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
        <div className="mt-[6px] flex flex-col gap-[2px] mb-[12px]">
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

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const email = searchParams.get('email') || '';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [clientError, setClientError] = useState('');

    const resetPasswordMutation = useResetPassword();

    const validatePassword = (val: string) => {
        if (val.length < 8) return false;
        if (!/[A-Z]/.test(val)) return false;
        if (!/[a-z]/.test(val)) return false;
        if (!/\d/.test(val)) return false;
        if (!/[!@#$%^&*()\-_=+[\]{}|;:,.<>?/~`]/.test(val)) return false;
        return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setClientError('');

        if (!token || !email) {
            setClientError('Недійсне посилання для відновлення пароля (відсутній токен або email).');
            return;
        }

        if (!password) {
            setClientError('Будь ласка, введіть новий пароль.');
            return;
        }

        if (!validatePassword(password)) {
            setClientError('Пароль не відповідає всім вимогам безпеки.');
            return;
        }

        if (password !== confirmPassword) {
            setClientError('Паролі не співпадають.');
            return;
        }

        resetPasswordMutation.mutate({
            email,
            token,
            new_password: password
        }, {
            onError: (err) => {
                setClientError(err.message);
            }
        });
    };

    return (
        <section className="flex flex-col w-full min-h-screen bg-[#F6FAF8] dark:bg-[#0B110F] font-inter transition-colors duration-300">
            <div className="flex flex-1 justify-center items-center py-[24px] px-[16px] sm:py-[40px] sm:px-[40px]">
                <div className="flex w-full max-w-[500px] bg-white dark:bg-[#111A17] rounded-[24px] border border-[rgba(38,84,71,0.08)] shadow-[0px_18px_48px_rgba(23,59,51,0.12)] p-[32px] sm:p-[48px] flex-col transition-colors duration-300">
                    
                    <div className="text-center mb-[28px]">
                        <img src={logo} alt="Smarket Logo" className="w-[128px] mx-auto mb-[24px] dark:brightness-0 dark:invert transition-all" />
                        <h1 className="font-manrope text-[26px] font-extrabold leading-[34px] text-[#265447] dark:text-white mb-[8px] transition-colors">
                            Встановлення нового пароля
                        </h1>
                        <p className="text-[13px] leading-[20px] text-[#6D8279] dark:text-[#A9B6B0] transition-colors">
                            Будь ласка, введіть та підтвердіть свій новий пароль.
                        </p>
                    </div>

                    {(!token || !email) ? (
                        <div className="text-center py-4">
                            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-[12px] p-[16px] mb-[24px]">
                                <p className="text-[13px] text-red-500 font-semibold leading-[20px]">
                                    Посилання для скидання пароля недійсне або пошкоджене. Перейдіть до сторінки відновлення знову.
                                </p>
                            </div>
                            <Link 
                                to="/forgot-password" 
                                className="inline-block text-[#265447] dark:text-[#3DAE8B] font-bold hover:underline"
                            >
                                Надіслати посилання знову
                            </Link>
                        </div>
                    ) : (
                        <form className="flex flex-col" onSubmit={handleSubmit}>
                            {/* New Password */}
                            <label className="text-[13px] font-semibold text-[#265447] dark:text-[#A9B6B0] mb-[8px] block transition-colors">Новий пароль</label>
                            <div className="relative mb-[4px]">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Введіть пароль"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={resetPasswordMutation.isPending}
                                    className="w-full h-[44px] border border-[rgba(38,84,71,0.16)] dark:border-[rgba(38,84,71,0.2)] rounded-[10px] px-[16px] pr-[40px] bg-white dark:bg-[#1D2A25] font-inter text-[14px] text-[#111827] dark:text-[#EAF7F2] outline-none transition-colors duration-200 focus:border-[#265447] dark:focus:border-[#3DAE8B] placeholder-[#D1D5DB] dark:placeholder-[#6D8279]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-[12px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex items-center"
                                >
                                    <img src={eyeIcon} alt="toggle" className="w-[18px] h-[18px] opacity-70 hover:opacity-100" />
                                </button>
                            </div>
                            
                            <PasswordChecklist password={password} />

                            {/* Confirm Password */}
                            <label className="text-[13px] font-semibold text-[#265447] dark:text-[#A9B6B0] mb-[8px] block transition-colors">Підтвердження пароля</label>
                            <div className="relative mb-[20px]">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="Повторіть пароль"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={resetPasswordMutation.isPending}
                                    className="w-full h-[44px] border border-[rgba(38,84,71,0.16)] dark:border-[rgba(38,84,71,0.2)] rounded-[10px] px-[16px] pr-[40px] bg-white dark:bg-[#1D2A25] font-inter text-[14px] text-[#111827] dark:text-[#EAF7F2] outline-none transition-colors duration-200 focus:border-[#265447] dark:focus:border-[#3DAE8B] placeholder-[#D1D5DB] dark:placeholder-[#6D8279]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-[12px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex items-center"
                                >
                                    <img src={eyeIcon} alt="toggle" className="w-[18px] h-[18px] opacity-70 hover:opacity-100" />
                                </button>
                            </div>

                            {/* Client Error Display */}
                            {clientError && (
                                <div className="mb-[16px]">
                                    <p className="text-red-500 text-[13px] font-semibold text-left">{clientError}</p>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={resetPasswordMutation.isPending}
                                className="w-full h-[46px] bg-[#265447] dark:bg-[#3DAE8B] text-white dark:text-[#111A17] rounded-[10px] border-none cursor-pointer font-inter text-[14px] font-bold transition-all duration-200 hover:bg-[#1A3E2F] dark:hover:bg-[#2C9E7C] hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-[8px]"
                            >
                                {resetPasswordMutation.isPending && <Loader2 className="w-[18px] h-[18px] animate-spin" />}
                                <span>{resetPasswordMutation.isPending ? 'Збереження...' : 'ЗБЕРЕГТИ ПАРОЛЬ'}</span>
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </section>
    );
}
