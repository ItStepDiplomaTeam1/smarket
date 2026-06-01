import zagluska from '../assets/products-zaglushka.svg';

const FbtCard = () => (
    <div className="w-[175px] h-[296px] shrink-0 bg-white border border-[rgba(38,84,71,0.08)] rounded-2xl p-4 flex flex-col box-border">
        <div className="w-full h-[141px] bg-[#F6FAF8] rounded-[10px] flex justify-center items-center mb-4">
            <img src={zagluska} alt="Сметана" className="w-full h-full object-contain" />
        </div>
        <h3 className="font-manrope text-sm font-normal text-[#173B33] leading-[1.4] m-0 mb-1 overflow-hidden">
            Сметана Яготинська 20%...
        </h3>
        <span className="font-inter text-xs text-[#6D8279] font-normal mb-4">350 г</span>
        <div className="mt-auto flex justify-between items-center">
            <span className="font-manrope text-base font-bold text-[#265447]">76.99 ₴</span>
            <button className="w-8 h-8 rounded-[6px] bg-[#EAF7F2] border-none flex justify-center items-center cursor-pointer transition-colors duration-200 hover:bg-[#F6FAF8]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 3.33331V12.6666" stroke="#265447" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3.33337 8H12.6667" stroke="#265447" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
        </div>
    </div>
);

export function FBT() {
    return (
        <section className="pb-10">
            <div className="max-w-[1228px] mx-auto px-6">
                <h2 className="font-manrope text-2xl font-extralight text-[#173B33] mb-6">З цим товаром також купують</h2>
                <div className="flex gap-6 overflow-x-auto pb-4">
                    <FbtCard />
                    <FbtCard />
                    <FbtCard />
                    <FbtCard />
                    <FbtCard />
                    <FbtCard />
                </div>
            </div>
        </section>
    );
}