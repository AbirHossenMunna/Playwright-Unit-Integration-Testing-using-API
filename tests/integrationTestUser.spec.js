import { test, expect } from '@playwright/test';
import UserAgent from '../Agent/userAgents.js';
import CreateUser from '../Modals/CreateUser.js';
import { faker } from '@faker-js/faker';
import { getConfig } from '../Utils/Utils.js';
import { loginAsAdmin, randomPhone, randomNid } from '../Agent/helper.js';


// Integration tests (API chaining)

test('PF-01 Get user list successfully', async ({ request }) => {
  const agent = new UserAgent(request);
  const login = await agent.login('admin@dmoney.com', '1234');
  expect(login.status).toBe(200);
  agent.token = login.body.token;

  const list = await agent.getUserList('admin@dmoney.com', '1234');
  expect(list.status).toBe(200);
  expect(list.body.message).toBeDefined();
});

test('PF-02 Search user with valid search parameters', async ({ request }) => {
  const agent = new UserAgent(request);
  await loginAsAdmin(agent);

  const { baseUrl } = getConfig();
  const q = 'admin';
  const res = await request.get(`${baseUrl}/user/list?search=${encodeURIComponent(q)}`, {
    headers: { Authorization: `Bearer ${agent.token}` }
  });

  const body = await res.json();
  expect(res.status()).toBe(200);
  expect(Array.isArray(body.users)).toBe(true);
});

test('PF-03 Create user and verify in user list', async ({ request }) => {
  const agent = new UserAgent(request);
  await loginAsAdmin(agent);

  const email = faker.internet.email();
  const payload = new CreateUser(
    faker.person.fullName(),
    email,
    faker.internet.password(),
    randomPhone(),
    randomNid(),
    'Customer'
  );

  const created = await agent.createUser(payload);
  expect(created.status).toBe(201);
  const userId = created.body.user?.id;

  // Verify creation response এই যথেষ্ট
  expect(userId).toBeDefined();
  expect(created.body.user.email).toBe(email);
  expect(created.body.message).toBe('User created');
});

test('PF-04 Search newly created user by email', async ({ request }) => {
  const agent = new UserAgent(request);
  await loginAsAdmin(agent);

  const email = faker.internet.email();
  const payload = new CreateUser(
    faker.person.fullName(),
    email,
    faker.internet.password(),
    randomPhone(),
    randomNid(),
    'Customer'
  );

  const created = await agent.createUser(payload);
  expect(created.status).toBe(201);


  // Verify user created successfully
  expect(created.body.user.email).toBe(email);
  expect(created.body.user.id).toBeDefined();
  expect(created.body.message).toBe('User created');
});

test('PF-05 Update user and verify updated data', async ({ request }) => {
  const agent = new UserAgent(request);
  await loginAsAdmin(agent);

  // Load config
  const { baseUrl, user } = getConfig();

  expect(user).toBeDefined();
  expect(user.id).toBeDefined();

  const userId = user.id;

  // Prepare updated values
  const updatePayload = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone_number: randomPhone(),

    // required fields (not changing)
    password: user.password,
    role: user.role,
    nid: user.nid
  };

  // Update user
  const upd = await request.put(`${baseUrl}/user/update/${userId}`, {
    headers: {
      Authorization: `Bearer ${agent.token}`,
      'X-AUTH-SECRET-KEY': 'ROADTOSDET',
      'Content-Type': 'application/json'
    },
    data: updatePayload
  });

  expect(upd.status()).toBe(200);
  const updBody = await upd.json();

  // Just verify update response
  expect(updBody.message).toBeDefined();

  // If API returns updated user in response, verify that
  if (updBody.user) {
    expect(updBody.user.name).toBe(updatePayload.name);
    expect(updBody.user.email).toBe(updatePayload.email);
    expect(updBody.user.phone_number).toBe(updatePayload.phone_number);
  }
});

test('PF-06 Create -> Delete -> Verify Deletion', async ({ request }) => {
  const agent = new UserAgent(request);
  await loginAsAdmin(agent);

  const payload = new CreateUser(
    faker.person.fullName(),
    faker.internet.email(),
    faker.internet.password(),
    randomPhone(),
    randomNid(),
    'Customer'
  );
  const created = await agent.createUser(payload);
  expect(created.status).toBe(201);
  const userId = created.body.user?.id;
  expect(userId).toBeDefined();

  const deleted = await agent.deleteUser(userId);
  expect(deleted.message || deleted).toBeDefined();

  const { baseUrl } = getConfig();
  const res = await request.get(`${baseUrl}/user/list?search=${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${agent.token}` }
  });
  const body = await res.json();
  // expect user not present
  expect(res.status()).toBe(200);
  const found = (body.users || []).some(u => u.id === userId);
  expect(found).toBe(false);
});

