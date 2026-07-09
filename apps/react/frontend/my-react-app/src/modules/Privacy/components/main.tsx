import { useState } from 'react';

export function PersonalDataPage() {
  const policyItems = [
    {
      id: 1,
      title: "Загальні положення",
      intro: "Це Положення про обробку персональних даних визначає порядок збору, використання та захисту інформації користувачів сервісу Smarket.",
      subIntro: "Основні принципи, якими ми керуємося при обробці інформації:",
      bullets: [
        "законність, прозорість та відкритість для користувача;",
        "обмеження збору даних — ми беремо лише те, що критично необхідно для роботи сервісу;",
        "точність та актуальність інформації;",
        "обмеження термінів зберігання даних;",
        "забезпечення цілісності та конфіденційності."
      ],
      outro: "Використовуючи Smarket, ви повністю погоджуєтеся з умовами цього Положення та надаєте згоду на обробку вказаних даних."
    },
    {
      id: 2,
      title: "Які дані ми обробляємо",
      intro: "Smarket може обробляти дані, які користувач надає самостійно або які автоматично формуються під час використання платформи.",
      subIntro: "До таких даних належать наступні категорії:",
      bullets: [
        "особисті ідентифікатори: ім'я користувача, діючий email або номер телефону;",
        "географічні дані: місто та район для коректного пошуку найближчих магазинів;",
        "користувацький контент: створені кошики, збережені списки покупок, обрані товари;",
        "технічні логі: IP-адреса, тип і версія браузера, операційна система;",
        "файли cookie для збереження індивідуальних налаштувань інтерфейсу."
      ],
      outro: "Зверніть увагу: Smarket ніколи не збирає і не обробляє чутливі дані, такі як біометрична інформація або номери банківських карт."
    },
    {
      id: 3,
      title: "Мета обробки даних",
      intro: "Усі зібрані персональні дані використовуються виключно для забезпечення стабільної роботи сервісу Smarket та покращення досвіду користувачів.",
      subIntro: "Обробка даних здійснюється з такою метою:",
      bullets: [
        "успішна автентифікація та надання доступу до особистого профілю;",
        "персоналізація відображення актуальних цін у супермаркетах вашого міста;",
        "синхронізація списків покупок та кошиків між різними пристроями користувача;",
        "аналіз популярності товарів та оптимізація алгоритмів внутрішнього пошуку;",
        "надсилання технічних сповіщень щодо функціоналу платформи або оновлень."
      ],
      outro: "Обробка інформації для будь-яких маркетингових чи рекламних цілей відбувається виключно за вашою окремою згодою."
    },
    {
      id: 4,
      title: "Зберігання та захист даних",
      intro: "Персональні дані користувачів зберігаються протягом усього часу активності вашого облікового запису на сервісі Smarket.",
      subIntro: "Для забезпечення максимальної безпеки ми впроваджуємо такі заходи:",
      bullets: [
        "повне шифрування даних під час їх передачі (протоколи SSL/TLS);",
        "суворе обмеження доступу співробітників компанії до внутрішніх баз даних;",
        "регулярне автоматичне резервне копіювання інформації для запобігання її втраті;",
        "постійний моніторинг систем на предмет вразливостей або підозрілої активності."
      ],
      outro: "У разі видалення акаунту всі ваші персональні дані безповоротно та повністю стираються з наших серверів протягом 30 днів."
    },
    {
      id: 5,
      title: "Права користувача",
      intro: "Кожен користувач має повний контроль над своїми персональними даними згідно з чинним законодавством України.",
      subIntro: "Ви маєте законне право на:",
      bullets: [
        "доступ до своїх даних та отримання детальної інформації про методи їх обробки;",
        "швидке виправлення або оновлення застарілої інформації через особистий кабінет;",
        "видалення всіх даних (право бути забутим) шляхом повного видалення облікового запису;",
        "обмеження обробки або відкликання раніше наданої згоди на обробку окремих категорій даних."
      ],
      outro: "Для реалізації будь-якого з цих прав ви можете скористатися налаштуваннями профілю або написати напряму на нашу пошту підтримки."
    }
  ];

  const [expandedId, setExpandedId] = useState<number | null>(1);

  const toggleSection = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="w-full bg-[#F8FAF9] dark:bg-[#0B120F] min-h-screen font-inter antialiased py-[32px] md:py-10 transition-colors duration-300">
      <div className="max-w-[1230px] mx-auto px-[16px] md:px-4 flex flex-col md:flex-row gap-[24px] md:gap-[30px] relative">
        
        {/* ЛІВА КОЛОНКА — ЗМІСТ */}
        <aside className="w-full md:w-[280px] lg:w-[307px] shrink-0 flex flex-col gap-[16px] md:gap-6 md:sticky md:top-24 h-fit z-10">
          <div className="bg-white dark:bg-transparent border border-[#E9ECEB] dark:border-[#1F3227] rounded-[16px] p-[20px] lg:p-6 flex flex-col gap-4 transition-colors">
            <h3 className="text-[16px] lg:text-[18px] font-bold text-[#173B33] dark:text-white pb-3 border-b border-[#E1E6E4] dark:border-[#1F3227] transition-colors">
              Зміст
            </h3>
            <nav className="flex flex-col gap-3">
              {policyItems.map((item) => (
                <a
                  key={item.id}
                  href={`#section-${item.id}`}
                  onClick={() => setExpandedId(item.id)}
                  className={`text-[13px] lg:text-[14px] font-medium leading-[20px] transition-colors ${
                    expandedId === item.id 
                      ? 'text-[#173B33] dark:text-[#3CD27D] font-bold' 
                      : 'text-[#6D8279] dark:text-[#7A8D85] hover:text-[#173B33] dark:hover:text-[#A4B3AF]'
                  }`}
                >
                  {item.id}. {item.title}
                </a>
              ))}
            </nav>
          </div>

          {/* Блок "Є питання?" */}
          <div className="bg-[#EAF5F1] dark:bg-[#15231D] border border-[rgba(23,59,51,0.05)] dark:border-[#1F3227] rounded-[16px] p-[20px] lg:p-5 flex flex-col gap-3 transition-colors">
            <div className="flex items-center gap-2 text-[#173B33] dark:text-white transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="bg-[#173B33] dark:bg-[#3CD27D] text-white dark:text-[#0B120F] rounded-full p-0.5 w-5 h-5 transition-colors">
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className="text-[14px] lg:text-[15px] font-bold">Є питання?</span>
            </div>
            <p className="text-[12px] lg:text-[13px] font-medium text-[#6D8279] dark:text-[#7A8D85] leading-[18px] m-0 transition-colors">
              Якщо у вас є запитання щодо цієї Політики конфіденційності або обробки персональних даних, зв'яжіться з нами:
            </p>
            <a 
              href="mailto:privacy@smarket.ua" 
              className="text-[14px] lg:text-[15px] font-bold text-[#173B33] dark:text-[#3CD27D] underline hover:opacity-80 transition-opacity break-all"
            >
              privacy@smarket.ua
            </a>
          </div>
        </aside>

        {/* ПРАВА КОЛОНКА — КОНТЕНТ */}
        <main className="flex-1 md:max-w-[923px] flex flex-col gap-[20px] md:gap-6">
          
          {/* Хлібні крихти та Заголовок */}
          <div className="flex flex-col gap-2">
            <div className="text-[12px] lg:text-[13px] font-medium text-[#6D8279] dark:text-[#7A8D85] flex flex-wrap items-center gap-1.5 transition-colors">
              <span className="cursor-pointer hover:text-[#173B33] dark:hover:text-white transition-colors">Головна</span>
              <span className="text-[10px] lg:text-[11px] text-[#B2C0B9] dark:text-[#4A5D54] transition-colors">&gt;</span>
              <span className="text-[#173B33] dark:text-white transition-colors">Обробка персональних даних</span>
            </div>
            <h1 className="text-[28px] md:text-[32px] font-light text-[#173B33] dark:text-white tracking-tight mt-1 transition-colors leading-tight">
              Обробка персональних даних
            </h1>
            <div className="text-[13px] lg:text-[14px] text-[#6D8279] dark:text-[#A4B3AF] leading-[22px] flex flex-col gap-1 mt-1 transition-colors">
              <p>Ми дбаємо про захист вашої приватності та персональних даних.</p>
              <p>Ця сторінка пояснює, які дані ми обробляємо, з якою метою та як користувач може керувати своїми даними.</p>
              <p className="text-[12px] lg:text-[13px] font-medium text-[#99A6A0] dark:text-[#6D8279] mt-1 transition-colors">
                Останнє оновлення: 10 червня 2026 року
              </p>
            </div>
          </div>

          {/* Список правил з плавним акордеоном */}
          <div className="flex flex-col gap-3 md:gap-4">
            {policyItems.map((item) => {
              const isOpen = expandedId === item.id;
              
              return (
                <div 
                  key={item.id}
                  id={`section-${item.id}`}
                  className="w-full bg-white dark:bg-[#15231D] border border-[#E9ECEB] dark:border-transparent rounded-[16px] overflow-hidden flex flex-col shadow-[0_2px_4px_rgba(0,0,0,0.01)] dark:shadow-none transition-colors scroll-mt-24"
                >
                  <button 
                    type="button"
                    onClick={() => toggleSection(item.id)}
                    className="w-full flex items-center justify-between p-[16px] md:p-5 text-left select-none hover:bg-[#FDFEFE] dark:hover:bg-[#1A2E25] transition-colors focus:outline-none gap-3"
                  >
                    <div className="flex items-center gap-[12px] md:gap-4">
                      <div className="w-[32px] h-[32px] rounded-full bg-[#EAF5F1] dark:bg-[#3CD27D] text-[#173B33] dark:text-[#0B120F] font-bold text-[13px] md:text-[14px] flex items-center justify-center shrink-0 transition-colors">
                        {item.id}
                      </div>
                      <h2 className="text-[15px] md:text-[16px] font-bold text-[#173B33] dark:text-white tracking-tight transition-colors pr-2 leading-snug">
                        {item.title}
                      </h2>
                    </div>
                    
                    <svg 
                      width="20" height="20" viewBox="0 0 24 24" fill="none" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className={`shrink-0 text-[#6D8279] dark:text-[#A4B3AF] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-[1200px] opacity-100 border-t border-[#F5F7F6] dark:border-[#1F3227]' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="p-[16px] pt-0 md:p-5 md:pt-0 md:pl-[68px] flex flex-col gap-[12px] md:gap-4 text-[13px] md:text-[14px] font-medium text-[#6D8279] dark:text-[#A4B3AF] leading-[22px] transition-colors mt-[12px] md:mt-0">
                      <p className="m-0">
                        {item.intro}
                      </p>
                      
                      {item.subIntro && (
                        <p className="font-semibold text-[#173B33] dark:text-white m-0 mt-1 transition-colors">
                          {item.subIntro}
                        </p>
                      )}
                      
                      {item.bullets && (
                        <ul className="list-disc pl-5 leading-[22px] md:leading-[24px] flex flex-col gap-1.5">
                          {item.bullets.map((bullet, index) => (
                            <li key={index} className="pl-1">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      )}
                      
                      {item.outro && (
                        <p className="m-0 mt-1 md:mt-2">
                          {item.outro}
                        </p>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}