import React from 'react';
import styles from './Footer.module.css';

const Footer: React.FC = () => (
    <footer className={styles.footer}>
        <nav className={styles.links} aria-label="Ссылки в футере">
            <a href="https://slydle.ru/privacy.html" className={styles.link} target="_blank" rel="noopener noreferrer">
                Политика конфиденциальности
            </a>
            <a href="https://slydle.ru/terms.html" className={styles.link} target="_blank" rel="noopener noreferrer">
                Пользовательское соглашение
            </a>
            <a href="https://slydle.ru/offer.html" className={styles.link} target="_blank" rel="noopener noreferrer">
                Публичная оферта
            </a>
        </nav>
        <div className={styles.copyright}>© {new Date().getFullYear()} Slydle. Все права защищены.</div>
    </footer>
);

export default Footer;
