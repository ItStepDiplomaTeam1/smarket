import './Hws.css';

import step1 from '../assets/div.step-number1.svg';
import step2 from '../assets/div.step-number2.svg';
import step3 from '../assets/div.step-number3.svg';

import hwsVisual from '../assets/div.hiw-visual.svg'; 

export function Hws() {
    return (
        <section className='hws-section'>
            <div className='hws-container'>

                <div className='hws-text-column'>
                    <span className='section-eyebrow'>ЯК ЦЕ ПРАЦЮЄ</span>
                    <h2 className='section-title'>Порівняйте не один <br /> товар, а всю корзину</h2>
                    <p className='section-desc'>
                        Звичайні сайти показують окремі акції. Smarket <br /> допомагає скласти повний список покупок і побачити, де загальна сума буде найменшою.
                    </p>

                    <div className='steps-list'>
                        <div className='step-item'>
                            <img src={step1} alt="1" className='step-icon-img' />
                            
                            <div className='step-content'>
                                <h3 className='step-title'>Додайте товари</h3>
                                <p className='step-text'>Зберіть список покупок для дому, події або закупівлі на <br /> тиждень.</p>
                            </div>
                        </div>

                        <div className='step-item'>
                            <img src={step2} alt="2" className='step-icon-img' />
                            <div className='step-content'>
                                <h3 className='step-title'>Порівняйте магазини</h3>
                                <p className='step-text'>Smarket рахує суму корзини в разных супермаркетах.</p>
                            </div>
                        </div>

                        <div className='step-item'>
                            <img src={step3} alt="3" className='step-icon-img' />
                            <div className='step-content'>
                                <h3 className='step-title'>Оберіть вигідний варіант</h3>
                                <p className='step-text'>Дивіться економію, акції та магазини поруч.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='hws-visual-column'>
                    <img src={hwsVisual} alt="Порівняння корзини" className='hws-main-img' />
                </div>

            </div>
        </section>
    );
}