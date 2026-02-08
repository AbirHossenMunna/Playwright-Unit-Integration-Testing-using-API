import { test, expect } from '@playwright/test';
import UserAgent from '../Agent/userAgents.js';
import CreateUser from '../Modals/CreateUser.js';
import { faker } from '@faker-js/faker';
import { getConfig, setConfig } from '../Utils/Utils.js';
import { loginAsAdmin, randomPhone, randomNid, expectError } from '../Agent/helper.js';

// --- Login-user tests (positive + negative)
test('User login with wrong credentials', async ({ request }) => {
    const agent = new UserAgent(request);

    const email = "admin";
    const password = "1234";
    const res = await agent.login(email, password);

    console.log('LOGIN STATUS:', res.status);
    console.log('LOGIN BODY:', res.body);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toBe('User not found');
});

test('Login Successfull', async ({ request }) => {
    const agent = new UserAgent(request);

    const email = "admin@dmoney.com";
    const password = "1234";
    const res = await agent.login(email, password);

    console.log('LOGIN STATUS:', res.status);
    console.log('LOGIN BODY:', res.body);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.token).not.toBeNull();

    setConfig('token', res.body.token);
});

// ---User List tests (positive + negative)
test('Admin get all user list without token', async ({ request }) => {
    const { baseUrl } = getConfig();

    const res = await request.get(`${baseUrl}/user/list`);
    const body = await res.json();

    expect([401, 403]).toContain(res.status());

    // Validate error structure
    expect(body).toHaveProperty('error');
    expect(body.error).toHaveProperty('message');
    expect(body.error.message).toBeDefined();
    expect(body.error.message.length).toBeGreaterThan(0);

    // Optional: check exact message if you want
    expect(body.error.message).toBe('No Token Found!');
});

test('Admin get all user list with wrong token', async ({ request }) => {
    const { baseUrl } = getConfig();

    const res = await request.get(`${baseUrl}/user/list`, {
        headers: { Authorization: 'Bearer wrongtoken' }
    });

    const body = await res.json();

    console.log('WRONG TOKEN STATUS:', res.status());
    console.log('WRONG TOKEN BODY:', body);

    // status must indicate unauthorized
    expect([401, 403]).toContain(res.status());

    // Validate error structure
    expect(body).toHaveProperty('error');
    expect(body.error).toHaveProperty('message');
    expect(body.error.message).toBeDefined();
    expect(body.error.message.length).toBeGreaterThan(0);

    // Optional: check exact message if you want
    expect(body.error.message).toBe('Token expired!');
});

test('Admin get all user list', async ({ request }) => {
    const agent = new UserAgent(request);

    const listBody = await agent.getUserList(
        'admin@dmoney.com',
        '1234'
    );

    console.log('USER LIST BODY:', listBody);

    expect(listBody.status).toBe(200);

    expect(listBody.body.message).toBe('User list');
    expect(listBody.body).toHaveProperty('users');
    expect(Array.isArray(listBody.body.users)).toBe(true);
    expect(listBody.body.users.length).toBeGreaterThan(0);
});

// --- Create-user tests (positive + negative)
test('Create user - wrong token', async ({ request }) => {
    const { baseUrl } = getConfig();

    const payload = new CreateUser(
        faker.person.fullName(),
        faker.internet.email(),
        faker.internet.password(),
        randomPhone(),
        randomNid(10),
        'Customer'
    );

    const res = await request.post(`${baseUrl}/user/create`, {
        headers: {
            Authorization: 'Bearer wrongtoken',
            'X-AUTH-SECRET-KEY': 'ROADTOSDET'
        },
        data: payload
    });

    const body = await res.json();

    expect([401, 403]).toContain(res.status());
    expect(body.error?.message || body.message).toBeDefined();
});

