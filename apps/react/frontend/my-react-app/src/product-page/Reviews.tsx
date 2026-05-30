import './Reviews.css';
import goldstar from '../assets/gold-star.svg'; // золотая звезда 16x16 и 12x12
import zero_star from '../assets/star-for-review.svg'; // пустая звезда 12x12

export function Reviews() {
    return (
        <section className="reviews-wrapper">
            
            {/* Заголовок*/}
            <h2 className="reviews-title">Відгуки покупців</h2>

            {/* Загальний рейтинг*/}
            <div className="reviews-header">
                <div className="rating-score">4.8</div>
                
                <div className="rating-details">
                    <div className="rating-stars-large">
                        <img src={goldstar} alt="star" />
                        <img src={goldstar} alt="star" />
                        <img src={goldstar} alt="star" />
                        <img src={goldstar} alt="star" />
                        <img src={goldstar} alt="star" />
                    </div>
                    <div className="rating-count">На основі 128 відгуків</div>
                </div>

                <span className="recommend-badge">
                    Покупці рекомендують цей товар
                </span>
            </div>

            {/* Список відгуків */}
            <div className="reviews-list">
                
                {/* Відгук 1 */}
                <div className="review-card">
                    <div className="review-header">
                        <div className="reviewer-info">
                            <span className="reviewer-name">Марина</span>
                            <div className="review-stars">
                                <img src={goldstar} alt="star" className="star-icon" />
                                <img src={goldstar} alt="star" className="star-icon" />
                                <img src={goldstar} alt="star" className="star-icon" />
                                <img src={goldstar} alt="star" className="star-icon" />
                                <img src={goldstar} alt="star" className="star-icon" />
                            </div>
                        </div>
                        <span className="review-date">06 червня 2026</span>
                    </div>
                    <p className="review-text">
                        Хороше молоко на кожен день. Часто додаю його у свій тижневий кошик.
                    </p>
                </div>

                {/* Відгук 2 */}
                <div className="review-card">
                    <div className="review-header">
                        <div className="reviewer-info">
                            <span className="reviewer-name">Олег</span>
                            <div className="review-stars">
                                <img src={goldstar} alt="star" className="star-icon" />
                                <img src={goldstar} alt="star" className="star-icon" />
                                <img src={goldstar} alt="star" className="star-icon" />
                                <img src={goldstar} alt="star" className="star-icon" />
                                <img src={goldstar} alt="star" className="star-icon" />
                            </div>
                        </div>
                        <span className="review-date">02 червня 2026</span>
                    </div>
                    <p className="review-text">
                        Зручно бачити, де це молоко дешевше. Ціна між магазинами реально відрізняється.
                    </p>
                </div>

                {/* Відгук 3 */}
                <div className="review-card">
                    <div className="review-header">
                        <div className="reviewer-info">
                            <span className="reviewer-name">Ірина</span>
                            <div className="review-stars">
                                <img src={goldstar} alt="star" className="star-icon" />
                                <img src={goldstar} alt="star" className="star-icon" />
                                <img src={goldstar} alt="star" className="star-icon" />
                                <img src={goldstar} alt="star" className="star-icon" />
                                <img src={zero_star} alt="empty star" className="star-icon" />
                            </div>
                        </div>
                        <span className="review-date">28 травня 2026</span>
                    </div>
                    <p className="review-text">
                        Якість хороша, але важливо перевіряти наявність у конкретному магазині.
                    </p>
                </div>

            </div>

            {/* Нижній блок з кнопкою */}
            <div className="reviews-footer">
                <button className="btn-write-review">Написати відгук</button>
                <span className="action-hint">
                    Увійдіть в акаунт, щоб залишити відгук після покупки.
                </span>
            </div>
        </section>
    );
}