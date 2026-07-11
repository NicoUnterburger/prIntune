import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isValidId } from '../src/validation.js';

test('accepts a valid uuid v4', () => {
  assert.equal(isValidId('4e1b0f2f-dccd-4d7b-a83f-61251f7e48b8'), true);
});

test('rejects path-traversal attempts', () => {
  assert.equal(isValidId('../../etc/passwd'), false);
  assert.equal(isValidId('..%2f..%2fsecret'), false);
  assert.equal(isValidId('foo/bar'), false);
});

test('rejects empty and non-string input', () => {
  assert.equal(isValidId(''), false);
  assert.equal(isValidId(undefined), false);
  assert.equal(isValidId(null), false);
  assert.equal(isValidId(123), false);
});
