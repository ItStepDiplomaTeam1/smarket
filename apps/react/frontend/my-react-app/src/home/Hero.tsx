import './Hero.css';
import mockupCard from '../assets/mockup-card.svg';
import checkIcon from '../assets/check.svg';

export function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-container">

        <div className="hero-text">
          <p className="hero-subtitle">SMART SHOPPING / ЦІНИ / ЕКОНОМІЯ</p>
          <h1 className="hero-title">Один кошик.<br />Найкраща ціна.</h1>
          <p className="hero-description">
            Зберіть список покупок і Smarket покаже, у якому магазині вся корзина коштує дешевше.
          </p>

          <div className="search-box">
            <input type="text" placeholder="Введіть товар або список покупок" />
            <button className="search-btn">Порівняти ціни</button>
          </div>
          <div className="trust-pills">
            <div className="trust-pill">
              <img src={checkIcon} alt="check" />
              <span>Економія на всій корзині</span>
            </div>
            <div className="trust-pill">
              <img src={checkIcon} alt="check" />
              <span>Акції поруч</span>
            </div>
            <div className="trust-pill">
              <img src={checkIcon} alt="check" />
              <span>Список для сім'ї</span>
            </div>
          </div>
          <p className="hero-subtext">
            Порівнюємо ціни, акції та магазини поруч з вами — без зайвих вкладок і довгого пошуку.
          </p>
        </div>

        <div className="hero-visual">
          
          <div className="hero-blob"></div>
          <img src={mockupCard} alt="Mockup Card" className="mockup-img" />
        </div>

      </div>
    </section>
  );
}