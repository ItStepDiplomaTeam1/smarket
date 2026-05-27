import './ProductsSec.css';
import product1 from '../assets/div.product-visual.svg';

export function ProductsSec() {
  return (
    <section className="products-section">
      <div className="products-container">
        
        <div className="section-header">
          <h2 className="products-title">Популярні товари для порівняння</h2>
          <p className="products-desc">Швидко перевіряйте ціни на товари, які найчастіше додають <br /> у кошик.</p>
        </div>

        <div className="products-grid">
          
          <div className="product-card">
            <img src={product1} alt="Молоко 2.5%" className="product-photo" />
            
            <h3 className="product-name">Молоко 2.5%</h3>
            <p className="product-price-shops">від 38 грн · 4 магазини</p>
            <p className="discount-text">Економія до 17 грн</p>
            
            <button className="btn">Порівняти</button>
          </div>

          <div className="product-card">
            <img src={product1} alt="Соняшникова олія" className="product-photo" />
            
            <h3 className="product-name">Соняшникова олія</h3>
            <p className="product-price-shops">від 62 грн · 6 магазинів</p>
            <p className="discount-text">Економія до 21 грн</p>
            
            <button className="btn">Порівняти</button>
          </div>

          <div className="product-card">
            <img src={product1} alt="Підгузки" className="product-photo" />
            
            <h3 className="product-name">Підгузки</h3>
            <p className="product-price-shops">від 349 грн · 3 магазини</p>
            <p className="discount-text">Економія до 86 грн</p>
            
            <button className="btn">Порівняти</button>
          </div>

          <div className="product-card">
            <img src={product1} alt="Кава мелена" className="product-photo" />
            
            <h3 className="product-name">Кава мелена</h3>
            <p className="product-price-shops">від 129 грн · 5 магазинів</p>
            <p className="discount-text">Економія до 42 грн</p>
            
            <button className="btn">Порівняти</button>
          </div>

          <div className="product-card">
            <img src={product1} alt="Пральний порошок" className="product-photo" />
            
            <h3 className="product-name">Пральний порошок</h3>
            <p className="product-price-shops">від 219 грн · 4 магазини</p>
            <p className="discount-text">Економія до 62 грн</p>
            
            <button className="btn">Порівняти</button>
          </div>
        </div>
      </div>
    </section>
  );
}