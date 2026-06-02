import goldstar from '../../../shared/assets/gold-star.svg';
import zero_star from '../../../shared/assets/star-for-review.svg';

const ReviewStars = ({ filled }: { filled: number }) => (
    <div className="flex gap-[2px]">
        {[0, 1, 2, 3, 4].map(i => (
            <img key={i} src={i < filled ? goldstar : zero_star} alt="star" className="w-[12px] h-[12px]" />
        ))}
    </div>
);

const reviews = [
    { name: 'Марина', date: '06 червня 2026', stars: 5, text: 'Хороше молоко на кожен день. Часто додаю його у свій тижневий кошик.' },
    { name: 'Олег',   date: '02 червня 2026', stars: 5, text: 'Зручно бачити, де це молоко дешевше. Ціна між магазинами реально відрізняється.' },
    { name: 'Ірина',  date: '28 травня 2026', stars: 4, text: 'Якість хороша, але важливо перевіряти наявність у конкретному магазині.' },
];

export function Reviews() {
    return (
        <section className="w-full bg-[#F6FAF8] font-inter">
            <div className="w-full max-w-[1180px] mx-auto pt-[32px] pb-[40px] px-[24px]">
                
                <h2 className="font-manrope font-[200] text-[24px] leading-[31.2px] text-[#173B33] m-0 mb-[24px]">
                    Відгуки покупців
                </h2>

                {/* Картка загального рейтингу */}
                <div className="flex items-center bg-white border border-[rgba(38,84,71,0.08)] rounded-[16px] p-[24px] mb-[24px]">
                    <div className="font-manrope font-[200] text-[32px] leading-[48px] text-[#265447] mr-[16px]">4.8</div>
                    <div className="flex flex-col gap-[4px]">
                        <div className="flex gap-[4px]">
                            {[0, 1, 2, 3, 4].map(i => (
                                <img key={i} src={goldstar} alt="star" className="w-[16px] h-[16px]" />
                            ))}
                        </div>
                        <div className="font-inter font-normal text-[14px] leading-[21px] text-[#6D8279]">На основі 128 відгуків</div>
                    </div>
                    <span className="inline-flex items-center justify-center h-[26px] px-[12px] bg-[#EAF7F2] rounded-[16px] ml-[32px] font-inter font-semibold text-[12px] leading-[18px] text-[#265447]">
                        Покупці рекомендують цей товар
                    </span>
                </div>

                {/* Картки відгуків */}
                <div className="flex flex-col gap-[16px] mb-[32px]">
                    {reviews.map(({ name, date, stars, text }) => (
                        <div key={name} className="border border-[rgba(38,84,71,0.08)] rounded-[16px] p-[24px] bg-white">
                            <div className="flex justify-between items-start mb-[12px]">
                                <div className="flex flex-col gap-[4px]">
                                    <span className="font-inter font-semibold text-[16px] leading-[24px] text-[#265447] m-0">{name}</span>
                                    <ReviewStars filled={stars} />
                                </div>
                                <span className="font-inter font-normal text-[13px] leading-[19.5px] text-[#6D8279]">{date}</span>
                            </div>
                            <p className="font-inter font-normal text-[16px] leading-[24px] text-[#6D8279] m-0">{text}</p>
                        </div>
                    ))}
                </div>

                {/* Футер */}
                <div className="flex items-center gap-[16px]">
                    <button className="w-[181px] h-[46px] flex justify-center items-center bg-white border border-[rgba(38,84,71,0.16)] rounded-[10px] font-inter font-semibold text-[14px] text-[#265447] cursor-pointer transition-colors duration-200 hover:bg-[#F9FAFB]">
                        Написати відгук
                    </button>
                    <span className="font-inter font-normal text-[14px] leading-[21px] text-[#6D8279]">
                        Увійдіть в акаунт, щоб залишити відгук після покупки.
                    </span>
                </div>

            </div>
        </section>
    );
}
