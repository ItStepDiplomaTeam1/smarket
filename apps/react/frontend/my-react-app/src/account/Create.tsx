import { useState } from 'react';
import './Create.css';
import eyeIcon from '../assets/ButtonEye.svg';
import btngoogle from '../assets/google.svg';
import btnfacebook from '../assets/facebook.svg';
import checkIcon from '../assets/checkgreen.svg';
import logo from '../assets/logo.svg';
import basketImage from '../assets/logindefault.svg';
import strela from '../assets/strela.svg';

export function Create() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    return (
        <section className="create-page-wrapper">
            <a href="/" className="back-link">
                <img src={strela} alt="Back" />
                На головну сторінку
            </a>

            <div className="create-card">
                {/* ЛЕВАЯ ПАНЕЛЬ */}
                <div className="create-left-panel">
                    <img src={logo} alt="Smarket Logo" className="smarket-logo" />

                    <h2>Купуйте розумніше. <br /> Заощаджуйте більше.</h2>
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

                {/* ПРАВАЯ ПАНЕЛЬ */}
                <div className="create-right-panel">
                    <div className="form-wrapper">
                        <h1>Створіть акаунт</h1>
                        <p className="create-subtitle">
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
                            <span>або зареєструйтесь через email</span>
                        </div>

                        <form className="create-form">
                            <label className="input-label">Ім’я</label>
                            <input type="text" placeholder="Олена" />

                            <label className="input-label">Email</label>
                            <input type="email" placeholder="smarket@gmail.com" />

                            <label className="input-label">Пароль</label>
                            <div className="password-wrapper">
                                <input type={showPassword ? "text" : "password"} placeholder="Створіть пароль" />
                                <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                                    <img src={eyeIcon} alt="toggle" />
                                </button>
                            </div>

                            <label className="input-label">Підтвердьте пароль</label>
                            <div className="password-wrapper">
                                <input type={showConfirm ? "text" : "password"} placeholder="Повторіть пароль" />
                                <button type="button" className="toggle-password" onClick={() => setShowConfirm(!showConfirm)}>
                                    <img src={eyeIcon} alt="toggle" />
                                </button>
                            </div>

                            <div className="checkbox-container">
                                <input type="checkbox" id="agree" />
                                <label htmlFor="agree">
                                    Я погоджуюсь з <span className="terms-highlight">Умовами користування</span> та <span className="terms-highlight">Політикою конфіденційності.</span>
                                </label>
                            </div>

                            <button className="create-btn">Зареєструватися</button>

                            <p className="create-footer">
                                Вже маєте акаунт? <a href="#" className="create-link">Увійти</a>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}