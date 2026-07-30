import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getCategorySearchParams } from '../src/shared/utils/catalogCategory.ts';

test('products category targets only the food main category', () => {
  assert.deepEqual(
    getCategorySearchParams('products'),
    { main_category_id: '1' },
  );
});

test('other top-level categories continue using their search slug', () => {
  assert.deepEqual(
    getCategorySearchParams('drinks'),
    { category_slug: 'drinks' },
  );
});
