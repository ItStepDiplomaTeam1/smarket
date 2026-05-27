import { useState } from 'react';
import './Login.css';
import eyeIcon from '../assets/ButtonEye.svg';
import btngoogle from '../assets/google.svg';
import btnfacebook from '../assets/facebook.svg';
import checkIcon from '../assets/checkgreen.svg';
import logo from '../assets/logo.svg';
import basketImage from '../assets/logindefault.svg';
import strela from '../assets/strela.svg';

export function Login() {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <section className="login-page-wrapper">
            
            <a href="/" className="back-link">
                <img src={strela} alt="Back" />
                На головну сторінку
            </a>

            <div className="login-card">
                {/* ЛІВА ПАНЕЛЬ */}
                <div className="login-left-panel">
                    <img src={logo} alt="Smarket Logo" className="smarket-logo" />

                    <h2>Купуйте розумніше. <br/> Заощаджуйте більше.</h2>
                    <p className="marketing-text">
                        Створіть акаунт, щоб зберігати кошики, порівнювати ціни між магазинами та бачити, де покупка буде дешевшою.
                    </p>
                    
                    <ul className="features-list">
                        <li><img src={checkIcon} alt="check" /> Зберігайте списки покупок</li>
                        <li><img src={checkIcon} alt="check" /> Порівнюйте ціни між магазинами</li>
                        <li><img src={checkIcon} alt="check" /> Відстежуйте свою економію</li>
                    </ul>
                    
                    <img src={basketImage} alt="Basket" className="basket-image" />
                </div>

                {/* ПРАВА ПАНЕЛЬ */}
                <div className="login-right-panel">
                    <div className="form-wrapper">
                        <h1>Увійти в акаунт</h1>
                        <p className="login-subtitle">
                            Почніть порівнювати ціни та збирати вигідні кошики вже сьогодні.
                        </p>
                        
                        <button className="social-btn">
                            <img src={btngoogle} alt="Google" />
                            Продовжити з Google
                        </button>
                        <button className="social-btn">
                            <img src={btnfacebook} alt="Facebook" />
                            Продовжити з Facebook
                        </button>

                        <div className="divider-text">
                            <span>або увійти через email</span>
                        </div>

                        <form className="login-form">
                            <label className="input-label">Email</label>
                            <input type="email" placeholder="smarket@gmail.com" />

                            <label className="input-label">Пароль</label>
                            <div className="password-wrapper">
                                <input type={showPassword ? "text" : "password"} placeholder="Введіть пароль" />
                                <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                                    <img src={eyeIcon} alt="toggle" />
                                </button>
                            </div>
                            
                            <div className="forgot-password-wrapper">
                                <a href="#" className="forgot-password">Забули пароль?</a>
                            </div>

                            <button className="login-btn">Увійти</button>
                            
                            <p className="login-footer">
                                У вас немає акаунту? <a href="#" className="login-link">Зареєструватися</a>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}