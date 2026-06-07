import checkIcon from '@/shared/assets/checkgreen.svg';
import logo from '@/shared/assets/logo.svg';
import basketImage from '@/shared/assets/logindefault.svg';
import strela from '@/shared/assets/strela.svg';

export function ForgotPass() {
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
                            Відновлення паролю
                        </h1>
                        <p className="text-[14px] leading-[21px] text-[#6B7280] mb-[24px] text-left">
                            Введіть email, пов'язаний з вашим акаунтом.Ми надішлемо <br /> вам інструкції для створення нового <br /> паролю.
                        </p>

                        <form className="flex flex-col">
                            <label className="text-[13px] font-semibold text-[#265447] mb-[8px] block">Email</label>
                            <input
                                type="email"
                                placeholder="smarket@gmail.com"
                                className="w-full h-[44px] border border-[rgba(38,84,71,0.16)] rounded-[10px] px-[16px] mb-[24px] bg-white font-inter text-[14px] text-[#265447] placeholder:text-[#D1D5DB] placeholder:opacity-100 outline-none transition-colors duration-200 focus:border-[#265447]"
                            />

                            <button className="w-full h-[46px] bg-[#265447] text-white rounded-[10px] border-none cursor-pointer font-inter text-[14px] font-bold transition-colors duration-200 mb-[16px] hover:bg-[#1A3E2F]">
                                ВІДПРАВИТИ ПОСИЛАННЯ
                            </button>

                            <p className="text-center text-[14px] mt-[24px] text-[#6B7280]">
                                Згадали пароль?{' '}
                                <a href="/auth" className="text-[#265447] font-semibold no-underline hover:underline">
                                    Увійти
                                </a>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}
