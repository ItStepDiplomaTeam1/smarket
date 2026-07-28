const CITY_DEFINITIONS = [
  { value: 'kiev', label: 'Київ', aliases: ['kyiv', 'київ', 'киев'] },
  { value: 'lviv', label: 'Львів', aliases: ['львів', 'львов'] },
  { value: 'odesa', label: 'Одеса', aliases: ['odessa', 'одеса', 'одесса'] },
  { value: 'dnipro', label: 'Дніпро', aliases: ['dnepr', 'дніпро', 'днепр'] },
  { value: 'kharkiv', label: 'Харків', aliases: ['kharkov', 'харків', 'харьков'] },
  {
    value: 'ivanofrankivsk',
    label: 'Івано-Франківськ',
    aliases: ['ivano-frankivsk', 'івано-франківськ', 'ивано-франковск'],
  },
  { value: 'rivne', label: 'Рівне', aliases: ['ровно', 'рівне'] },
  { value: 'zhytomyr', label: 'Житомир', aliases: ['житомир'] },
  { value: 'chernivtsi', label: 'Чернівці', aliases: ['chernovtsy', 'чернівці', 'черновцы'] },
  { value: 'kryvyyrig', label: 'Кривий Ріг', aliases: ['kryvyi-rih', 'кривий ріг', 'кривой рог'] },
  { value: 'poltava', label: 'Полтава', aliases: ['полтава'] },
  { value: 'vinnytsia', label: 'Вінниця', aliases: ['vinnitsa', 'вінниця', 'винница'] },
  {
    value: 'zaporizhzhia',
    label: 'Запоріжжя',
    aliases: ['zaporozhye', 'запоріжжя', 'запорожье'],
  },
] as const;

const normalizeCityKey = (city: string): string => city.trim().toLocaleLowerCase('uk-UA');

const cityByAlias = new Map<string, (typeof CITY_DEFINITIONS)[number]>();

for (const definition of CITY_DEFINITIONS) {
  cityByAlias.set(normalizeCityKey(definition.value), definition);
  cityByAlias.set(normalizeCityKey(definition.label), definition);
  for (const alias of definition.aliases) {
    cityByAlias.set(normalizeCityKey(alias), definition);
  }
}

export const getCityFilterValue = (city: string): string => {
  const normalized = normalizeCityKey(city);
  return cityByAlias.get(normalized)?.value ?? normalized;
};

export const getOptionalCityFilter = (
  city: string,
  isEnabled: boolean,
): string | undefined => (
  isEnabled ? getCityFilterValue(city) : undefined
);

export const getCityDisplayName = (city: string): string => {
  const trimmed = city.trim();
  if (!trimmed) return '';
  return cityByAlias.get(normalizeCityKey(trimmed))?.label ?? trimmed;
};
