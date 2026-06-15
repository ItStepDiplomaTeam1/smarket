import zagluska from '@/shared/assets/products-zaglushka.svg';

const FbtCard = () => (
    <div className="w-[175px] h-[296px] shrink-0 bg-white border border-[rgba(38,84,71,0.08)] rounded-[16px] p-[16px] flex flex-col box-border">
        <div className="w-full h-[141px] bg-[#F6FAF8] rounded-[10px] flex justify-center items-center mb-[16px]">
            <img 
                src={zagluska} 
                alt="Сметана" 
                className="w-[60px] h-[80px] rounded-[8px] object-cover" 
            />
        </div>
        <h3 
            className="font-manrope text-[14px] font-normal text-[#173B33] leading-[1.4] m-0 mb-[4px] overflow-hidden"
            style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical' }}
        >
            Сметана Яготинська 20%...
        </h3>
        <span className="font-inter text-[12px] text-[#6D8279] font-normal mb-[16px]">
            350 г
        </span>
        <div className="mt-auto flex justify-between items-center">
            <span className="font-manrope text-[16px] font-[200] leading-[24px] text-[#265447]">
                76.99 ₴
            </span>
            <button className="w-[32px] h-[32px] rounded-[6px] bg-[#EAF7F2] border-none flex justify-center items-center cursor-pointer transition-colors duration-200 hover:bg-[#F6FAF8]">
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
        <section className="w-full pb-[40px] bg-[#F6FAF8]">
            <div className="w-full max-w-[1228px] mx-auto px-[24px]">
                <h2 className="font-manrope text-[24px] font-[200] leading-[31.2px] text-[#173B33] m-0 mb-[24px]">
                    З цим товаром також купують
                </h2>
                <div className="flex gap-[24px] overflow-x-auto pb-[16px]">
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
