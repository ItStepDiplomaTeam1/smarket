// src/pages/Auth/index.tsx
import btngoogle from '@/shared/assets/google.svg';
import btnfacebook from '@/shared/assets/facebook.svg';
import checkIcon from '@/shared/assets/checkgreen.svg';
import logo from '@/shared/assets/logo.svg';
import basketImage from '@/shared/assets/logindefault.svg';
import strela from '@/shared/assets/strela.svg';

// Імпортуємо наш розумний компонент з модуля
import { LoginForm } from '@/modules/Auth';

export default function AuthPage() {
    return (
        <section className="relative flex justify-center items-center w-full min-h-screen bg-[#F6FAF8] font-inter p-[40px]">
            {/* Back link */}
            <a
                href="/"
                className="absolute top-[24px] right-[40px] flex items-center gap-[8px] text-[14px] font-semibold text-[#265447] no-underline leading-[21px] hover:underline"
            >
                <img src={strela} alt="Back" className="w-[16px] h-[16px]" />
                На головну сторінку
            </a>

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
                            <img src={checkIcon} alt="check" className="w-[20px] h-[20px] shrink-0" /> Зберігайте списки покупок
                        </li>
                        <li className="flex items-center gap-[12px] mb-[12px] text-[14px] font-medium">
                            <img src={checkIcon} alt="check" className="w-[20px] h-[20px] shrink-0" /> Порівнюйте ціни між магазинами
                        </li>
                        <li className="flex items-center gap-[12px] text-[14px] font-medium">
                            <img src={checkIcon} alt="check" className="w-[20px] h-[20px] shrink-0" /> Відстежуйте свою економію
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
                        <button className="flex items-center justify-center gap-[8px] w-full h-[44px] bg-white border border-[rgba(38,84,71,0.16)] rounded-[10px] mb-[12px] cursor-pointer font-inter text-[13px] font-semibold text-[#265447] transition-colors duration-200 hover:bg-[#F9FAFB]">
                            <img src={btngoogle} alt="Google" className="w-[20px] h-[20px]" />
                            Продовжити з Google
                        </button>
                        <button className="flex items-center justify-center gap-[8px] w-full h-[44px] bg-white border border-[rgba(38,84,71,0.16)] rounded-[10px] mb-[12px] cursor-pointer font-inter text-[13px] font-semibold text-[#265447] transition-colors duration-200 hover:bg-[#F9FAFB]">
                            <img src={btnfacebook} alt="Facebook" className="w-[20px] h-[20px]" />
                            Продовжити з Facebook
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
        </section>
    );
}