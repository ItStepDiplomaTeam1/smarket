import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  buildChatRequest,
  hasFallback,
  isMutationAction,
} from '../src/modules/AiChat/lib/chatContract.ts';

const widgetSource = readFileSync(
  new URL('../src/modules/AiChat/components/AiChatWidget.tsx', import.meta.url),
  'utf8',
);


test('automatic chat request never sends provider or model controls', () => {
  const payload = buildChatRequest('Порівняй молоко', []);

  assert.deepEqual(Object.keys(payload).sort(), ['history', 'message']);
  assert.equal('provider' in payload, false);
  assert.equal('model_name' in payload, false);
});


test('outbound history is bounded before it reaches the provider service', () => {
  const history = Array.from({ length: 12 }, (_, index) => ({
    role: 'user' as const,
    content: `message-${index}`,
  }));

  const payload = buildChatRequest('next', history);

  assert.equal(payload.history?.length, 8);
  assert.equal(payload.history?.[0].content, 'message-4');
  assert.equal(payload.history?.[7].content, 'message-11');
});


test('typed fallback responses remain retryable even with HTTP 200', () => {
  assert.equal(
    hasFallback({
      blocks: [
        {
          type: 'fallback',
          message: 'Тимчасова помилка',
          suggestion: 'Повторіть запит',
        },
      ],
    }),
    true,
  );
  assert.equal(hasFallback({ blocks: [{ type: 'text', content: 'Готово' }] }), false);
});


test('only server-confirmed mutations require action tokens', () => {
  assert.equal(isMutationAction('add_to_cart'), true);
  assert.equal(isMutationAction('remove_from_cart'), true);
  assert.equal(isMutationAction('clear_cart'), true);
  assert.equal(isMutationAction('create_review'), true);
  assert.equal(isMutationAction('navigate'), false);
  assert.equal(isMutationAction('apply_filters'), false);
});


test('widget keeps mutation execution and responsive accessibility contracts', () => {
  assert.match(widgetSource, /const isMutation = isMutationAction\(block\.action\);/);
  assert.match(widgetSource, /if \(isMutation\)/);
  assert.match(widgetSource, /execute\(\);/);
  assert.match(widgetSource, /pending \? 'Виконується/);
  assert.match(widgetSource, /role="dialog"/);
  assert.match(widgetSource, /aria-live="polite"/);
  assert.match(widgetSource, /h-\[100dvh\] w-screen/);
  assert.match(widgetSource, /h-11 w-11/);
  assert.match(widgetSource, /focus-visible:ring-2/);
  assert.doesNotMatch(widgetSource, /Промін|Promin/);
});


test('product cards support persisted visual mode and navigation', () => {
  assert.match(widgetSource, /state\.productView/);
  assert.match(widgetSource, /setProductView/);
  assert.match(widgetSource, /aria-pressed=\{visual\}/);
  assert.match(widgetSource, /block\.image_url \|\| productPlaceholder/);
  assert.match(widgetSource, /`\/product\/\$\{block\.product_id\}`/);
  assert.match(widgetSource, /aria-label=\{`Відкрити товар/);
});
