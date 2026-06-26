export const generateSlug = (name: string | undefined): string => {
    if (!name) return 'product';
    const a = 'àáäâãåăæąçćčđďèéěėëêęğǵḧìíïîįłḿǹńňñòóöôœøṕŕřßşśšșťțùúüûǘůűūųẃẍÿýźžż·/_,:;';
    const b = 'aaaaaaaaacccddeeeeeeegghiiiiilmnnnnooooooprrsssssttuuuuuuuuuwxyyzzz------';
    const p = new RegExp(a.split('').join('|'), 'g');

    return name.toString().toLowerCase()
        .replace(/\s+/g, '-') // Пробелы заменяем на дефисы
        .replace(p, c => b.charAt(a.indexOf(c))) // Транслит
        .replace(/&/g, '-and-') // Заменяем & на 'and'
        .replace(/[^\w\-]+/g, '') // Удаляем все не-буквы
        .replace(/\-\-+/g, '-') // Удаляем лишние дефисы
        .replace(/^-+/, '') // Убираем дефис в начале
        .replace(/-+$/, ''); // Убираем дефис в конце
};