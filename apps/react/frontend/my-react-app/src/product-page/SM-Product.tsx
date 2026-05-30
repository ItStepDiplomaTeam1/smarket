import './SM-Product.css';
import zagluska from '../assets/Vectorbuttle.svg'; 

export function SMProduct() {
  return (
    <section className="sm-section">
      <div className="product-container">

        <h2 className="sm-section-title">Схожі товари</h2>

        <div className="sm-grid">
          <div className="sm-card">

            <div className="sm-img-wrap">
              <img src={zagluska} alt="Молоко Яготинське" className="sm-img" />
            </div>

            <h3 className="sm-title">Молоко Яготинське пряжене 2,6% 870г</h3>

            <span className="sm-weight">870 г</span>

            <div className="sm-footer">
              <span className="sm-price">74.99 ₴</span>
              <button className="sm-btn">Порівняти</button>
            </div>

          </div>

          <div className="sm-card">

            <div className="sm-img-wrap">
              <img src={zagluska} alt="Молоко Яготинське" className="sm-img" />
            </div>

            <h3 className="sm-title">Молоко Яготинське пряжене 2,6% 870г</h3>

            <span className="sm-weight">870 г</span>

            <div className="sm-footer">
              <span className="sm-price">74.99 ₴</span>
              <button className="sm-btn">Порівняти</button>
            </div>

          </div>

          <div className="sm-card">

            <div className="sm-img-wrap">
              <img src={zagluska} alt="Молоко Яготинське" className="sm-img" />
            </div>
 
            <h3 className="sm-title">Молоко Яготинське пряжене 2,6% 870г</h3>

            <span className="sm-weight">870 г</span>

            <div className="sm-footer">
              <span className="sm-price">74.99 ₴</span>
              <button className="sm-btn">Порівняти</button>
            </div>

          </div>

          <div className="sm-card">

            <div className="sm-img-wrap">
              <img src={zagluska} alt="Молоко Яготинське" className="sm-img" />
            </div>
 
            <h3 className="sm-title">Молоко Яготинське пряжене 2,6% 870г</h3>

            <span className="sm-weight">870 г</span>

            <div className="sm-footer">
              <span className="sm-price">74.99 ₴</span>
              <button className="sm-btn">Порівняти</button>
            </div>

          </div>
              
        

        </div>
      </div>
    </section>
  );
}