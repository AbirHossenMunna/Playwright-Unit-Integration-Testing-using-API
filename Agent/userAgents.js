import { expect } from '@playwright/test';
import Login from '../Modals/login.js';
import CreateUser from '../Modals/CreateUser.js';
import { getConfig, setConfig } from '../Utils/Utils.js';

export default class UserAgent {
  constructor(request) {
    this.request = request;
    this.config = getConfig();
    this.token = this.config.token || null;
    this.baseUrl = this.config.baseUrl || '';
  }

  async login(email, password) {
    const payload = new Login(email, password);

    const res = await fetch(
      `${this.baseUrl}/user/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    const body = await res.json();

    return {
      status: res.status,
      body
    };
  }

  async getUserList(email, password) {
    if (!this.token) {
      await this.login(email, password);
    }

    let res = await this.request.get(`${this.baseUrl}/user/list`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });

    // token expired → relogin
    if (res.status() === 403) {
      console.log('Token expired, logging in again...');
      await this.login(email, password);

      res = await this.request.get(`${this.baseUrl}/user/list`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
    }

    const body = await res.json();

    return {
      status: res.status(),
      body
    };
  }

  async createUser(userPayload) {
    if (!this.token) throw new Error('Token missing — login first');
    const res = await this.request.post(`${this.baseUrl}/user/create`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'X-AUTH-SECRET-KEY': 'ROADTOSDET'
      },
      data: userPayload
    });

    console.log('CREATE USER STATUS:', res.status());
    const body = await res.json();
    console.log('CREATE USER BODY:', body);

    // ✅ only assert if status is 201, otherwise tests fail
    if (res.status() === 201 && body.user) {
      setConfig('user.id', body.user.id);
      setConfig('user.email', body.user.email);
      setConfig('user.phone_number', body.user.phone_number);
      setConfig('user.role', body.user.role || '');
    }

    return { status: res.status(), body };
  }

  async updateUser(userId, data) {
    if (!this.token) throw new Error('Token missing — login first');

    const res = await this.request.patch(
      `${this.baseUrl}/user/update/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'X-AUTH-SECRET-KEY': 'ROADTOSDET'
        },
        data
      }
    );

    const body = await res.json();

    return {
      status: res.status(),
      body
    };
  }

  async deleteUser(userId) {
    if (!this.token) throw new Error('Token missing — login first');

    const res = await this.request.delete(`${this.baseUrl}/user/delete/${userId}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'X-AUTH-SECRET-KEY': 'ROADTOSDET'
      }
    });

    const body = await res.json();

    console.log('DELETE USER STATUS:', res.status());
    console.log('DELETE USER BODY:', body);

    return {
      status: res.status(),
      body
    };
  }
}
