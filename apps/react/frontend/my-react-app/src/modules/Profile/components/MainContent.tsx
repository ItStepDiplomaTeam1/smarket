import React from 'react';

interface MainContentProps {
  userData?: any | null; 
}

export function MainContent({ userData }: MainContentProps) {
  const userName = userData?.firstName || 'Марино';

  const savedBaskets = [
    { label: 'Побутова хімія', store: 'Сільпо', items: 7, date: '01 червня 2026', total: '724 грн', discount: 'Економія 118 ₴' },
    { label: 'Дитячі товари', store: 'Novus', items: 9, date: '24 травня 2026', total: '1390 грн', discount: 'Економія 265 ₴' },
  ];

  const favoriteProducts = [
    { title: 'Молоко Яготинське пастеризоване 2,6%', category: 'Молочні продукти', price: '54.49 - 61.91 грн', rating: 4.8, views: 400 },
    { title: 'Вино Marlborough Sun Sauvignon Blanc', category: 'Алкоголь', price: '469.00 - 585.00 грн', rating: 4.9, views: 340 },
    { title: 'Напій кокосовий Vega Milk', category: 'Молочні продукти', price: '85.49 - 118.00 грн', rating: 4.7, views: 259 },
    { title: 'Віскі Monkey Shoulder, 40%, 0.7 л', category: 'Алкоголь', price: '999.00 - 1559.00 грн', rating: 4.8, views: 129 },
  ];

  const userReviews = [
    { 
      id: 1,
      title: 'Шоколад молочний Lindt Lindor 100 г', 
      date: '10 червня 2026', 
      rating: 1,
      text: 'Взагалі не сподобався, в складі на 1 місці цукор, на 2 пальмова олія, какао дуже мало, на смак одна пальма, за таку ціну взагалі не очікував що може бути такий склад. Не рекомендую',
      img: 'https://images.unsplash.com/photo-1623341214825-9f4f963727da?q=80&w=100&auto=format&fit=crop'
    },
    { 
      id: 2,
      title: 'Кава в зернах Jacobs Velvet Gold Crema 1000 г', 
      date: '5 червня 2026', 
      rating: 5, 
      text: 'Ароматна та смачна кава',
      img: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=100&auto=format&fit=crop'
    },
    { 
      id: 3,
      title: 'Набір підгузків Huggies Extra Care Box 4 (8-14 кг), 76 шт', 
      date: '28 травня 2026', 
      rating: 5, 
      text: 'Поки найкращі підгузки для моєї малечі. Рекомендуємо! Чергую з Huggies Little Movers, але з цих забули, що таке попрілості. Відчувається різниця з дешевшими варіантами.',
      img: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?q=80&w=100&auto=format&fit=crop'
    },
    { 
      id: 4,
      title: 'Чипси Pringles Sour Cream & Onion Сметана та цибуля 165 г', 
      date: '7 травня 2026', 
      rating: 4, 
      text: 'Pringles і цим все сказано. Найкращі чіпси як до пива так і просто так. Якщо вже їсть якусь гидоту, то однозначно Pringles',
      img: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd08c?q=80&w=100&auto=format&fit=crop'
    },
  ];

  const StarIcon = ({ filled }: { filled: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={filled ? "#FFB800" : "#E8E8E8"} className="shrink-0">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </svg>
  );

  const SmallStarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="#FFB800" className="shrink-0">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </svg>
  );

  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#6FE3C2" className="shrink-0">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
    </svg>
  );

  const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );

  const BreadcrumbChevron = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 mx-[2px]">
      <path d="M4.5 9L7.5 6L4.5 3" stroke="#6D8279" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <section className="w-full font-inter flex-1 min-w-0">
      <div className="max-w-[1440px] mx-auto px-[24px]">
        
        {/* Хлібні крихти та Заголовок */}
        <div className="mb-[24px]">
          <div className="flex items-center gap-[4px] font-inter text-[13px] text-[#6D8279] mb-[12px]">
            <span className="cursor-pointer hover:text-[#265447] transition-colors">Головна</span>
            <BreadcrumbChevron />
            <span className="text-[#265447] font-semibold">Особистий кабінет</span>
          </div>
          <h1 className="font-manrope text-[24px] font-[250] leading-[31.2px] text-[#173B33] m-0">Особистий кабінет</h1>
        </div>

        {/* Welcome Banner */}
        <div className="bg-white border border-[#265447]/[0.08] rounded-[16px] shadow-[0_4px_12px_rgba(23,59,51,0.06)] p-[24px] flex flex-col gap-[24px] mb-[24px]">
          <div className="flex flex-col gap-[8px]">
            <h2 className="font-manrope text-[24px] font-[800] text-[#173B33] leading-[31.2px] m-0">
              Вітаємо, {userName}! 
            </h2>
            <p className="font-inter text-[14px] font-normal text-[#6D8279] leading-[19.6px] m-0 max-w-[600px]">
              Ми допоможемо вам економити час і гроші, знаходячи <br /> найкращі ціни в улюблених  магазинах швидко і зручно.
            </p>
          </div>
          <button className="bg-[#265447] text-white font-inter text-[13px] font-bold px-[19px] h-[36px] w-fit flex items-center justify-center rounded-[10px] hover:bg-[#173B33] transition-colors leading-none">
            Редагувати профіль
          </button>
        </div>

        {/* Секція Збережені кошики та Обрані товари */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-[24px] mb-[24px] items-stretch">
          
          {/* Блок: Збережені кошики */}
          <div className="bg-white border border-[#265447]/[0.08] shadow-[0_4px_12px_rgba(23,59,51,0.06)] rounded-[16px] py-[24px] px-[24px] flex flex-col h-full">
            <h3 className="font-manrope text-[18px] font-bold text-[#173B33] m-0 mb-[8px]">Збережені кошики</h3>
            <p className="font-inter text-[12px] text-[#6D8279] m-0 mb-[24px]">
              Оберіть кошик, щоб переглянути товари та порівняти магазини.
            </p>
            
            <div className="flex flex-col gap-[16px] mb-[24px]">
              {savedBaskets.map((basket, i) => (
                <div key={i} className="flex justify-between border border-[#265447]/[0.08] rounded-[10px] p-[12px] h-[111px]">
                  <div className="flex flex-col justify-between h-full w-[203px]">
                    <h4 className="font-manrope text-[15px] font-bold text-[#173B33] m-0">{basket.label}</h4>
                    <div className="my-auto"><span className="font-inter text-[12px] text-[#6D8279]">{basket.items} товарів · {basket.date}</span></div>
                    <span className="font-inter text-[12px] font-semibold text-[#173B33]">{basket.store}</span>
                  </div>
                  <div className="flex flex-col justify-between items-end h-full">
                    <div className="h-[22px] px-[8px] bg-[#FACC14] rounded-[6px] flex items-center justify-center shrink-0">
                      <span className="font-inter text-[12px] font-bold text-[#173B33] leading-none">{basket.discount}</span>
                    </div>
                    <span className="font-manrope text-[16px] font-bold text-[#173B33]">{basket.total}</span>
                  </div>
                </div>
              ))}
            </div>

            <a href="#" className="flex items-center gap-[2px] font-inter text-[14px] font-semibold text-[#6D8279] mt-auto hover:text-[#265447] transition-colors w-full">
              Переглянути всі кошики
              <ArrowRightIcon />
            </a>
          </div>

          {/* Блок: Обрані товари */}
          <div className="bg-white border border-[#265447]/[0.08] shadow-[0_4px_12px_rgba(23,59,51,0.06)] rounded-[16px] py-[24px] px-[24px] flex flex-col h-full">
            <h3 className="font-manrope text-[18px] font-bold text-[#173B33] m-0 mb-[24px]">Обрані товари</h3>
            
            <div className="flex flex-col gap-[12px] mb-[24px]">
              {favoriteProducts.map((product, i) => (
                <div key={i} className="flex items-center justify-between w-full h-[56px]">
                  <div className="flex items-center gap-[12px] flex-1 min-w-0 pr-[16px]">
                    <div className="w-[44px] h-[56px] bg-[#F6FAF8] rounded-[5px] shrink-0 border border-[#265447]/[0.08]"></div>
                    <div className="flex flex-col justify-between h-[56px] py-[2px] min-w-0 flex-1">
                      <h4 className="font-inter text-[12px] font-medium text-[#173B33] leading-[14px] m-0 line-clamp-2 break-words">{product.title}</h4>
                      <span className="font-inter text-[10px] text-[#173B33] leading-none m-0">{product.category}</span>
                      <div className="flex items-center gap-[6px] font-inter text-[10px] text-[#6D8279] leading-none">
                        <div className="flex items-center gap-[2px]"><SmallStarIcon /><span>{product.rating}</span></div>
                        <div className="flex items-center gap-[2px]"><EyeIcon /><span>{product.views}</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="font-manrope text-[14px] font-bold text-[#173B33] text-right shrink-0 whitespace-nowrap">{product.price}</div>
                </div>
              ))}
            </div>

            <a href="#" className="flex items-center gap-[2px] font-inter text-[14px] font-semibold text-[#6D8279] mt-auto hover:text-[#265447] transition-colors w-full">
              Переглянути всі товари
              <ArrowRightIcon />
            </a>
          </div>
        </div>

        {/* Блок: Відгуки */}
        <div className="w-full bg-white border border-[#265447]/[0.08] shadow-[0_4px_12px_rgba(23,59,51,0.06)] rounded-[16px] p-[24px] flex flex-col">
          <h2 className="font-manrope text-[18px] font-bold text-[#173B33] m-0 mb-[24px]">Відгуки</h2>
          
          <div className="flex flex-col gap-[24px] mb-[24px]">
            {userReviews.map((review) => (
              <div key={review.id} className="flex items-start gap-[24px]">
                <img src={review.img} alt="Product" className="w-[44px] h-[56px] rounded-[5px] object-cover shrink-0 border border-[#265447]/[0.08]" />
                <h4 className="w-[153px] font-inter text-[13px] font-medium text-[#173B33] leading-[18px] m-0 shrink-0">{review.title}</h4>
                <div className="flex shrink-0">
                  {[1, 2, 3, 4, 5].map((star) => <StarIcon key={star} filled={star <= review.rating} />)}
                </div>
                <p className="flex-1 min-w-0 font-inter text-[13px] text-[#6D8279] leading-[20px] m-0 pr-[16px]">{review.text}</p>
                <span className="w-[110px] shrink-0 font-inter text-[13px] text-[#6D8279] text-right whitespace-nowrap">{review.date}</span>
              </div>
            ))}
          </div>

          <a href="#" className="flex items-center gap-[2px] font-inter text-[14px] font-semibold text-[#6D8279] mt-auto hover:text-[#265447] transition-colors w-full">
            Переглянути всі відгуки
            <ArrowRightIcon />
          </a>
        </div>
      </div>
    </section>
  );
}