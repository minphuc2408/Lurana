import test from 'node:test';
import assert from 'node:assert/strict';
import { orderProgress } from '../src/features/orders/order-progress.ts';

test('cancelled orders show only milestones in actual history and never claim delivery', () => {
  for (const history of [[], ['PENDING'], ['PENDING', 'CONFIRMED'], ['PENDING', 'CONFIRMED', 'PREPARING', 'IN_TRANSIT']]) {
    const progress = orderProgress({ status_code: 'CANCELLED', timeline: [...history, 'CANCELLED'].map(to_status => ({ to_status })) });
    assert.deepEqual(progress.filter(step => step.reached).map(step => step.code), history);
    assert.equal(progress.some(step => step.current), false);
    assert.equal(progress.find(step => step.code === 'DELIVERED').reached, false);
  }
});
