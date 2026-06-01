export function FinalCTA() {
  return (
    /* Screenshot: section sits on #F6FAF8 bg, the dark card is full-width inside */
    <section className="w-full bg-[#F6FAF8] py-[64px] px-6">
      <div className="max-w-[1180px] mx-auto bg-[#173B33] rounded-3xl py-[72px] px-8 flex flex-col items-center text-center">

        <h2 className="font-manrope text-[36px] font-extrabold text-white m-0 mb-4 leading-[1.2]">
          Готові зібрати вигідний кошик?
        </h2>

        <p className="font-inter text-[15px] text-[#9CA3AF] leading-[1.7] m-0 mb-10 max-w-[400px]">
          Додайте товари у список і дізнайтесь, де вся покупка буде дешевшою.
        </p>

        <div className="flex flex-col items-center gap-4">
          {/* CTA button — yellow, matching screenshot exactly */}
          <button className="bg-[#FACC14] text-[#173B33] font-manrope text-[15px] font-semibold w-[168px] h-12 rounded-[10px] border-none cursor-pointer flex justify-center items-center transition-all duration-200 hover:bg-[#F59E0B] hover:-translate-y-0.5">
            Створити кошик
          </button>
          <a
            href="#"
            className="font-inter text-[13px] text-[#6FE3C2] no-underline transition-colors duration-200 hover:text-white"
          >
            Переглянути акції →
          </a>
        </div>

      </div>
    </section>
  );
}