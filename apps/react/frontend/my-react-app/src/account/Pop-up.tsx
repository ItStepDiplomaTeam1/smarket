import { useState } from 'react';
import './Pop-up.css';
import eyeIcon from '../assets/ButtonEye.svg';
import btngoogle from '../assets/google.svg';
import btnfacebook from '../assets/facebook.svg';

export function Popup() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    return (
        <div className="popup-overlay">
            <div className="popup-card">
                <div className="form-wrapper">
                    <h1>Створіть акаунт</h1>
                    <p className="popup-subtitle">
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

                    <form className="popup-form">
                        <label className="input-label">Ім’я</label>
                        <input type="text" placeholder="Олена" />

                        <label className="input-label">Email</label>
                        <input type="email" placeholder="smarket@gmail.com" />

                        <label className="input-label">Пароль</label>
                        <div className="password-wrapper">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Створіть пароль" 
                            />
                            <button 
                                type="button" 
                                className="toggle-password" 
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <img src={eyeIcon} alt="toggle" />
                            </button>
                        </div>

                        <label className="input-label">Підтвердьте пароль</label>
                        <div className="password-wrapper">
                            <input 
                                type={showConfirm ? "text" : "password"} 
                                placeholder="Повторіть пароль" 
                            />
                            <button 
                                type="button" 
                                className="toggle-password" 
                                onClick={() => setShowConfirm(!showConfirm)}
                            >
                                <img src={eyeIcon} alt="toggle" />
                            </button>
                        </div>

                        <div className="checkbox-container">
                            <input type="checkbox" id="agree" />
                            <label htmlFor="agree">
                                Я погоджуюсь з <span className="terms-highlight">Умовами користування</span> та <span className="terms-highlight">Політикою конфіденційності.</span>
                            </label>
                        </div>
                        
                        <button className="popup-btn">Зареєструватися</button>
                        
                        <p className="popup-footer">
                            Вже маєте акаунт? <a href="#" className="popup-link">Увійти</a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}