import './ProductHero.css';

import mainMilk from '../assets/milk.svg';
import thumb1 from '../assets/bottle.svg'; 
import starIcon from '../assets/gold-star.svg';
import staricongreen from '../assets/star.svg';

export function ProductHero() {
    return (
        <section className='product-hero-section'>
            <div className='product-container'>
                
                <nav className='breadcrumbs'>
                    <a href="#">Головна</a>
                    <span className='sep'>/</span>
                    <a href="#">Категорії</a>
                    <span className='sep'>/</span>
                    <a href="#">Молочні продукти</a>
                    <span className='sep'>/</span>
                    <a href="#">Молоко</a>
                    <span className='sep'>/</span>
                    <span className='current'>Молоко Яготинське 2,6%</span>
                </nav>

                <div className='product-content'>

                    <div className='product-left'>
                        <div className='product-gallery'>
                            <div className='badges'>
                                <span className='badge badge-yellow'>Акція тільки сьогодні</span>
                                <span className='badge badge-green'>Новинка</span>
                                <span className='badge badge-white'>
                                    <img src={staricongreen} alt="star" /> Гарні відгуки
                                </span>
                            </div>

                            <div className='main-visual'>
                                <img src={mainMilk} alt="Молоко Яготинське 2,6%" className='main-img' /> 
                            </div>
                        </div>

                        <div className='thumbnails'>
                            <div className='thumb active'>
                                <img src={thumb1} alt="thumb" className='thumb-img' /> 
                            </div>
                            <div className='thumb'>
                                <img src={thumb1} alt="thumb" className='thumb-img' /> 
                            </div>
                            <div className='thumb'>
                                <img src={thumb1} alt="thumb" className='thumb-img' /> 
                            </div>
                        </div>
                    </div>

                    <div className='product-right'>
                        
                        <div className='info-header'>
                            <h1 className='title'>Молоко Яготинське пастеризоване 2,6% 870г</h1>
                            <span className='weight'>870 г</span>
                            <div className='rating'>
                                <div className='stars-icons'>
                                    {/* === ЗДЕСЬ ОСТАЛИСЬ ЗОЛОТЫЕ ЗВЕЗДЫ === */}
                                    <img src={starIcon} alt="star" />
                                    <img src={starIcon} alt="star" />
                                    <img src={starIcon} alt="star" />
                                    <img src={starIcon} alt="star" />
                                    <img src={starIcon} alt="star" />
                                </div>
                                <span className='reviews'><strong>4.8</strong> · 128 відгуків</span>
                            </div>
                        </div>

                        <div className='price-section'>
                            <div className='main-price'>57.99 ₴</div>
                            <div className='store-label'>Ціна в <strong>NOVUS</strong></div>
                            <div className='stock-warning'>Залишилось мало</div>
                        </div>

                        <div className='actions'>
                            <div className='counter'>
                                <button>-</button>
                                <span className='count-val'>1</span>
                                <button>+</button>
                            </div>
                            <button className='btn-add-cart'>Додати до кошика</button>
                            <button className='btn-add-list'>Додати до списку</button>
                        </div>
                        <p className='disclaimer'>Ціни можуть відрізнятися залежно від магазину та часу оновлення.</p>

                        <div className='compare-widget'>
                            <div className='compare-head'>
                                <h3>Де дешевше?</h3>
                                <span className='savings-badge'>Можна зекономити 3.50 ₴</span>
                            </div>

                            <div className='compare-stores'>
                                <div className='store-row'>
                                    <div className='s-info'>
                                        <span className='s-name'>NOVUS</span>
                                        <span className='s-status'>Поточна ціна</span>
                                    </div>
                                    <div className='s-price'>57.99 ₴</div>
                                </div>

                                <div className='store-row active'>
                                    <div className='s-info'>
                                        <span className='s-name'>АТБ</span>
                                        <span className='s-status best'>Найкраща ціна</span>
                                    </div>
                                    <div className='s-price'>54.49 ₴</div>
                                </div>

                                <div className='store-row'>
                                    <div className='s-info'>
                                        <span className='s-name'>Сільпо</span>
                                    </div>
                                    <div className='s-price'>61.99 ₴</div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </section>
    );
}