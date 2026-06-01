export function About() {
  return (
    <section className="pb-10">
      <div className="max-w-[1228px] mx-auto px-6">

        <div>
          <h2 className="font-manrope text-2xl font-bold text-[#173B33] mb-6">Про товар</h2>

          {/* Description */}
          <div className="bg-white border border-[rgba(38,84,71,0.08)] rounded-2xl p-6 mb-4">
            <h3 className="font-manrope text-lg font-extralight text-[#173B33] m-0 mb-4">Опис товару</h3>
            <p className="font-inter text-base text-[#173B33] leading-6 m-0">
              Молоко коров'яче питне пастеризоване ТМ «Яготинське» — це високоякісний натуральний продукт, виготовлений виключно з <br /> коров'ячого молока, яке проходить відповідну термічну обробку.
            </p>
          </div>

          {/* Nutrition */}
          <div className="bg-white border border-[rgba(38,84,71,0.08)] rounded-2xl p-6 mb-4">
            <h3 className="font-manrope text-lg font-extralight text-[#173B33] m-0 mb-4">Харчові властивості, 100г</h3>
            <div className="grid grid-cols-4 gap-4 mt-4">
              {[
                { label: 'Калорійність', value: '53.00 ккал' },
                { label: 'Білки',        value: '2.80 г'     },
                { label: 'Жири',         value: '2.60 г'     },
                { label: 'Вуглеводи',    value: '4.70 г'     },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#F6FAF8] p-4 rounded-xl flex flex-col justify-center">
                  <span className="block font-inter font-bold text-base text-[#265447] mb-1">{value}</span>
                  <span className="font-inter text-[13px] text-[#6B7280] font-normal">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Composition */}
          <div className="bg-white border border-[rgba(38,84,71,0.08)] rounded-2xl p-6 mb-4">
            <h3 className="font-manrope text-lg font-extralight text-[#173B33] m-0 mb-4">Склад</h3>
            <p className="font-inter text-base text-[#173B33] leading-6 m-0">Молоко коров'яче незбиране, молоко знежирене.</p>
          </div>

          {/* General info */}
          <div className="bg-white border border-[rgba(38,84,71,0.08)] rounded-2xl p-6 mb-4">
            <h3 className="font-manrope text-lg font-extralight text-[#173B33] m-0 mb-4">Загальна інформація</h3>
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
                <div key={ri} className="grid grid-cols-4 gap-x-6">
                  {row.map(({ label, val }, ci) => (
                    <div
                      key={ci}
                      className={`flex justify-between items-start gap-3 py-4 ${ri < arr.length - 1 ? 'border-b border-[#E5E7EB]' : ''}`}
                    >
                      {label && (
                        <>
                          <span className="font-inter text-[13px] text-[#6D8279] font-normal whitespace-nowrap">{label}</span>
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