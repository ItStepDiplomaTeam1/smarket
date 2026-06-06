import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiClient } from '@/shared/api/apiClient';
import { useAuthStore } from '../store/authStore'; // Якщо шлях інший - виправте

import eyeIcon from '@/shared/assets/ButtonEye.svg';
import btngoogle from '@/shared/assets/google.svg';
import btnfacebook from '@/shared/assets/facebook.svg';
import checkIcon from '@/shared/assets/checkgreen.svg';
import logo from '@/shared/assets/logo.svg';
import basketImage from '@/shared/assets/logindefault.svg';
import strela from '@/shared/assets/strela.svg';

// Інтерфейси для відповіді сервера (припускаємо, що після реєстрації він теж повертає токен)
interface User {
    id: string;
    name: string;
    email: string;
}

interface RegisterResponse {
    token: string;
    user: User;
}

export function Create() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    // 1. Локальні стани для видимості паролів
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // 2. Локальні стани для значень полів
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agree, setAgree] = useState(false);

    // Стан для фронтенд-помилок (наприклад, якщо паролі не співпадають)
    const [validationError, setValidationError] = useState('');

    // 3. Мутація для реєстрації
    const registerMutation = useMutation<RegisterResponse, Error>({
        mutationFn: async () => {
            try {
                // Відправляємо дані на роут /register. Підтвердження пароля та чекбокс на сервер зазвичай не передаються.
                const response = await apiClient.post<RegisterResponse>('/api/v1/auth/register', { 
                    name, 
                    email, 
                    password 
                });
                return response.data;
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.data?.message) {
                    throw new Error(error.response.data.message);
                }
                throw new Error('Помилка реєстрації. Спробуйте ще раз.');
            }
        },
        onSuccess: (data) => {
            // Якщо сервер одразу після реєстрації повертає токен — авторизуємо юзера
            setAuth(data.token, data.user);
            navigate('/'); // Редірект на головну
        },
    });

    // 4. Обробник форми
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(''); // Очищаємо попередні помилки

        // Перевірки на фронтенді
        if (!name || !email || !password || !confirmPassword) {
            setValidationError('Будь ласка, заповніть всі поля.');
            return;
        }

        if (password !== confirmPassword) {
            setValidationError('Паролі не співпадають.');
            return;
        }

        if (!agree) {
            setValidationError('Ви повинні погодитися з Умовами користування.');
            return;
        }

        // Якщо всі перевірки пройдені, відправляємо запит
        registerMutation.mutate();
    };

    return (
        <section className="relative flex justify-center items-center w-full min-h-screen bg-[#F6FAF8] font-inter p-[40px]">
            <a href="/" className="absolute top-[24px] right-[40px] flex items-center gap-[8px] text-[14px] font-semibold text-[#265447] no-underline leading-[21px] hover:underline">
                <img src={strela} alt="Back" className="w-[16px] h-[16px]" />
                На головну сторінку
            </a>

            <div className="flex w-[1040px] h-[858.5px] bg-white rounded-[24px] border border-[rgba(38,84,71,0.08)] shadow-[0px_18px_48px_rgba(23,59,51,0.12)] overflow-hidden shrink-0">
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
                            <img src={checkIcon} alt="check" className="w-[20px] h-[20px] shrink-0" /> Зберігайте списки покупок
                        </li>
                        <li className="flex items-center gap-[12px] mb-[12px] text-[14px] font-medium">
                            <img src={checkIcon} alt="check" className="w-[20px] h-[20px] shrink-0" /> Порівнюйте ціни між магазинами
                        </li>
                        <li className="flex items-center gap-[12px] text-[14px] font-medium">
                            <img src={checkIcon} alt="check" className="w-[20px] h-[20px] shrink-0" /> Відстежуйте свою економію
                        </li>
                    </ul>
                    <img src={basketImage} alt="Ваш тижневий кошик" className="w-[360px] max-w-none h-auto -ml-[18px] block" />
                </div>

                <div className="w-[573px] flex justify-center items-center">
                    <div className="w-[380px]">
                        <h1 className="font-manrope text-[30px] font-extrabold leading-[45px] text-[#265447] mb-[8px]">
                            Створіть акаунт
                        </h1>
                        <p className="text-[14px] leading-[21px] text-[#6D8279] mb-[24px]">
                            Почніть порівнювати ціни та збирати вигідні кошики вже сьогодні.
                        </p>

                        <button className="flex items-center justify-center gap-[8px] w-full h-[44px] bg-white border border-[rgba(38,84,71,0.16)] rounded-[10px] mb-[12px] cursor-pointer font-inter text-[13px] font-semibold text-[#111827] transition-colors duration-200 hover:bg-[#F9FAFB]">
                            <img src={btngoogle} alt="Google" className="w-[20px] h-[20px]" />
                            Продовжити з Google
                        </button>
                        <button className="flex items-center justify-center gap-[8px] w-full h-[44px] bg-white border border-[rgba(38,84,71,0.16)] rounded-[10px] mb-[12px] cursor-pointer font-inter text-[13px] font-semibold text-[#111827] transition-colors duration-200 hover:bg-[#F9FAFB]">
                            <img src={btnfacebook} alt="Facebook" className="w-[20px] h-[20px]" />
                            Продовжити з Facebook
                        </button>

                        <div className="flex items-center text-[#6D8279] text-[13px] mt-[24px] mb-[24px] gap-[10px]">
                            <span className="flex-1 h-px bg-[rgba(38,84,71,0.08)]"></span>
                            <span className="shrink-0">або зареєструйтесь через email</span>
                            <span className="flex-1 h-px bg-[rgba(38,84,71,0.08)]"></span>
                        </div>

                        {/* Додано onSubmit до форми */}
                        <form className="flex flex-col" onSubmit={handleSubmit}>
                            <label className="text-[13px] font-semibold text-[#265447] mb-[8px] block">Ім'я</label>
                            <input
                                type="text"
                                placeholder="Олена"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={registerMutation.isPending}
                                className="w-full h-[44px] border border-[rgba(38,84,71,0.16)] rounded-[10px] px-[16px] mb-[16px] bg-white font-inter text-[14px] text-[#111827] outline-none transition-colors duration-200 focus:border-[#265447]"
                            />

                            <label className="text-[13px] font-semibold text-[#265447] mb-[8px] block">Email</label>
                            <input
                                type="email"
                                placeholder="smarket@gmail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={registerMutation.isPending}
                                className="w-full h-[44px] border border-[rgba(38,84,71,0.16)] rounded-[10px] px-[16px] mb-[16px] bg-white font-inter text-[14px] text-[#111827] outline-none transition-colors duration-200 focus:border-[#265447]"
                            />

                            <label className="text-[13px] font-semibold text-[#265447] mb-[8px] block">Пароль</label>
                            <div className="relative mb-[16px]">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Створіть пароль"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={registerMutation.isPending}
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

                            <label className="text-[13px] font-semibold text-[#265447] mb-[8px] block">Підтвердьте пароль</label>
                            <div className="relative mb-[16px]">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="Повторіть пароль"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={registerMutation.isPending}
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

                            {/* Блок виведення помилок: локальних або з сервера */}
                            {(validationError || registerMutation.isError) && (
                                <div className="mb-[16px] text-red-500 text-[13px] font-medium">
                                    {validationError || registerMutation.error?.message}
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={registerMutation.isPending}
                                className="w-full h-[46px] mt-[8px] bg-[#265447] text-white rounded-[10px] border-none cursor-pointer font-inter text-[14px] font-bold transition-colors duration-200 hover:bg-[#1A3E2F] disabled:opacity-50"
                            >
                                {registerMutation.isPending ? 'Завантаження...' : 'Зареєструватися'}
                            </button>

                            <p className="text-center text-[14px] mt-[24px] text-[#6B7280]">
                                Вже маєте акаунт? <a href="/auth" className="text-[#265447] font-semibold no-underline hover:underline">Увійти</a>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}