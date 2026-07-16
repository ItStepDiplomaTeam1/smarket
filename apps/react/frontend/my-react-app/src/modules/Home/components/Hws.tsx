import step1 from '@/shared/assets/div.step-number1.svg';
import step2 from '@/shared/assets/div.step-number2.svg';
import step3 from '@/shared/assets/div.step-number3.svg';

// Імпортуємо обидві картинки для віджета
import hwsVisualLight from '@/shared/assets/div.hiw-visual.svg';
import hwsVisualDark from '@/shared/assets/div.hiw-visual-dark.svg';

export function Hws() {
  return (
    <section id="how-it-works" className="w-full bg-white dark:bg-[#0B120F] py-[60px] sm:py-[96px] transition-colors duration-300">
      <div className="w-full max-w-[1228px] mx-auto px-[20px] flex flex-col lg:flex-row justify-between items-center gap-[40px] lg:gap-[96px]">

        {/* LEFT — text */}
        <div className="flex-1 flex flex-col w-full">
          
          {/* Eyebrow */}
          <span className="font-inter text-[12px] font-bold text-[#265447] dark:text-[#3CD27D] tracking-[0.1em] uppercase bg-[#EAF7F2] dark:bg-[#152721] px-[12px] pt-[3px] pb-[4.44px] rounded-[6px] inline-block self-start mb-[20px] sm:mb-[24px] transition-colors">
            ЯК ЦЕ ПРАЦЮЄ
          </span>

          <h2 className="font-manrope text-[28px] sm:text-[40px] font-extrabold text-[#173B33] dark:text-white leading-tight m-0 mb-[16px] transition-colors">
            Порівняйте не один товар, а всю корзину
          </h2>

          <p className="font-inter text-[15px] sm:text-[16px] text-[#6D8279] dark:text-[#A4B3AF] leading-[1.5] m-0 mb-[36px] sm:mb-[48px] transition-colors">
            Звичайні сайти показують окремі акції. Smarket допомагає скласти повний список покупок і побачити, де загальна сума буде найменшою.
          </p>

          {/* Steps */}
          <div className="flex flex-col gap-[28px] sm:gap-[32px]">
            
            {[
              { id: 1, title: 'Додайте товари', desc: 'Зберіть список покупок для дому, події або закупівлі на тиждень.', img: step1 },
              { id: 2, title: 'Порівняйте магазини', desc: 'Smarket рахує суму корзини в різних супермаркетах.', img: step2 },
              { id: 3, title: 'Оберіть вигідний варіант', desc: 'Дивіться економію, акції та магазини поруч.', img: step3 },
            ].map((step) => (
              <div key={step.id} className="flex items-start gap-[16px]">
                <img src={step.img} alt={step.id.toString()} className="w-[32px] h-[32px] shrink-0 block dark:hidden" />
                <div className="hidden dark:flex w-[32px] h-[32px] rounded-full bg-[#3CD27D] items-center justify-center text-[#0B120F] font-bold text-[15px] shrink-0">
                  {step.id}
                </div>
                <div className="flex flex-col gap-[4px]">
                  <h3 className="font-inter text-[16px] font-bold text-[#173B33] dark:text-white m-0 transition-colors">
                    {step.title}
                  </h3>
                  <p className="font-inter text-[14px] text-[#6D8279] dark:text-[#A4B3AF] leading-[1.5] m-0 transition-colors">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}

          </div>
        </div>

        {/* RIGHT — the comparison widget visual */}
        <div className="flex-1 flex justify-center md:justify-end w-full relative">
          {/* Світла версія */}
          <img 
            src={hwsVisualLight} 
            alt="Порівняння корзини" 
            className="w-full max-w-[542px] h-auto block dark:hidden transition-opacity" 
          />
          {/* Темна версія */}
          <img 
            src={hwsVisualDark} 
            alt="Порівняння корзини темне" 
            className="w-full max-w-[542px] h-auto hidden dark:block transition-opacity" 
          />
        </div>

      </div>
    </section>
  );
}