/**
 * Таблиця транслітерації українських та російських символів.
 * Базується на стандарті КМУ 2010 для української + доповнення для російської.
 */
const CYRILLIC_MAP: Record<string, string> = {
    // Українська
    'а': 'a',  'б': 'b',  'в': 'v',  'г': 'h',  'ґ': 'g',
    'д': 'd',  'е': 'e',  'є': 'ye', 'ж': 'zh', 'з': 'z',
    'и': 'y',  'і': 'i',  'ї': 'yi', 'й': 'y',  'к': 'k',
    'л': 'l',  'м': 'm',  'н': 'n',  'о': 'o',  'п': 'p',
    'р': 'r',  'с': 's',  'т': 't',  'у': 'u',  'ф': 'f',
    'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ь': '',   'ю': 'yu', 'я': 'ya',
    // Російська (доповнення)
    'ё': 'yo', 'ъ': '',   'ы': 'y',  'э': 'e',
};

/**
 * Генерує SEO-friendly slug з назви товару.
 * Підтримує українську, російську та латинську з діакритичними знаками.
 *
 * @example
 * generateSlug("Молоко Селянське 2.6%") → "moloko-selyanske-26"
 * generateSlug("Château Margaux 2015")  → "chateau-margaux-2015"
 */
export const generateSlug = (name: string | undefined): string => {
    if (!name) return 'product';

    // Латинські діакритичні знаки
    const diacritics = 'àáäâãåăæąçćčđďèéěėëêęğǵḧìíïîįłḿǹńňñòóöôœøṕŕřßşśšșťțùúüûǘůűūųẃẍÿýźžż·/_,:;';
    const replacements = 'aaaaaaaaacccddeeeeeeegghiiiiilmnnnnooooooprrsssssttuuuuuuuuuwxyyzzz------';
    const diacriticsRegex = new RegExp(diacritics.split('').join('|'), 'g');

    return name
        .toString()
        .toLowerCase()
        // 1. Транслітерація кирилиці
        .replace(/[а-яґєіїёъыэ]/g, (ch) => CYRILLIC_MAP[ch] ?? '')
        // 2. Пробіли → дефіси
        .replace(/\s+/g, '-')
        // 3. Латинські діакритичні знаки → ASCII
        .replace(diacriticsRegex, (c) => replacements.charAt(diacritics.indexOf(c)))
        // 4. & → and
        .replace(/&/g, '-and-')
        // 5. Видаляємо все, крім букв, цифр, дефісів
        .replace(/[^\w-]+/g, '')
        // 6. Прибираємо зайві дефіси
        .replace(/--+/g, '-')
        // 7. Дефіс на початку
        .replace(/^-+/, '')
        // 8. Дефіс в кінці
        .replace(/-+$/, '');
};