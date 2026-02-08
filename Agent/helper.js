import { expect } from '@playwright/test';
import {setConfig} from '../Utils/Utils.js';

// login helper
export async function loginAsAdmin(agent) {
  const res = await agent.login('admin@dmoney.com', '1234');
  expect(res.status).toBe(200);
  agent.token = res.body.token;
  setConfig('token', agent.token);
  return res;
}

// generate random mobile number
export function randomPhone() {
  return '0183' + (Math.floor(Math.random() * 9000000) + 1000000);
}

export function randomNid(length = 10) {
  let nid = '';
  for (let i = 0; i < length; i++) {
    nid += Math.floor(Math.random() * 10);
  }
  return nid;
}

// generic negative assertion
export async function expectError(res, expectedStatuses = [400, 401, 403, 409]) {
  const body = await res.json();
  expect(expectedStatuses).toContain(res.status());
  expect(body.error?.message || body.message).toBeDefined();
  return body;
}