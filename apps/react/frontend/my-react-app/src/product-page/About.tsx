import './About.css';

export function About() {
  return (
    <section className="product-details-section">
      <div className="product-container">

        <div className="details-wrapper">
          <h2 className="section-title">Про товар</h2>

          <div className="info-card">
            <h3 className="card-label">Опис товару</h3>
            <p className="card-text">
              Молоко коров'яче питне пастеризоване ТМ «Яготинське» — це високоякісний натуральний продукт, виготовлений виключно з <br /> коров'ячого молока, яке проходить відповідну термічну обробку.
            </p>
          </div>

          <div className="info-card">
            <h3 className="card-label">Харчові властивості, 100г</h3>
            <div className="nutrition-grid">
              <div className="nutrition-item">
                <span className="n-label">Калорійність</span>
                <span className="n-value">53.00 ккал</span>
              </div>
              <div className="nutrition-item">
                <span className="n-label">Білки</span>
                <span className="n-value">2.80 г</span>
              </div>
              <div className="nutrition-item">
                <span className="n-label">Жири</span>
                <span className="n-value">2.60 г</span>
              </div>
              <div className="nutrition-item">
                <span className="n-label">Вуглеводи</span>
                <span className="n-value">4.70 г</span>
              </div>
            </div>
          </div>

          <div className="info-card">
            <h3 className="card-label">Склад</h3>
            <p className="card-text">Молоко коров'яче незбиране, молоко знежирене.</p>
          </div>

          <div className="info-card">
            <h3 className="card-label">Загальна інформація</h3>
            <div className="info-table">

              <div className="info-row">
                <div className="info-pair"><span className="i-label">Бренд</span><span className="i-val">Яготинське</span></div>
                <div className="info-pair"><span className="i-label">Виробник</span><span className="i-val">ТДВ "Яготинський маслозавод"</span></div>
                <div className="info-pair"><span className="i-label">Вага</span><span className="i-val">870г</span></div>
                <div className="info-pair"><span className="i-label">Жирність</span><span className="i-val">2.6%</span></div>
              </div>

              <div className="info-row">
                <div className="info-pair"><span className="i-label">Термін придатності</span><span className="i-val">9 діб</span></div>
                <div className="info-pair"><span className="i-label">Температура зберігання</span><span className="i-val">2...6 °C</span></div>
                <div className="info-pair"><span className="i-label">Країна-виробник</span><span className="i-val">Україна</span></div>
                <div className="info-pair"><span className="i-label">Метод обробки</span><span className="i-val">пастеризоване</span></div>
              </div>

              <div className="info-row">
                <div className="info-pair"><span className="i-label">Основа</span><span className="i-val">коров'яче молоко</span></div>
                <div className="info-pair"><span className="i-label">Упаковка</span><span className="i-val">пластикова пляшка</span></div>
                <div className="info-pair"></div>
                <div className="info-pair"></div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}