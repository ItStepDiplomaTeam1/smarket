import './Footer.css';
import logo from '../assets/logo.svg';

export function Footer() {
  return (
    <footer className="footer-section">
      <div className="footer-container">
        <div className='footer-inner'>
            <div className='footer-brand'>
                <img src={logo} alt="Smarket" className='footer-logo' />
                <p className='footer-brand-text'>
                    Smarket — сервіс для розумного порівняння цін і планування покупок.
                </p>
            </div>

            <ul className='footer-menu'>
                <li><a href="#" className='footer-link'>Акції</a></li>
                <li><a href="#" className='footer-link'>Магазини</a></li>
                <li><a href="#" className='footer-link'>Категорії</a></li>
                <li><a href="#" className='footer-link'>Як це працює</a></li>
            </ul>
        </div>

        <div className='footer-bottom'>
            <p className='footer-copyright'>© 2026 Smarket. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}