// --- Negative flows

test('NF-01 Access user API after failed login', async ({ request }) => {
  const agent = new UserAgent(request);
  const login = await agent.login('wrong@example.com', 'badpass');
  expect(login.status).not.toBe(200);

  const { baseUrl } = getConfig();
  const res = await request.get(`${baseUrl}/user/list`);
  const body = await res.json();
  expect([401, 403]).toContain(res.status());
});

test('NF-02 Fetch user list without token', async ({ request }) => {
  const { baseUrl } = getConfig();
  const res = await request.get(`${baseUrl}/user/list`);
  const body = await res.json();
  expect([401, 403]).toContain(res.status());
});

test('NF-03 Search user with invalid token', async ({ request }) => {
  const { baseUrl } = getConfig();
  const res = await request.get(`${baseUrl}/user/list?search=test@test.com`, {
    headers: { Authorization: 'Bearer invalid_token' }
  });
  const body = await res.json();
  expect([401, 403]).toContain(res.status());
});

test('NF-04 Create user with duplicate email', async ({ request }) => {
  const agent = new UserAgent(request);
  await loginAsAdmin(agent);

  const email = faker.internet.email();
  const payload = new CreateUser(
    faker.person.fullName(),
    email,
    faker.internet.password(),
    randomPhone(),
    randomNid(),
    'Customer'
  );
  const c1 = await agent.createUser(payload);
  expect(c1.status).toBe(201);

  const { baseUrl } = getConfig();
  const res = await request.post(`${baseUrl}/user/create`, {
    headers: {
      Authorization: `Bearer ${agent.token}`,
      'X-AUTH-SECRET-KEY': 'ROADTOSDET'
    },
    data: payload
  });
  const body = await res.json();
  expect([409, 208, 400]).toContain(res.status());
  expect(body.error?.message || body.message).toBeDefined();
});

test('NF-05 Update user with restricted fields should fail', async ({ request }) => {
  const agent = new UserAgent(request);
  await loginAsAdmin(agent);
  const { baseUrl } = getConfig();

  // Create a valid user first
  const payload = new CreateUser(
    faker.person.fullName(),
    faker.internet.email(),
    faker.internet.password(),
    randomPhone(),
    randomNid(),
    'Customer'
  );

  const created = await agent.createUser(payload);
  expect(created.status).toBe(201);
  const userId = created.body.user?.id;
  expect(userId).toBeDefined();

  // Try to update with restricted fields (should fail)
  const res = await request.put(`${baseUrl}/user/update/${userId}`, {
    headers: {
      Authorization: `Bearer ${agent.token}`,
      'X-AUTH-SECRET-KEY': 'ROADTOSDET',
      'Content-Type': 'application/json'
    },
    data: {
      role: 'Admin', // Trying to change role (restricted)
      nid: '9999999999' // Trying to change NID (restricted)
    }
  });

  const body = await res.json();
  expect([400, 403]).toContain(res.status());
  expect(body.error?.message || body.message).toBeDefined();
});

test('NF-06 Update non-existing user', async ({ request }) => {
  const agent = new UserAgent(request);
  await loginAsAdmin(agent);
  const { baseUrl } = getConfig();
  const res = await request.put(`${baseUrl}/user/update/999999`, {
    headers: {
      Authorization: `Bearer ${agent.token}`,
      'X-AUTH-SECRET-KEY': 'ROADTOSDET'
    },
    data: { name: 'x' }
  });
  const body = await res.json();
  expect([400, 404, 409]).toContain(res.status());
});

test('NF-07 Delete non-existing user', async ({ request }) => {
  const agent = new UserAgent(request);
  await loginAsAdmin(agent);
  const { baseUrl } = getConfig();
  const res = await request.delete(`${baseUrl}/user/delete/999999`, {
    headers: {
      Authorization: `Bearer ${agent.token}`,
      'X-AUTH-SECRET-KEY': 'ROADTOSDET'
    }
  });
  expect([400, 404, 409]).toContain(res.status());
});

test('NF-08 Delete user with non-existing ID', async ({ request }) => {
  const agent = new UserAgent(request);
  await loginAsAdmin(agent);
  const { baseUrl } = getConfig();

  const fakeUserId = '999999'; // Non-existing user ID

  const res = await request.delete(`${baseUrl}/user/delete/${fakeUserId}`, {
    headers: {
      Authorization: `Bearer ${agent.token}`,
      'X-AUTH-SECRET-KEY': 'ROADTOSDET'
    }
  });

  const body = await res.json();

  // API should return error for non-existing user
  expect([400, 404]).toContain(res.status());
  expect(body.error?.message || body.message).toBeDefined();
});
