import { useState } from 'react';

export function TermsOfUsePage() {
  // Повністю розгорнута структура даних для кожного розділу Умов використання
  const termsItems = [
    {
      id: 1,
      title: "Загальні положення",
      intro: "Smarket — це онлайн-сервіс, який допомагає користувачам зручно шукати товари, переглядати актуальні акції, порівнювати ціни в супермаркетах та планувати свої покупки.",
      subIntro: "Використовуючи наш сервіс у будь-який спосіб, ви автоматично погоджуєтеся з цими Умовами у повному обсязі:",
      bullets: [
        "ці правила є обов'язковими для всіх відвідувачів платформи та зареєстрованих користувачів;",
        "якщо ви не згодні з будь-яким пунктом умов, ви маєте припинити використання сервісу;",
        "платформа надається виключно для некомерційного, особистого використання споживачами;",
        "доступ до базового функціоналу сайту та мобільного додатка є повністю безкоштовним."
      ],
      outro: "Ми рекомендуємо періодично переглядати цю сторінку, щоб бути в курсі поточних правил взаємодії з нашою платформою."
    },
    {
      id: 2,
      title: "Використання сервісу",
      intro: "Користувачі можуть використовувати інструменти Smarket для аналізу асортименту товарів, створення кошиків та оптимізації витрат.",
      subIntro: "Під час взаємодії з платформою користувачам суворо заборонено:",
      bullets: [
        "використовувати будь-які автоматизовані скрипти, парсери чи боти для масового збору інформації;",
        "намагатися обійти системи безпеки, зламувати інфраструктуру або порушувати стабільність її роботи;",
        "копіювати, дублювати або поширювати інтелектуальну власність сервісу без нашої офіційної згоди;",
        "завантажувати шкідливий програмний код або здійснювати спрямовані DDoS-атаки на сервери."
      ],
      outro: "У разі виявлення фактів шкідливої чи несанкціонованої діяльності адміністрація залишає за собою право обмежити доступ порушнику."
    },
    {
      id: 3,
      title: "Обліковий запис користувача",
      intro: "Для доступу до окремих персоналізованих функцій сервісу, таких як збереження індивідуальних кошиків та історія порівнянь, може знадобитися реєстрація.",
      subIntro: "Створюючи обліковий запис на Smarket, ви берете на себе наступні зобов'язання:",
      bullets: [
        "надавати виключно правдиву, точну та актуальну інформацію про себе при заповненні профілю;",
        "забезпечувати повну конфіденційність та безпеку своїх реєстраційних даних (логіна та пароля);",
        "не передавати доступ до власного особистого кабінету стороннім третім особам;",
        "негайно сповістити службу підтримки, якщо ви помітили ознаки несанкціонованого входу або зламу."
      ],
      outro: "Ви маєте повне право у будь-який момент самостійно та безповоротно видалити свій профіль через внутрішні налаштування кабінету."
    },
    {
      id: 4,
      title: "Відповідальність сторін",
      intro: "Smarket докладає всіх зусиль для того, щоб надавати максимально точну, свіжу та перевірену інформацію про товари й ціни в торгових мережах.",
      subIntro: "Проте ми просимо користувачів звернути увагу на наступні обмеження відповідальності:",
      bullets: [
        "сервіс не є продавцем товарів і не здійснює безпосередні фінансові розрахунки чи доставку;",
        "реальні ціни на полицях супермаркетів можуть відрізнятися через технічні затримки оновлення баз даних;",
        "ми не несемо відповідальності за технічні збої провайдерів або тимчасову недоступність платформи;",
        "усі торгові марки, бренди та логотипи роздрібних мереж належать їхнім законним правовласникам."
      ],
      outro: "Остаточне рішення про купівлю та перевірку фінальної вартості товару користувач приймає безпосередньо у точці продажу."
    },
    {
      id: 5,
      title: "Зміни до умов",
      intro: "Адміністрація Smarket має законне право в односторонньому порядку змінювати, коригувати або повністю оновлювати текст цих Умов використання.",
      subIntro: "Процес впровадження нових правил у роботу сервісу регулюється так:",
      bullets: [
        "нова редакція умов набуває чинності одразу після її офіційної публікації на цій сторінці;",
        "дата останнього перегляду документа завжди чітко зазначається у верхній частині сторінки;",
        "продовження користування платформою після внесення змін трактується як ваша повна згода з новими правилами;",
        "якщо оновлені умови є для вас неприйнятними, ви маєте право припинити роботу з сервісом."
      ],
      outro: "Про критичні зміни або масштабні оновлення інтерфейсу ми намагаємося додатково повідомляти через внутрішню систему сповіщень."
    }
  ];

  // Перший пункт відкритий за замовчуванням
  const [expandedId, setExpandedId] = useState<number | null>(1);

  const toggleSection = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="w-full bg-[#F8FAF9] min-h-screen font-inter antialiased py-10">
      <div className="max-w-[1230px] mx-auto px-4 flex flex-col md:flex-row gap-[30px]">
        
        {/* ЛІВА КОЛОНКА — ЗМІСТ */}
        <aside className="w-full md:w-[307px] shrink-0 flex flex-col gap-6">
          <div className="bg-white border border-[#E9ECEB] rounded-[16px] p-6 flex flex-col gap-4 sticky top-6">
            <h3 className="text-[18px] font-bold text-[#173B33] pb-3 border-b border-[#E1E6E4]">
              Зміст
            </h3>
            <nav className="flex flex-col gap-3">
              {termsItems.map((item) => (
                <a
                  key={item.id}
                  href={`#section-${item.id}`}
                  onClick={() => setExpandedId(item.id)}
                  className={`text-[14px] font-medium leading-[20px] transition-colors ${
                    expandedId === item.id ? 'text-[#173B33] font-bold' : 'text-[#6D8279] hover:text-[#173B33]'
                  }`}
                >
                  {item.id}. {item.title}
                </a>
              ))}
            </nav>
          </div>

          {/* Блок "Є питання?" */}
          <div className="bg-[#EAF5F1] border border-[rgba(23,59,51,0.05)] rounded-[16px] p-5 flex flex-col sticky top-76 gap-3">
            <div className="flex items-center gap-2 text-[#173B33]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="bg-[#173B33] text-white rounded-full p-0.5 w-5 h-5">
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className="text-[15px] font-bold">Є питання?</span>
            </div>
            <p className="text-[13px] font-medium text-[#6D8279] leading-[18px] m-0">
              Якщо у вас є запитання щодо цієї Політики конфіденційності або обробки персональних даних, зв'яжіться з нами:
            </p>
            <a 
              href="mailto:privacy@smarket.ua" 
              className="text-[15px] font-bold text-[#173B33] underline hover:opacity-80 transition-opacity"
            >
              privacy@smarket.ua
            </a>
          </div>
        </aside>

        {/* ПРАВА КОЛОНКА — КОНТЕНТ */}
        <main className="flex-1 md:max-w-[923px] flex flex-col gap-6">
          
          {/* Хлібні крихти та Заголовок */}
          <div className="flex flex-col gap-2">
            <div className="text-[13px] font-medium text-[#6D8279] flex items-center gap-1.5">
              <span className="cursor-pointer hover:text-[#173B33] transition-colors">Головна</span>
              <span className="text-[11px] text-[#B2C0B9]">&gt;</span>
              <span className="text-[#173B33]">Умови використання</span>
            </div>
            <h1 className="text-[32px] font-light text-[#173B33] tracking-tight mt-1">
              Умови використання
            </h1>
            <div className="text-[14px] text-[#6D8279] leading-[22px] flex flex-col gap-1 mt-1">
              <p>Будь ласка, уважно ознайомтеся з цими Умовами використання перед тим, як користуватися сервісом Smarket.</p>
              <p className="text-[13px] font-medium text-[#99A6A0] mt-1">
                Останнє оновлення: 10 червня 2026 року
              </p>
            </div>
          </div>

          {/* Список правил з акордеоном */}
          <div className="flex flex-col gap-4">
            {termsItems.map((item) => {
              const isOpen = expandedId === item.id;
              
              return (
                <div 
                  key={item.id}
                  id={`section-${item.id}`}
                  className="w-full bg-white border border-[#E9ECEB] rounded-[16px] overflow-hidden flex flex-col shadow-[0_2px_4px_rgba(0,0,0,0.01)]"
                >
                  {/* Клікабельна шапка */}
                  <button 
                    type="button"
                    onClick={() => toggleSection(item.id)}
                    className="w-full flex items-center justify-between p-5 text-left select-none hover:bg-[#FDFEFE] transition-colors focus:outline-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#EAF5F1] text-[#173B33] font-bold text-[14px] flex items-center justify-center shrink-0">
                        {item.id}
                      </div>
                      <h2 className="text-[16px] font-bold text-[#173B33] tracking-tight">
                        {item.title}
                      </h2>
                    </div>
                    
                    <svg 
                      width="20" height="20" viewBox="0 0 24 24" fill="none" 
                      stroke="#6D8279" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Контейнер анімації висоти */}
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-[1000px] opacity-100 border-t border-[#F5F7F6]' : 'max-h-0 opacity-0'
                    }`}
                  >
                    {/* Внутрішній блок контенту */}
                    <div className="p-5 pl-5 md:pl-[68px] flex flex-col gap-4 text-[14px] font-medium text-[#6D8279] leading-[22px]">
                      <p className="m-0 text-[#6D8279]">
                        {item.intro}
                      </p>
                      
                      {item.subIntro && (
                        <p className="font-semibold text-[#173B33] m-0 mt-1">
                          {item.subIntro}
                        </p>
                      )}
                      
                      {item.bullets && (
                        <ul className="list-disc pl-5 leading-[24px] flex flex-col gap-1.5 text-[#6D8279]">
                          {item.bullets.map((bullet, index) => (
                            <li key={index} className="pl-1">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      )}
                      
                      {item.outro && (
                        <p className="m-0 mt-2 text-[#6D8279]">
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