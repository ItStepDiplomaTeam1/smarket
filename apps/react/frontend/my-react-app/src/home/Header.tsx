import './Header.css';
import logo from '../assets/logo.svg';
import lupa from '../assets/lupa.svg';
import koshuk from '../assets/koshuk.svg';
import lohm from '../assets/lohm.svg';
import fix_logo from '../assets/Logo-Smarket.svg'

export function Header() {
  return (
    <div className="app-container">
      
      <header className="header">

        <div className="container">
          
          <a href="/" className="logo-link">
            <img src={fix_logo} alt="Smarket Logo" className="logo-img" />
          </a>

          <nav className="desktop-nav">
            <a href="#">Акції</a>
            <a href="#">Порівняти ціни</a>
            <a href="#">Магазини</a>
            <a href="#">Кошик</a>
          </nav>

          <div className="header-actions">
            <button><img src={lupa} alt="Search" /></button>
            <button><img src={lohm} alt="Profile" /></button>
            <button><img src={koshuk} alt="Basket" /></button>
          </div>

        </div>
      </header>
      
    </div>
  );
}

export default Header;