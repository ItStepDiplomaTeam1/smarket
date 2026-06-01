import step1 from '../../../shared/assets/div.step-number1.svg';
import step2 from '../../../shared/assets/div.step-number2.svg';
import step3 from '../../../shared/assets/div.step-number3.svg';
import hwsVisual from '../../../shared/assets/div.hiw-visual.svg';

export function Hws() {
  return (
    <section className="w-full bg-white py-[96px]">
      <div className="w-full max-w-[1228px] mx-auto px-[20px] flex justify-between items-center gap-[96px]">

        {/* LEFT — text */}
        <div className="flex-1 flex flex-col">
          
          {/* Eyebrow */}
          <span className="font-inter text-[12px] font-bold text-[#265447] tracking-[0.1em] uppercase bg-[#EAF7F2] px-[12px] pt-[3px] pb-[4.44px] rounded-[6px] inline-block self-start mb-[24px]">
            ЯК ЦЕ ПРАЦЮЄ
          </span>

          <h2 className="font-manrope text-[40px] font-extrabold text-[#173B33] leading-[1.2] m-0 mb-[16px]">
            Порівняйте не один <br /> товар, а всю корзину
          </h2>

          <p className="font-inter text-[16px] text-[#6D8279] leading-[1.5] m-0 mb-[48px]">
            Звичайні сайти показують окремі акції. Smarket <br /> допомагає скласти повний список покупок і побачити, де <br /> загальна сума буде найменшою.
          </p>

          {/* Steps */}
          <div className="flex flex-col gap-[32px]">
            
            <div className="flex items-start gap-[16px]">
              <img src={step1} alt="1" className="w-[32px] h-[32px] shrink-0 block" />
              <div className="flex flex-col gap-[6px]">
                <h3 className="font-inter text-[16px] font-bold text-[#173B33] m-0">Додайте товари</h3>
                <p className="font-inter text-[14px] text-[#173B33] leading-[1.5] m-0">
                  Зберіть список покупок для дому, події або закупівлі на <br /> тиждень.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-[16px]">
              <img src={step2} alt="2" className="w-[32px] h-[32px] shrink-0 block" />
              <div className="flex flex-col gap-[6px]">
                <h3 className="font-inter text-[16px] font-bold text-[#173B33] m-0">Порівняйте магазини</h3>
                <p className="font-inter text-[14px] text-[#173B33] leading-[1.5] m-0">
                  Smarket рахує суму корзини в різних супермаркетах.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-[16px]">
              <img src={step3} alt="3" className="w-[32px] h-[32px] shrink-0 block" />
              <div className="flex flex-col gap-[6px]">
                <h3 className="font-inter text-[16px] font-bold text-[#173B33] m-0">Оберіть вигідний варіант</h3>
                <p className="font-inter text-[14px] text-[#173B33] leading-[1.5] m-0">
                  Дивіться економію, акції та магазини поруч.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT — the comparison widget visual */}
        <div className="flex-1 flex justify-end">
          <img src={hwsVisual} alt="Порівняння корзини" className="max-w-[542px] h-[395px] block" />
        </div>

      </div>
    </section>
  );
}
