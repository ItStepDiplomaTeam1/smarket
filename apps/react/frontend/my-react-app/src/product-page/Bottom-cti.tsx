export function BottomCti() {
  return (
    <section>
      <div className="max-w-[1228px] mx-auto px-6">
        <div className="bg-[#EAF7F2] rounded-3xl py-10 px-6 flex flex-col items-center text-center">

          <h2 className="font-manrope text-2xl font-extralight text-[#173B33] leading-[31.2px] m-0 mb-2">
            Додайте товар у кошик і порівняйте ціни
          </h2>

          <p className="font-inter text-base font-normal text-[#6D8279] leading-6 m-0 mb-6">
            Smarket покаже, у якому магазині ваш список покупок буде дешевшим.
          </p>

          <button className="w-[197px] h-11 bg-[#265447] text-white rounded-[10px] border-none flex justify-center items-center cursor-pointer font-inter text-base font-semibold transition-colors duration-200 active:scale-[0.98] hover:bg-[#1a3e34]">
            Додати до кошика
          </button>

        </div>
      </div>
    </section>
  );
}