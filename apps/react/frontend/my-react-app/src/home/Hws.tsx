import step1 from '../assets/div.step-number1.svg';
import step2 from '../assets/div.step-number2.svg';
import step3 from '../assets/div.step-number3.svg';
import hwsVisual from '../assets/div.hiw-visual.svg';

export function Hws() {
  return (
    /* Screenshot: light greenish-white background, NOT white */
    <section className="w-full py-[80px] bg-[#F6FAF8]">
      <div className="w-full max-w-[1228px] mx-auto px-6 flex justify-between items-center gap-16">

        {/* LEFT — text */}
        <div className="flex-1 flex flex-col max-w-[520px]">
          {/* Eyebrow */}
          <span className="font-inter text-[11px] font-bold text-[#265447] tracking-[0.08em] uppercase bg-[#EAF7F2] px-3 py-[3px] rounded-[6px] inline-block self-start mb-5">
            ЯК ЦЕ ПРАЦЮЄ
          </span>

          <h2 className="font-manrope text-[36px] font-extrabold text-[#173B33] leading-[1.2] m-0 mb-4">
            Порівняйте не один товар, а всю корзину
          </h2>

          <p className="font-inter text-[15px] text-[#6D8279] leading-[1.7] m-0 mb-10">
            Звичайні сайти показують окремі акції. Smarket допомагає скласти повний список покупок і побачити, де загальна сума буде найменшою.
          </p>

          {/* Steps */}
          <div className="flex flex-col gap-7">
            <div className="flex items-start gap-4">
              <img src={step1} alt="1" className="w-8 h-8 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <h3 className="font-inter text-[15px] font-semibold text-[#173B33] m-0">Додайте товари</h3>
                <p className="font-inter text-[14px] text-[#6D8279] leading-[1.6] m-0">
                  Зберіть список покупок для дому, події або закупівлі на тиждень.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <img src={step2} alt="2" className="w-8 h-8 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <h3 className="font-inter text-[15px] font-semibold text-[#173B33] m-0">Порівняйте магазини</h3>
                <p className="font-inter text-[14px] text-[#6D8279] leading-[1.6] m-0">
                  Smarket рахує суму корзини в різних супермаркетах.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <img src={step3} alt="3" className="w-8 h-8 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <h3 className="font-inter text-[15px] font-semibold text-[#173B33] m-0">Оберіть вигідний варіант</h3>
                <p className="font-inter text-[14px] text-[#6D8279] leading-[1.6] m-0">
                  Дивіться економію, акції та магазини поруч.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — the comparison widget visual */}
        <div className="flex-1 flex justify-end items-center">
          {/* Screenshot shows the visual inside a white card with shadow */}
          <div className="bg-white rounded-3xl shadow-[0px_18px_48px_rgba(23,59,51,0.10)] border border-[rgba(38,84,71,0.08)] p-6 w-full max-w-[480px]">
            <img src={hwsVisual} alt="Порівняння корзини" className="w-full h-auto block" />
          </div>
        </div>

      </div>
    </section>
  );
}