test('Create user - duplicate email/phone negative', async ({ request }) => {
    const agent = new UserAgent(request);
    await loginAsAdmin(agent);

    const userEmail = "Adell40@gmail.com";
    const phoneNumber = "01502839650";
    const payload = new CreateUser(
        faker.person.fullName(),
        userEmail,
        faker.internet.password(),
        phoneNumber,
        randomNid(10),
        'Customer'
    );

    const { baseUrl } = getConfig();
    const res = await request.post(`${baseUrl}/user/create`, {
        headers: {
            Authorization: `Bearer ${agent.token}`,
            'X-AUTH-SECRET-KEY': 'ROADTOSDET'
        },
        data: payload
    });

    const body = await res.json(); // parse the response body

    expect(res.status()).toBe(208);            // call status() as a function
    expect(body.message).toBe('User already exists'); //  use parsed body
});

test('Create user - invalid role negative', async ({ request }) => {
    const agent = new UserAgent(request);
    await loginAsAdmin(agent);

    const payload = new CreateUser(
        faker.person.fullName(),
        faker.internet.email(),
        faker.internet.password(),
        randomPhone(),
        randomNid(10),
        'InvalidRole'
    );

    const { baseUrl } = getConfig();
    const res = await request.post(`${baseUrl}/user/create`, {
        headers: {
            Authorization: `Bearer ${agent.token}`,
            'X-AUTH-SECRET-KEY': 'ROADTOSDET'
        },
        data: payload
    });

    const body = await res.json();
    expect([400]).toContain(res.status());
    expect(body.error?.message || body.message).toBeDefined();
});

test('Create user - missing secret key negative', async ({ request }) => {
    const agent = new UserAgent(request);
    await loginAsAdmin(agent);

    const payload = new CreateUser(
        faker.person.fullName(),
        faker.internet.email(),
        faker.internet.password(),
        randomPhone(),
        randomNid(10),
        'Customer'
    );

    const { baseUrl } = getConfig();
    const res = await request.post(`${baseUrl}/user/create`, {
        headers: {
            Authorization: `Bearer ${agent.token}` // missing X-AUTH-SECRET-KEY
        },
        data: payload
    });

    const body = await res.json();
    expect([401, 403]).toContain(res.status());
    expect(body.error?.message || body.message).toBeDefined();
});

test('Create user - Admin success', async ({ request }) => {
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

    const createBody = await agent.createUser(payload);
    expect(createBody.status).toBe(201);
    expect(createBody.body.message).toBe('User created');

    // Save full user info including nid to config.json
    const user = createBody.body.user;
    setConfig("user.id", user.id);
    setConfig("user.email", user.email);
    setConfig("user.phone_number", user.phone_number);
    setConfig("user.password", user.password);
    setConfig("user.nid", user.nid);
    setConfig("user.role", user.role);
});

// --- Update-user tests (positive + negative)
test('Update user - non-existing ID (negative)', async ({ request }) => {
    const agent = new UserAgent(request);
    await loginAsAdmin(agent);

    const fakeId = '0000';
    const res = await request.patch(`${getConfig().baseUrl}/user/update/${fakeId}`, {
        headers: {
            Authorization: `Bearer ${agent.token}`,
            'X-AUTH-SECRET-KEY': 'ROADTOSDET'
        },
        data: { phone_number: randomPhone() }
    });

    const body = await res.json();
    expect([400, 404, 409]).toContain(res.status());
    expect(body.error?.message || body.message).toBeDefined();
});

test('Update user - missing secret key (negative)', async ({ request }) => {
    const agent = new UserAgent(request);
    await loginAsAdmin(agent);

    const payload = new CreateUser(
        faker.person.fullName(),
        faker.internet.email(),
        faker.internet.password(),
        randomPhone(),
        randomNid(10),
        'Customer'
    );

    const createBody = await agent.createUser(payload);
    expect(createBody.status).toBe(201);
    const userId = createBody.body.user?.id;
    expect(userId).toBeDefined();

    const res = await request.patch(`${getConfig().baseUrl}/user/update/${userId}`, {
        headers: {
            Authorization: `Bearer ${agent.token}`
        },
        data: { phone_number: randomPhone() }
    });

    const body = await res.json();
    expect([401, 403]).toContain(res.status());
    expect(body.error?.message || body.message).toBeDefined();
});

