import './Profile.css';
import logo from '../assets/logo.svg'; // лого сайта
import basket from '../assets/basket-profile.svg'; // иконка для пункта меню "Мої кошики"
import squere from '../assets/squere.svg'; // иконка для пункта меню "Огляд"
import location from '../assets/location.svg'; //  иконка для пункта меню "Адреси"
import history from '../assets/history.svg'; // иконка для пункта меню "Історія покупок"
import profilelog from '../assets/logo-profile.svg'; // иконка для пункта меню "Профіль"
import top from '../assets/top.svg'; //стрелка топ вверх
import arrow from '../assets/arrow-profile.svg';// стрелка для кнопки "На головну стораницу"
import lupa from '../assets/lupa-for-profile.svg';// лупа для поиска в профиле
import before from '../assets/before.svg'; // полоска для выбора страницы профила (кошик огляд и тд)
import zaglushka from '../assets/iconforprofilebasket.svg'; // заглушка для последних покупок
import barrow_right from '../assets/barrow-right.svg'; // стрелка которая смотрит в право 

export const Profile = () => {
    return (
        <div className="profile-page-wrapper">
            
            {/* ЛІВА ПАНЕЛЬ (Сайдбар) */}
            <aside className="profile-sidebar">
                
                {/* Логотип */}
                <a href="/" className="logo-link">
                    <img src={logo} alt="Smarket Logo" className="logo-img" />
                </a>

                {/* Блок користувача */}
                <div className="user-block">
                    <div className="avatar-placeholder">
                        ОК
                    </div>
                    <div className="user-info">
                        <div className="user-name">Олена Коваль</div>
                        <div className="user-email">olena.smarket@gmail.com</div>
                    </div>
                </div>

                {/* Навігація */}
                <nav className="profile-nav">
                    {/* Активний пункт меню з імпортованою смужкою */}
                    <a href="#" className="nav-item active">
                        <img src={before} alt="active" className="active-indicator" />
                        <img src={squere} alt="Menu" />
                        Огляд
                    </a>
                    <a href="#" className="nav-item">
                        <img src={basket} alt="Basket" />
                        Мої кошики
                    </a>
                    <a href="#" className="nav-item">
                        <img src={history} alt="History" />
                        Історія покупок
                    </a>
                    <a href="#" className="nav-item">
                        <img src={location} alt="Location" />
                        Адреси
                    </a>
                    <a href="#" className="nav-item">
                        <img src={profilelog} alt="Profile" />
                        Профіль
                    </a>
                </nav>
            </aside>

            {/* ПРАВА ПАНЕЛЬ (Контент сторінки "Огляд") */}
            <main className="profile-main-content">
                
                {/* Шапка з привітанням, пошуком та кнопкою */}
                <header className="content-header">
                    <div className="header-text">
                        <h1>Добрий день, Олено</h1>
                        <p>Сьогодні можна зекономити на вашому звичному кошику.</p>
                    </div>
                    
                    <div className="header-actions">
                        <div className="search-box">
                            <img src={lupa} alt="Search" />
                            <input type="text" placeholder="Пошук покупок або товарів" />
                        </div>
                        <a href="/" className="btn-back-home">
                            <img src={arrow} alt="Back" />
                            На головну сторінку
                        </a>
                    </div>
                </header>

                {/* Верхні 3 картки статистики */}
                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <p className="card-subtitle">Заощаджено цього місяця</p>
                        <div className="card-value-row">
                            <h2>1 284 грн</h2>
                            <span className="badge-top">
                                <img src={top} alt="Top" className="top-icon" /> Топ
                            </span>
                        </div>
                        <p className="card-footer-text">на 6 порівняних кошиках</p>
                    </div>

                    <div className="dashboard-card">
                        <p className="card-subtitle">Активні кошики</p>
                        <div className="card-value-row">
                            <h2>3</h2>
                        </div>
                        <p className="card-footer-text">готові до порівняння</p>
                    </div>

                    <div className="dashboard-card">
                        <p className="card-subtitle">Улюблені магазини</p>
                        <div className="card-value-row">
                            <h2>5</h2>
                        </div>
                        <p className="card-footer-text">АТБ, Сільпо, Novus та інші</p>
                    </div>
                </div>

                {/* Основний блок (Поточний кошик та Останні покупки) */}
                <div className="dashboard-main-row">
                    
                    {/* КАРТКА: ПОТОЧНИЙ КОШИК */}
                    <div className="dashboard-card large-card left-col">
                        <h3 className="section-title">Поточний кошик</h3>
                        
                        <div className="basket-header">
                            <h4 className="basket-title">Закупівля на тиждень</h4>
                            <p className="basket-subtitle">12 товарів - оновлено сьогодні</p>
                        </div>

                        {/* Чипи (Категорії) */}
                        <div className="chips-list">
                            <span className="category-chip">Молоко</span>
                            <span className="category-chip">Кава</span>
                            <span className="category-chip">Олія</span>
                            <span className="category-chip">Підгузки</span>
                            <span className="category-chip">Сир</span>
                            <span className="category-chip">+7 товарів</span>
                        </div>

                        {/* Список магазинів */}
                        <div className="comparison-list">
                            
                            {/* Активний магазин */}
                            <div className="store-row highlighted">
                                <div className="store-info">
                                    <span className="store-name">АТБ</span>
                                    <span className="badge-best-price">Найкраща ціна</span>
                                </div>
                                <div className="store-price-block">
                                    <div className="store-price">1 842 грн</div>
                                    <div className="store-savings">Економія 426 грн</div>
                                </div>
                            </div>

                            {/* Звичайні магазини (ВИПРАВЛЕНО!) */}
                            <div className="store-row">
                                <div className="store-info">
                                    <span className="store-name">Сільпо</span>
                                </div>
                                <div className="store-price-block">
                                    <div className="store-price">1 976 грн</div>
                                </div>
                            </div>

                            <div className="store-row">
                                <div className="store-info">
                                    <span className="store-name">Novus</span>
                                </div>
                                <div className="store-price-block">
                                    <div className="store-price">2 031 грн</div>
                                </div>
                            </div>

                        </div>

                        {/* Кнопки дій */}
                        <div className="card-actions">
                            <button className="btn-primary">Порівняти магазини</button>
                            <button className="btn-outline">Редагувати кошик</button>
                        </div>
                    </div>
                    
                    {/* КАРТКА: ОСТАННІ ПОКУПКИ */}
                    <div className="dashboard-card large-card right-col">
                        <h3 className="section-title">Останні покупки</h3>
                        
                        <div className="purchase-list">
                            <div className="purchase-item">
                                <img src={zaglushka} alt="Icon" className="purchase-icon" />
                                
                                <div className="purchase-info">
                                    <div className="purchase-title">Закупівля на тиждень</div>
                                    <div className="purchase-details">АТБ · <span className='purchase-date'> 1 842 грн · Економія 426 грн</span></div>
                                    <div className="purchase-date">07 червня 2026</div>
                                </div>
                                
                                <a href="#" className="purchase-link">
                                    Деталі
                                    <img src={barrow_right} alt="Arrow" />
                                </a>
                            </div>

                            <div className="purchase-item">
                                <img src={zaglushka} alt="Icon" className="purchase-icon" />
                                
                                <div className="purchase-info">
                                    <div className="purchase-title">Закупівля на тиждень</div>
                                    <div className="purchase-details">АТБ · <span className='purchase-date'> 1 842 грн · Економія 426 грн</span></div>
                                    <div className="purchase-date">07 червня 2026</div>
                                </div>
                                
                                <a href="#" className="purchase-link">
                                    Деталі
                                    <img src={barrow_right} alt="Arrow" />
                                </a>
                            </div>

                            <div className="purchase-item">
                                <img src={zaglushka} alt="Icon" className="purchase-icon" />
                                
                                <div className="purchase-info">
                                    <div className="purchase-title">Закупівля на тиждень</div>
                                    <div className="purchase-details">АТБ · <span className='purchase-date'> 1 842 грн · Економія 426 грн</span></div>
                                    <div className="purchase-date">07 червня 2026</div>
                                </div>
                                
                                <a href="#" className="purchase-link">
                                    Деталі
                                    <img src={barrow_right} alt="Arrow" />
                                </a>
                            </div>

                        </div>
                    </div>
                </div>

                {/* НИЖНІЙ РЯД (АДРЕСА ТА ПРОФІЛЬ) */}
                <div className="dashboard-bottom-row">
                    
                    {/* КАРТКА: ОСНОВНА АДРЕСА */}
                    <div className="dashboard-card bottom-card">
                        <h3 className="section-title">Основна адреса</h3>
                        <div className="bottom-card-content">
                            <p className="main-info-text">Київ, вул. Січових Стрільців, 24</p>
                            <p className="sub-info-text">Використовується для пошуку магазинів поруч.</p>
                            
                            {/* Обгортка з обводкою */}
                            <div className="action-row">
                                <a href="#" className="action-link">
                                    Змінити адресу
                                    <img src={barrow_right} alt="Arrow" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* КАРТКА: ПРОФІЛЬ */}
                    <div className="dashboard-card bottom-card">
                        <h3 className="section-title">Профіль</h3>
                        <div className="bottom-card-content">
                            
                            <div className="profile-details-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Ім'я</span>
                                    <span className="detail-value">Олена Коваль</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Мова</span>
                                    <span className="detail-value">Українська</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Email</span>
                                    <span className="detail-value">olena.smarket@gmail.com</span>
                                </div>
                                <div className="detail-item">
                                </div>
                            </div>

                            <div className="action-row">
                                <a href="#" className="action-link">
                                    Редагувати профіль
                                    <img src={barrow_right} alt="Arrow" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

            </main>

        </div>
    );
}