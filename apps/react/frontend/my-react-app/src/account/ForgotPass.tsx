import './ForgotPass.css';
import checkIcon from '../assets/checkgreen.svg';
import logo from '../assets/logo.svg';
import basketImage from '../assets/logindefault.svg';
import strela from '../assets/strela.svg';

export function ForgotPass() {
    return (
        <section className="forgot-page-wrapper">
            
            <a href="/" className="back-link">
                <img src={strela} alt="Back" />
                На головну сторінку
            </a>

            <div className="forgot-card">
                <div className="forgot-left-panel">
                    <img src={logo} alt="Smarket Logo" className="smarket-logo" />

                    <h2>Купуйте розумніше. <br/> Заощаджуйте <br /> більше.</h2>
                    <p className="marketing-text">
                        Створіть акаунт, щоб зберігати кошики,<br /> порівнювати ціни між магазинами та бачити, де покупка буде дешевшою.
                    </p>
                    
                    <ul className="features-list">
                        <li><img src={checkIcon} alt="check" /> Зберігайте списки покупок</li>
                        <li><img src={checkIcon} alt="check" /> Порівнюйте ціни між магазинами</li>
                        <li><img src={checkIcon} alt="check" /> Відстежуйте свою економію</li>
                    </ul>
                    
                    <img src={basketImage} alt="Basket" className="basket-image" />
                </div>

                {/* ПРАВА ПАНЕЛЬ */}
                <div className="forgot-right-panel">
                    <div className="form-wrapper">
                        <h1>Відновлення паролю</h1>
                        <p className="forgot-subtitle">
                            Введіть email, пов'язаний з вашим акаунтом. <br />   Ми надішлемо вам інструкції для створення <br /> нового паролю.
                        </p>
                        
                        <form className="forgot-form">
                            <label className="input-label">Email</label>
                            <input type="email" placeholder="smarket@gmail.com" />

                            <button className="forgot-btn">ВІДПРАВИТИ ПОСИЛАННЯ</button>
                            
                            <p className="forgot-footer">
                                Згадали пароль? <a href="#" className="forgot-link">Увійти</a>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}