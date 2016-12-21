// @flow

import 'whatwg-fetch';
import log from 'loglevel';

import {BaseError} from '../common/util';
import type {PersonResponse, FilterRequest, FilterResponse, PersonDemographics} from './types';

export class APIError extends BaseError {}
export class AuthenticationError extends APIError {}

export class APIClient {
  baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async post(path: string, body?: FormData | string): Promise<Response> {
    const url = new URL(path, this.baseUrl);

    log.info('POST', path, body, body);

    let res;
    try {
      res = await fetch(url.toString(), {
        method: 'POST',
        credentials: 'include',
        body
      });
    } catch (e) {
      log.error(e);
      log.error('Threw while POSTing', url.toString());
      throw new APIError('HTTP error');
    }

    if (res.status === 401) {
      log.error('Bad auth while POSTing', url.toString(), await res.text());
      throw new AuthenticationError();
    } else if (!res.ok) {
      log.error('Non-OK response while POSTing', url.toString(), await res.text());
      throw new APIError('HTTP error');
    }

    return res;
  }

  async get(path: string, params?: Object): Promise<Response> {
    const url = new URL(path, this.baseUrl);

    if (params) {
      for (const key in params) {
        url.searchParams.set(key, params[key]);
      }
    }

    log.info('GET', path, params);

    let res;
    try {
      res = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'include'
      });
    } catch (e) {
      log.error(e);
      log.error('Threw while GETing', url.toString());
      throw new APIError('HTTP error');
    }

    if (res.status === 401) {
      log.error('Bad auth while GETing', url.toString(), await res.text());
      throw new AuthenticationError();
    } else if (!res.ok) {
      log.error('Non-OK response while GETing', url.toString(), await res.text());
      throw new APIError('HTTP error');
    }

    return res;
  }

  async postForm(path: string, body?: Object): Promise<string> {
    const data = new FormData();

    if (body) {
      for (const key in body) {
        data.append(key, body[key]);
      }
    }

    const res = await this.post(path, data);
    return res.text();
  }

  async postJSON(path: string, body?: Object): Promise<any> {
    const res = await this.post(path, JSON.stringify(body));
    if (res.status === 204) {
      return null
    }
    return res.json();    
  }

  async getText(path: string, params?: Object): Promise<string> {
    const res = await this.get(path, params);
    return res.text();
  }

  async getJSON(path: string, params?: Object): Promise<any> {
    const res = await this.get(path, params);
    return res.json();
  }
}

const LOGGED_IN_KEY = 'loggedIn';
let fwApiClientInstance: ?FWApiClient;
export class FWApiClient extends APIClient {
  unauthorizedHandler: () => void;

  constructor(baseUrl: string, unauthorizedHandler: () => void) {
    super(baseUrl);

    this.unauthorizedHandler = unauthorizedHandler;
  }

  static setup(baseUrl: string, unauthorizedHandler: () => void): FWApiClient {
    if (!fwApiClientInstance) {
      fwApiClientInstance = new FWApiClient(baseUrl, unauthorizedHandler);
    }

    return fwApiClientInstance;
  }

  static get(): FWApiClient {
    if (!fwApiClientInstance) {
      throw new APIError('API has not been set up!');
    }

    return fwApiClientInstance;
  }

  onAuthError(e: AuthenticationError) {
    if (this.loggedIn) {
      this.unauthorizedHandler();
      this.onLogout();
    }
  }

  onLogin() {
    localStorage.setItem(LOGGED_IN_KEY, 'loggedIn');
  }

  onLogout() {
    localStorage.removeItem(LOGGED_IN_KEY);
  }

  loggedIn(): boolean {
    return localStorage.getItem(LOGGED_IN_KEY) != null;
  }

  async post(path: string, body?: FormData | string): Promise<any> {
    try {
      return super.post(path, body);
    } catch (e) {
      if (e instanceof AuthenticationError) {
        this.onAuthError(e);
      }

      throw e;
    }
  }

  async get(path: string, params?: Object): Promise<any> {
    try {
      return super.get(path, params);
    } catch (e) {
      if (e instanceof AuthenticationError) {
        this.onAuthError(e);
      }

      throw e;
    }
  }

  async getCurrentPerson(): Promise<PersonResponse> {
    // response has no content, so any non-error means success
    const res: PersonResponse = await this.getJSON('/api/person/current');

    // Also this method acts as a proxy for logging in sometimes...
    this.onLogin();

    return res;
  }

  async updatePersonDemographics(options: PersonDemographics): Promise<PersonResponse> {
    return this.postJSON('/api/person/demographics', options);
  }

  async register(username: string, email: ?string, password: string): Promise<void> {
    await this.postForm('/api/register', { username, email, password });
  }

  async login(username: string, password: string): Promise<void> {
    // response has no content, so any non-error means success
    await this.postForm('/api/login', { username, password });
  }

  async getLocationOptions(place: string) {
    const res = this.getJSON('/api/twofishes?query=' + place + '&maxInterpretations=5')
    return res
  }

  async getDecodedLocation(id: string) {
    const res = this.getJSON('/api/twofishes?slug=' + id)
    return res 
  }

  async logout(): Promise<void> {
    await this.postForm('/api/logout');
    this.onLogout();
  }

  async getFilteredAdCounts(f: FilterRequest): Promise<FilterResponse> {
    return this.postJSON('/api/ads/filtered', f);
  }
}
