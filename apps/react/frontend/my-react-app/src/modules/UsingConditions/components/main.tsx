export function TermsOfUsePage() {
  // Пункти для лівого змісту (точно як на скріншоті)
  const sidebarItems = [
    { id: 1, title: "Загальні положення" },
    { id: 2, title: "Використання сервісу" },
    { id: 3, title: "Обліковий запис користувача" },
    { id: 4, title: "Відповідальність сторін" },
    { id: 5, title: "Зміни до умов" }
  ];

  // Контент для правих карток (точно як на скріншоті)
  const contentItems = [
    {
      id: 1,
      title: "Загальні положення",
      content: "Smarket — це онлайн-сервіс, який допомагає користувачам шукати товари, переглядати акції..."
    },
    {
      id: 2,
      title: "Використання сервісу",
      content: "Користувач може використовувати Smarket для пошуку товарів, перегляду цін..."
    },
    {
      id: 3,
      title: "Обліковий запис користувача",
      content: "Для доступу до окремих функцій сервісу може знадобитися реєстрація або вхід в акаунт."
    },
    {
      id: 4,
      title: "Відповідальність сторін",
      content: "Smarket прагне надавати актуальну інформацію про товари..."
    },
    {
      id: 5,
      title: "Ваші права",
      content: "Користувач має право керувати своїми персональними даними."
    }
  ];

  return (
    <div className="w-full bg-[#F8FAF9] min-h-screen font-inter antialiased py-10">
      <div className="max-w-[1230px] mx-auto px-4 flex flex-col md:flex-row gap-[30px]">
        
        {/* ЛІВА КОЛОНКА — ЗМІСТ (w-[307px]) */}
        <aside className="w-full md:w-[307px] shrink-0 flex flex-col gap-6">
          <div className="bg-white border border-[#E9ECEB] rounded-[16px] p-6 flex flex-col gap-4">
            <h3 className="text-[18px] font-bold text-[#173B33] pb-3 border-b border-[#E1E6E4]">
              Зміст
            </h3>
            <nav className="flex flex-col gap-3">
              {sidebarItems.map((item) => (
                <a
                  key={item.id}
                  href={`#section-${item.id}`}
                  className="text-[14px] font-medium text-[#6D8279] hover:text-[#173B33] transition-colors leading-[20px]"
                >
                  {item.id}. {item.title}
                </a>
              ))}
            </nav>
          </div>

          {/* Блок "Є питання?" */}
          <div className="bg-[#EAF5F1] border border-[rgba(23,59,51,0.05)] rounded-[16px] p-5 flex flex-col gap-3">
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

        {/* ПРАВА КОЛОНКА — КОНТЕНТ (w-[923px]) */}
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

          {/* Список правил (Статичні плашки) */}
          <div className="flex flex-col gap-4">
            {contentItems.map((item) => (
              <div 
                key={item.id}
                id={`section-${item.id}`}
                className="bg-white border border-[#E9ECEB] rounded-[16px] shadow-[0_2px_4px_rgba(0,0,0,0.01)]"
              >
                {/* Шапка плашки */}
                <div className="w-full flex items-center justify-between p-5 text-left select-none">
                  <div className="flex items-center gap-4">
                    {/* Круглий бейдж з номером */}
                    <div className="w-8 h-8 rounded-full bg-[#EAF5F1] text-[#173B33] font-bold text-[14px] flex items-center justify-center shrink-0">
                      {item.id}
                    </div>
                    <h2 className="text-[16px] font-bold text-[#173B33] tracking-tight">
                      {item.title}
                    </h2>
                  </div>
                  
                  {/* Статична стрілочка вниз */}
                  <svg 
                    width="20" height="20" viewBox="0 0 24 24" fill="none" 
                    stroke="#6D8279" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="shrink-0"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                {/* Текст (завжди розгорнутий) */}
                <div className="px-5 pb-5 pl-[68px]">
                  <p className="text-[14px] font-medium text-[#6D8279] leading-[22px] m-0">
                    {item.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </main>
      </div>
    </div>
  );
}