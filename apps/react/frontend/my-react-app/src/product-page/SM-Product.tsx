import zagluska from '../assets/Vectorbuttle.svg';

const SmCard = () => (
    <div className="w-[271px] h-[489px] shrink-0 bg-white border border-[rgba(38,84,71,0.08)] rounded-2xl p-4 flex flex-col box-border">
        <div className="w-full h-[339px] bg-[#F6FAF8] rounded-[10px] flex justify-center items-center mb-4">
            <img src={zagluska} alt="Молоко Яготинське" className="max-w-[80%] max-h-[80%] object-contain" />
        </div>
        <h3 className="font-manrope text-sm font-extralight text-[#173B33] leading-[1.4] m-0 mb-2 overflow-hidden">
            Молоко Яготинське пряжене 2,6% 870г
        </h3>
        <span className="font-inter text-xs text-[#6D8279] font-normal mb-4">870 г</span>
        <div className="mt-auto flex justify-between items-center">
            <span className="font-manrope text-base font-extralight text-[#265447]">74.99 ₴</span>
            <button className="w-[92px] h-[26px] rounded-[10px] bg-white border border-[rgba(38,84,71,0.16)] flex justify-center items-center cursor-pointer font-inter text-[13px] font-semibold text-[#265447] transition-colors duration-200 hover:bg-[#F6FAF8]">
                Порівняти
            </button>
        </div>
    </div>
);

export function SMProduct() {
    return (
        <section className="pb-10">
            <div className="max-w-[1228px] mx-auto px-6">
                <h2 className="font-manrope text-2xl font-extralight text-[#173B33] leading-[31.2px] mb-6">Схожі товари</h2>
                <div className="flex gap-6 overflow-x-auto pb-4">
                    <SmCard />
                    <SmCard />
                    <SmCard />
                    <SmCard />
                </div>
            </div>
        </section>
    );
}