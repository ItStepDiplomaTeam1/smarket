import './FinalCTA.css';

export function FinalCTA() {
    return (
        <section className='final-cta-section'>
            <div className='final-cta-container'>
                
                <h2 className='final-title'>
                    Готові зібрати вигідний кошик?
                </h2>
                
                <p className='final-desc'>
                    Додайте товари у список і дізнайтесь, де вся <br />
                    покупка буде дешевшою.
                </p>

                <div className='cta-actions'>
                    <button className='final-button'>
                        Створити кошик
                    </button>
                    <a href="#" className='final-link'>
                        Переглянути акції &rarr;
                    </a>
                </div>
                
            </div>
        </section>
    );
}