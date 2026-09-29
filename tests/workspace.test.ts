import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  demoWorkspace,
  moveCard,
  resizeBinder,
  toggleId,
  workspaceSchema,
} from '../src/lib/workspace';

test('changing page size preserves every card and intentional empty slot', () => {
  const binder = demoWorkspace().binders[0];
  binder.slots[1] = null;
  const small = resizeBinder(binder, 2);
  assert.deepEqual(small.slots.slice(0, binder.slots.length), binder.slots);
  assert.equal(small.slots.length, 20);
  const large = resizeBinder(small, 3);
  assert.deepEqual(large.slots.slice(0, 20), small.slots);
  assert.equal(large.slots.length, 27);
});
test('moving into a filled pocket swaps cards without changing the original', () => {
  const binder = demoWorkspace().binders[0];
  const moved = moveCard(binder, 0, 1);
  assert.equal(moved.slots[0], binder.slots[1]);
  assert.equal(moved.slots[1], binder.slots[0]);
  assert.notEqual(moved.slots, binder.slots);
  assert.equal(moveCard(binder, -1, 300), binder);
  assert.equal(moveCard(binder, NaN, 0), binder);
});
test('blank example has no invented owned cards; removing a pocket does not remove ownership', () => {
  const data = demoWorkspace();
  assert.deepEqual(data.owned, []);
  const id = data.binders[0].slots[0]!;
  data.owned = toggleId(data.owned, id);
  data.binders[0].slots[0] = null;
  assert.ok(data.owned.includes(id));
  assert.deepEqual(toggleId(data.owned, id), []);
});
test('imports reject unsupported versions and partial pages instead of corrupting data', () => {
  const data = demoWorkspace();
  assert.ok(workspaceSchema.safeParse(data).success);
  assert.equal(workspaceSchema.safeParse({ ...data, version: 2 }).success, false);
  data.binders[0].slots.pop();
  assert.equal(workspaceSchema.safeParse(data).success, false);
});
