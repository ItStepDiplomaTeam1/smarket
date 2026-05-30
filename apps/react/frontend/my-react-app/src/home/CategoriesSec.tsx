import './CategoriesSec.css';
import product1 from '../assets/div.product-visual.svg';

export function CategoriesSec() {
    return(
        <section className='categories-section'>
            <div className='categories-container'>
                
                <div className='section-header'>
                    <h2 className='categories-title'>
                        Категорії покупок
                    </h2>
                    <p className='categories-desc'>
                        Знаходьте вигідні пропозиції за основними категоріями <br /> щоденних покупок.
                    </p>
                </div>

                <div className='categories-grid'>
                    
                    <div className='categories-card'>
                        <img src={product1} alt="Дитячі товари" className='categories-photo' />
                        
                        <h3 className='categories-name'>Дитячі товари</h3>
                        
                        <a href="#" className="category-link">
                            Переглянути акції &rarr;
                        </a>
                    </div>

                    <div className='categories-card'>
                        <img src={product1} alt="Краса та догляд" className='categories-photo' />
                        
                        <h3 className='categories-name'>Краса та догляд</h3>
                        
                        <a href="#" className="category-link">
                            Переглянути акції &rarr;
                        </a>
                    </div>

                    <div className='categories-card'>
                        <img src={product1} alt="Побутова хімія" className='categories-photo' />
                        
                        <h3 className='categories-name'>Побутова хімія</h3>
                        
                        <a href="#" className="category-link">
                            Переглянути акції &rarr;
                        </a>
                    </div>

                    <div className='categories-card'>
                        <img src={product1} alt="Товари для дому" className='categories-photo' />
                        
                        <h3 className='categories-name'>Товари для дому</h3>
                        
                        <a href="#" className="category-link">
                            Переглянути акції &rarr;
                        </a>
                    </div>

                    <div className='categories-card'>
                        <img src={product1} alt="Напої" className='categories-photo' />
                        
                        <h3 className='categories-name'>Напої</h3>
                        
                        <a href="#" className="category-link">
                            Переглянути акції &rarr;
                        </a>
                    </div>

                    <div className='categories-card'>
                        <img src={product1} alt="Продукти" className='categories-photo' />
                        
                        <h3 className='categories-name'>Продукти</h3>
                        
                        <a href="#" className="category-link">
                            Переглянути акції &rarr;
                        </a>
                    </div>
                    
                </div>
                
            </div>
        </section>
    );
}