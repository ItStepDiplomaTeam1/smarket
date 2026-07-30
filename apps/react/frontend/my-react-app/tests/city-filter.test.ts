import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getCityDisplayName,
  getCityFilterValue,
  getOptionalCityFilter,
  matchesCityFilter,
} from '../src/shared/utils/city.ts';

test('city labels are converted to values stored by the catalog services', () => {
  assert.equal(getCityFilterValue('Київ'), 'kiev');
  assert.equal(getCityFilterValue('Одеса'), 'odesa');
  assert.equal(getCityFilterValue('Кривий Ріг'), 'kryvyyrig');
});

test('API city values are rendered as user-facing Ukrainian names', () => {
  assert.equal(getCityDisplayName('kiev'), 'Київ');
  assert.equal(getCityDisplayName('ivanofrankivsk'), 'Івано-Франківськ');
});

test('disabled city filtering omits the city query parameter', () => {
  assert.equal(getOptionalCityFilter('Київ', false), undefined);
  assert.equal(getOptionalCityFilter('Київ', true), 'kiev');
});

test('unknown cities remain usable instead of being discarded', () => {
  assert.equal(getCityFilterValue('  Uzhhorod  '), 'uzhhorod');
  assert.equal(getCityDisplayName('  Uzhhorod  '), 'Uzhhorod');
});

test('store cities are matched against the selected normalized city', () => {
  assert.equal(matchesCityFilter('Київ', 'kiev'), true);
  assert.equal(matchesCityFilter('odesa', 'kiev'), false);
  assert.equal(matchesCityFilter(undefined, 'kiev'), false);
  assert.equal(matchesCityFilter('odesa', undefined), true);
});