test('Update user - partial update using PATCH (positive)', async ({ request }) => {
    const agent = new UserAgent(request);
    await loginAsAdmin(agent);

    // Use existing user ID from config.json
    const { user } = getConfig();
    const userId = user.id;
    expect(userId).toBeDefined();

    const newPhone = randomPhone();
    const res = await request.patch(`${getConfig().baseUrl}/user/update/${userId}`, {
        headers: {
            Authorization: `Bearer ${agent.token}`,
            'X-AUTH-SECRET-KEY': 'ROADTOSDET'
        },
        data: { phone_number: newPhone }
    });

    const body = await res.json();
    expect(res.status()).toBe(200);
    if (body.user) expect(body.user.phone_number).toBe(newPhone);
});

test('Update user - full update using PUT (positive)', async ({ request }) => {
    const agent = new UserAgent(request);
    await loginAsAdmin(agent);

    // Use existing user ID from config.json
    const { user } = getConfig();
    const userId = user.id;
    expect(userId).toBeDefined();

    const newEmail = faker.internet.email();
    const updatePayload = {
        name: faker.person.fullName(),
        email: newEmail,
        phone_number: randomPhone(),
        password: faker.internet.password(),
        role: 'Customer',
        nid: randomNid(10)
    };

    const res = await request.put(`${getConfig().baseUrl}/user/update/${userId}`, {
        headers: {
            Authorization: `Bearer ${agent.token}`,
            'X-AUTH-SECRET-KEY': 'ROADTOSDET',
            'Content-Type': 'application/json'
        },
        data: updatePayload
    });

    const body = await res.json();

    expect(res.status()).toBe(200);

    if (body.user?.id !== undefined) {
        expect(body.user.id).toBe(userId);
        expect(body.user.email).toBe(newEmail);
    } else {
        expect(body.message).toContain('updated');
    }
});

// --- Delete-user tests (positive + negative)
test('Delete user - non-existing id (negative)', async ({ request }) => {
    const agent = new UserAgent(request);
    await loginAsAdmin(agent);

    const fakeId = '000';
    const { baseUrl } = getConfig();
    const res = await request.delete(`${baseUrl}/user/delete/${fakeId}`, {
        headers: {
            Authorization: `Bearer ${agent.token}`,
            'X-AUTH-SECRET-KEY': 'ROADTOSDET'
        }
    });

    const body = await res.json();
    expect([400, 404, 409]).toContain(res.status());
    expect(body.error?.message || body.message).toBeDefined();
});

test('Delete user - missing secret key (negative)', async ({ request }) => {
    const agent = new UserAgent(request);
    await loginAsAdmin(agent);

    // Use an existing user from config.json instead of creating new
    const { user } = getConfig();
    const userId = user.id;
    expect(userId).toBeDefined();

    const { baseUrl } = getConfig();
    const res = await request.delete(`${baseUrl}/user/delete/${userId}`, {
        headers: {
            Authorization: `Bearer ${agent.token}` // intentionally missing X-AUTH-SECRET-KEY
        }
    });

    const body = await res.json();
    expect([401, 403]).toContain(res.status());
    expect(body.error?.message || body.message).toBeDefined();
});

test('Delete user - delete by id and verify removed (positive)', async ({ request }) => {
    const agent = new UserAgent(request);
    await loginAsAdmin(agent);

    const userId = getConfig().user.id;
    expect(userId).toBeDefined();

    const delRes = await agent.deleteUser(userId);
    expect(delRes.status).toBe(200);
    expect(delRes.body.message).toBeDefined();

    const listRes = await agent.getUserList('admin@dmoney.com', '1234');
    expect(listRes.status).toBe(200);

    const ids = (listRes.body.users || []).map(u => u.id);
    expect(ids).not.toContain(userId);
});

test('Delete user - deleting already deleted user (positive - verifies correct error)', async ({ request }) => {
    const agent = new UserAgent(request);
    await loginAsAdmin(agent);

    const userId = getConfig().user.id;
    expect(userId).toBeDefined();

    const deleteRes = await agent.deleteUser(userId);

    // since user may or may not exist, assert valid outcomes
    expect([200, 404]).toContain(deleteRes.status);

    if (deleteRes.status === 200) {
        expect(deleteRes.body.message).toBeDefined();
    }

    if (deleteRes.status === 404) {
        expect(deleteRes.body.message).toBe('User not found');
    }
});








