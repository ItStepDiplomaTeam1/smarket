import btngoogle from '@/shared/assets/google.svg';
import btnfacebook from '@/shared/assets/facebook.svg';
import checkIcon from '@/shared/assets/checkgreen.svg';
import logo from '@/shared/assets/logo.svg';
import basketImage from '@/shared/assets/logindefault.svg';

import { LoginForm } from '@/modules/Auth';
import { Header } from '@/shared/ui/Header';
import { Footer } from '@/shared/ui/Footer';
import { useGoogleLogin } from '@react-oauth/google';
import { useGoogleOAuth } from '@/hooks/api/useAuthApi';

export default function AuthPage() {
    const googleOAuthMutation = useGoogleOAuth();

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: (tokenResponse) => {
            googleOAuthMutation.mutate(tokenResponse.access_token);
        },
        flow: 'implicit',
    });
    return (
        <section className="flex flex-col w-full min-h-screen bg-[#F6FAF8] font-inter">
            <Header />
            <div className="flex flex-1 justify-center items-center p-[40px]">

            {/* MAIN CARD */}
            <div className="flex w-[1040px] h-[858.5px] bg-white rounded-[24px] border border-[rgba(38,84,71,0.08)] shadow-[0px_18px_48px_rgba(23,59,51,0.12)] overflow-hidden shrink-0">
                
                {/* ЛІВА ПАНЕЛЬ */}
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

                    <img 
                        src={basketImage} 
                        alt="Ваш тижневий кошик" 
                        className="w-[360px] max-w-none h-auto -ml-[18px] block" 
                    />
                </div>

                {/* ПРАВА ПАНЕЛЬ */}
                <div className="w-[573px] flex justify-center items-center h-full">
                    <div className="w-[380px] m-0 flex flex-col">
                        <h1 className="font-manrope text-[30px] font-extrabold leading-[45px] text-[#265447] mb-[8px] text-left">
                            Увійти в акаунт
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
                            id="btn-google-login"
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
                        <div className="flex items-center text-[#6D8279] text-[13px] mt-[24px] mb-[24px] gap-[10px]">
                            <span className="flex-1 h-px bg-[rgba(38,84,71,0.08)]"></span>
                            <span className="shrink-0">або увійти через email</span>
                            <span className="flex-1 h-px bg-[rgba(38,84,71,0.08)]"></span>
                        </div>

                        {/* ВСТАВЛЯЄМО НАШ РОЗУМНИЙ КОМПОНЕНТ ФОРМИ */}
                        <LoginForm />
                        
                    </div>
                </div>
            </div>
            </div>
            <Footer />
        </section>
    );
}