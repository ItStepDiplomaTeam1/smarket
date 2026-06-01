export function About() {
  return (
    <section className="w-full pb-[40px] bg-[#F6FAF8] font-inter">
      <div className="w-full max-w-[1180px] mx-auto px-[20px]">

        <div>
          {/* Заголовок секції */}
          <h2 className="font-manrope text-[24px] font-bold text-[#173B33] mb-[24px] m-0">Про товар</h2>

          {/* Description */}
          <div className="bg-white border border-[rgba(38,84,71,0.08)] rounded-[16px] p-[24px] mb-[16px]">
            <h3 className="font-manrope text-[24px] font-[200] leading-[31.2px] text-[#173B33] m-0 mb-[16px]">Опис товару</h3>
            <p className="font-inter text-[16px] text-[#173B33] leading-[24px] m-0">
              Молоко коров'яче питне пастеризоване ТМ «Яготинське» — це високоякісний натуральний продукт, виготовлений виключно з <br /> коров'ячого молока, яке проходить відповідну термічну обробку.
            </p>
          </div>

          {/* Nutrition */}
          <div className="bg-white border border-[rgba(38,84,71,0.08)] rounded-[16px] p-[24px] mb-[16px]">
            <h3 className="font-manrope text-[24px] font-[200] leading-[31.2px] text-[#173B33] m-0 mb-[16px]">Харчові властивості, 100г</h3>
            <div className="grid grid-cols-4 gap-[16px]">
              {[
                { label: 'Калорійність', value: '53.00 ккал' },
                { label: 'Білки',        value: '2.80 г'     },
                { label: 'Жири',         value: '2.60 г'     },
                { label: 'Вуглеводи',    value: '4.70 г'     },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#F6FAF8] p-[16px] rounded-[12px] flex flex-col justify-center">
                  <span className="block font-inter font-bold text-[16px] text-[#265447] mb-[4px] leading-tight">{value}</span>
                  <span className="font-inter text-[13px] text-[#6B7280] font-normal leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Composition */}
          <div className="bg-white border border-[rgba(38,84,71,0.08)] rounded-[16px] p-[24px] mb-[16px]">
            <h3 className="font-manrope text-[24px] font-[200] leading-[31.2px] text-[#173B33] m-0 mb-[16px]">Склад</h3>
            <p className="font-inter text-[16px] text-[#173B33] leading-[24px] m-0">Молоко коров'яче незбиране, молоко знежирене.</p>
          </div>

          {/* General info */}
          <div className="bg-white border border-[rgba(38,84,71,0.08)] rounded-[16px] p-[24px] mb-[16px]">
            <h3 className="font-manrope text-[24px] font-[200] leading-[31.2px] text-[#173B33] m-0 mb-[16px]">Загальна інформація</h3>
            <div className="flex flex-col">
              {[
                [
                  { label: 'Бренд',      val: 'Яготинське' },
                  { label: 'Виробник',   val: 'ТДВ "Яготинський маслозавод"' },
                  { label: 'Вага',       val: '870г' },
                  { label: 'Жирність',   val: '2.6%' },
                ],
                [
                  { label: 'Термін придатності',    val: '9 діб' },
                  { label: 'Температура зберігання', val: '2...6 °C' },
                  { label: 'Країна-виробник',        val: 'Україна' },
                  { label: 'Метод обробки',          val: 'пастеризоване' },
                ],
                [
                  { label: 'Основа',    val: "коров'яче молоко" },
                  { label: 'Упаковка',  val: 'пластикова пляшка' },
                  { label: '', val: '' },
                  { label: '', val: '' },
                ],
              ].map((row, ri, arr) => (
                <div key={ri} className="grid grid-cols-4 gap-x-[24px]">
                  {row.map(({ label, val }, ci) => (
                    <div
                      key={ci}
                      className={`flex justify-between items-start gap-[12px] py-[16px] ${ri < arr.length - 1 ? 'border-b border-[rgba(38,84,71,0.08)]' : ''}`}
                    >
                      {label && (
                        <>
                          <span className="font-inter text-[13px] text-[#6D8279] font-normal shrink-0">{label}</span>
                          <span className="font-inter text-[13px] font-semibold text-[#265447] text-right">{val}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
