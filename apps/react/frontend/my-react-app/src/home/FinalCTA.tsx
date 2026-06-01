export function FinalCTA() {
  return (
    <section className="w-full bg-white py-[80px] px-[20px]">
      <div className="max-w-[1180px] mx-auto bg-[#173B33] rounded-[24px] py-[72px] px-[24px] flex flex-col items-center text-center">

        <h2 className="font-manrope text-[40px] font-extrabold text-white m-0 mb-[16px]">
          Готові зібрати вигідний кошик?
        </h2>

        <p className="font-inter text-[16px] text-[#D1D5DB] leading-[1.5] m-0 mb-[40px]">
          Додайте товари у список і дізнайтесь, де вся <br /> покупка буде дешевшою.
        </p>

        <div className="flex flex-col items-center gap-[20px]">
          {/* Кнопка с правильными размерами и ховером из CSS */}
          <button className="bg-[#FACC14] text-[#173B33] font-manrope text-[16px] font-semibold w-[154px] h-[48px] rounded-[10px] flex justify-center items-center transition-all duration-200 hover:bg-[#e9ba2e] hover:-translate-y-[2px]">
            Створити кошик
          </button>
          
          <a
            href="#"
            className="font-inter text-[14px] text-[#6FE3C2] no-underline transition-all duration-200 hover:text-white hover:underline"
          >
            Переглянути акції →
          </a>
        </div>

      </div>
    </section>
  );
}