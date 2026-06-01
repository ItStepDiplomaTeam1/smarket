import goldstar from '../assets/gold-star.svg';
import zero_star from '../assets/star-for-review.svg';

const ReviewStars = ({ filled }: { filled: number }) => (
    <div className="flex gap-0.5">
        {[0,1,2,3,4].map(i => (
            <img key={i} src={i < filled ? goldstar : zero_star} alt="star" className="w-3 h-3" />
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
        <section className="w-full max-w-[1180px] mx-auto mb-10 py-8 font-inter">

            <h2 className="font-manrope font-extralight text-2xl leading-[31.2px] text-[#173B33] mb-6">
                Відгуки покупців
            </h2>

            {/* Overall rating card */}
            <div className="flex items-center bg-white border border-[rgba(38,84,71,0.08)] rounded-2xl p-6 mb-6">
                <div className="font-manrope font-extralight text-[32px] leading-[48px] text-[#265447] mr-4">4.8</div>
                <div className="flex flex-col gap-1">
                    <div className="flex gap-1">
                        {[0,1,2,3,4].map(i => (
                            <img key={i} src={goldstar} alt="star" className="w-4 h-4" />
                        ))}
                    </div>
                    <div className="font-inter font-normal text-sm leading-[21px] text-[#6D8279]">На основі 128 відгуків</div>
                </div>
                <span className="inline-flex items-center justify-center h-[26px] px-3 bg-[#EAF7F2] rounded-2xl ml-8 font-inter font-semibold text-xs leading-[18px] text-[#265447]">
                    Покупці рекомендують цей товар
                </span>
            </div>

            {/* Review cards */}
            <div className="flex flex-col gap-4 mb-8">
                {reviews.map(({ name, date, stars, text }) => (
                    <div key={name} className="border border-[rgba(38,84,71,0.08)] rounded-2xl p-6 bg-white">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex flex-col gap-1">
                                <span className="font-inter font-semibold text-base leading-6 text-[#265447]">{name}</span>
                                <ReviewStars filled={stars} />
                            </div>
                            <span className="font-inter font-normal text-[13px] leading-[19.5px] text-[#6D8279]">{date}</span>
                        </div>
                        <p className="font-inter font-normal text-base leading-6 text-[#6D8279] m-0">{text}</p>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4">
                <button className="w-[181px] h-[46px] flex justify-center items-center bg-white border border-[rgba(38,84,71,0.16)] rounded-[10px] font-inter font-semibold text-sm text-[#265447] cursor-pointer transition-colors duration-200 hover:bg-[#F9FAFB]">
                    Написати відгук
                </button>
                <span className="font-inter font-normal text-sm leading-[21px] text-[#6D8279]">
                    Увійдіть в акаунт, щоб залишити відгук після покупки.
                </span>
            </div>

        </section>
    );
}