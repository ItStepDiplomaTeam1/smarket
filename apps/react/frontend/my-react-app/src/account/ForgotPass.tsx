import checkIcon from '../assets/checkgreen.svg';
import logo from '../assets/logo.svg';
import basketImage from '../assets/logindefault.svg';
import strela from '../assets/strela.svg';

export function ForgotPass() {
    return (
        <section className="relative flex justify-center items-center w-full min-h-screen bg-[#F6FAF8] font-inter p-10">

            {/* Back link */}
            <a
                href="/"
                className="absolute top-6 right-10 flex items-center gap-2 text-sm font-semibold text-[#265447] no-underline leading-[21px] hover:underline"
            >
                <img src={strela} alt="Back" className="w-4 h-4" />
                На головну сторінку
            </a>

            <div className="flex w-[1040px] h-[858.5px] bg-white rounded-3xl border border-[rgba(38,84,71,0.08)] shadow-[0px_18px_48px_rgba(23,59,51,0.12)] overflow-hidden shrink-0">

                {/* LEFT PANEL — flex col so basket sits at bottom */}
                <div className="w-[467px] shrink-0 bg-gradient-to-b from-[#EAF7F2] to-[#F6FAF8] p-12 flex flex-col text-[#173B33]">
                    <img src={logo} alt="Smarket Logo" className="w-32 mb-8" />

                    <h2 className="font-manrope text-[32px] font-bold leading-10 mb-4">
                        Купуйте розумніше. <br /> Заощаджуйте <br /> більше.
                    </h2>
                    <p className="text-sm leading-[21px] text-[#6D8279] mb-6">
                        Створіть акаунт, щоб зберігати кошики,<br /> порівнювати ціни між магазинами та бачити, де покупка буде дешевшою.
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

                    {/* mt-auto pushes basket to bottom of the flex-col panel */}
                    <img src={basketImage} alt="Basket" className="w-[320px] h-[177px] object-cover rounded-2xl mt-auto" />
                </div>

                {/* RIGHT PANEL */}
                <div className="w-[573px] flex justify-center items-center">
                    <div className="w-[380px] flex flex-col">
                        <h1 className="font-manrope text-[30px] font-extrabold leading-[45px] text-[#265447] mb-2">
                            Відновлення паролю
                        </h1>
                        <p className="text-sm leading-[21px] text-[#6B7280] mb-6">
                            Введіть email, пов'язаний з вашим акаунтом. <br /> Ми надішлемо вам інструкції для створення <br /> нового паролю.
                        </p>

                        <form className="flex flex-col">
                            <label className="text-[13px] font-semibold text-[#265447] mb-2 block">Email</label>
                            <input
                                type="email"
                                placeholder="smarket@gmail.com"
                                className="w-full h-11 border border-[rgba(38,84,71,0.16)] rounded-[10px] px-4 mb-6 bg-white font-inter text-sm text-[#265447] placeholder:text-[#D1D5DB] outline-none transition-colors duration-200 focus:border-[#265447]"
                            />

                            <button className="w-full h-[46px] bg-[#265447] text-white rounded-[10px] border-none cursor-pointer font-inter text-sm font-bold transition-colors duration-200 mb-4 hover:bg-[#1A3E2F]">
                                ВІДПРАВИТИ ПОСИЛАННЯ
                            </button>

                            <p className="text-center text-sm mt-6 text-[#6B7280]">
                                Згадали пароль?{' '}
                                <a href="#" className="text-[#265447] font-semibold no-underline hover:underline">
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