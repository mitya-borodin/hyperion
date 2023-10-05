/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

beforeEach(async () => {
  await fetch(`${BASE_URL}/purge-test-database`, { method: 'POST' });
});

afterEach(async () => {
  await fetch(`${BASE_URL}/purge-test-database`, { method: 'POST' });
});

test('true', async () => {
  expect(true).toEqual(true);
});
