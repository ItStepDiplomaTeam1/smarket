import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mergeVerifiedProducts } from '../src/shared/utils/productValidation.ts';

test('products missing from PostgreSQL are removed from search candidates', () => {
  const candidates = [
    { id: 4042, title: 'Stale Meilisearch product' },
    { id: 34353, title: 'Search title' },
  ];
  const verifiedProducts = [
    { id: 34353, title: 'Database title', is_hidden: false },
  ];

  assert.deepEqual(
    mergeVerifiedProducts(candidates, verifiedProducts),
    [{ id: 34353, title: 'Database title', is_hidden: false }],
  );
});

test('hidden products are not returned even if their database row still exists', () => {
  const candidates = [{ id: 10, title: 'Hidden product' }];
  const verifiedProducts = [{ id: 10, is_hidden: true }];

  assert.deepEqual(mergeVerifiedProducts(candidates, verifiedProducts), []);
});

test('verified products preserve Meilisearch order', () => {
  const candidates = [
    { id: 3, title: 'Third' },
    { id: 1, title: 'First' },
  ];
  const verifiedProducts = [
    { id: 1, price: 10 },
    { id: 3, price: 30 },
  ];

  assert.deepEqual(
    mergeVerifiedProducts(candidates, verifiedProducts).map((product) => product.id),
    [3, 1],
  );
});
