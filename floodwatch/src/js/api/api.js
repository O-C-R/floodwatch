// @flow

import 'whatwg-fetch';
import _ from 'lodash';
import log from 'loglevel';

import { BaseError } from '../common/util';
import type {
  PersonResponse,
  PersonDemographicsRequest,
  FilterPair,
  FiltersResponse,
  GalleryImageRequest,
  GalleryImageResponse,
  ImpressionsRequest,
  ImpressionsResponse,
} from './types';

export class APIError extends BaseError {
  response: ?Response;
  body: ?string;

  constructor(msg: string, res: ?Response, body: ?string) {
    super(msg);
    this.response = res;
    this.body = body;
  }
}
export class AuthenticationError extends APIError {
  constructor(res: ?Response, body: ?string) {
    super('Unauthorized', res, body);
  }
}

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
        body,
      });
    } catch (e) {
      log.error(e);
      log.error('Threw while POSTing', url.toString());
      throw new APIError('HTTP error', res);
    }

    if (!res.ok) {
      const resBody = await res.text();
      if (res.status === 401) {
        log.error('Bad auth while POSTing', url.toString(), resBody);
        throw new AuthenticationError(res, resBody);
      } else {
        log.error('Non-OK response while POSTing', url.toString(), resBody);
        throw new APIError('HTTP error', res, resBody);
      }
    }

    return res;
  }

  async get(path: string, params?: Object): Promise<Response> {
    const url = new URL(path, this.baseUrl);

    if (params) {
      for (const key of Object.keys(params)) {
        url.searchParams.set(key, params[key]);
      }
    }

    log.info('GET', path, params);

    let res;
    try {
      res = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'include',
      });
    } catch (e) {
      log.error(e);
      log.error('Threw while GETing', url.toString());
      throw new APIError('HTTP error', res);
    }

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 401) {
        log.error('Bad auth while GETing', url.toString(), body);
        throw new AuthenticationError(res, body);
      } else {
        log.error('Non-OK response while GETing', url.toString(), body);
        throw new APIError('HTTP error', res, body);
      }
    }

    return res;
  }

  async postForm(path: string, body?: Object): Promise<string> {
    const data = new FormData();

    if (body) {
      for (const key of Object.keys(body)) {
        data.append(key, body[key]);
      }
    }

    const res = await this.post(path, data);
    return res.text();
  }

  async postJSON(path: string, body?: Object): Promise<any> {
    const res = await this.post(path, JSON.stringify(body));
    if (res.status === 204) {
      return null;
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
export default class FWApiClient extends APIClient {
  unauthorizedHandler: () => void;
  static fwApiClientInstance: ?FWApiClient;

  constructor(baseUrl: string, unauthorizedHandler: () => void) {
    super(baseUrl);

    this.unauthorizedHandler = unauthorizedHandler;
  }

  static setup(baseUrl: string, unauthorizedHandler: () => void): FWApiClient {
    if (!FWApiClient.fwApiClientInstance) {
      FWApiClient.fwApiClientInstance = new FWApiClient(
        baseUrl,
        unauthorizedHandler,
      );
    }

    return FWApiClient.fwApiClientInstance;
  }

  static get(): FWApiClient {
    if (!FWApiClient.fwApiClientInstance) {
      throw new APIError('API has not been set up!');
    }

    return FWApiClient.fwApiClientInstance;
  }

  /* eslint class-methods-use-this: ["error", {
    "exceptMethods": ["onAuthError", "onLogin", "onLogout", "loggedIn"]
  }] */
  /* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }] */

  onAuthError(_e: AuthenticationError) {
    if (this.loggedIn()) {
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
      return await super.post(path, body);
    } catch (e) {
      if (e instanceof AuthenticationError) {
        this.onAuthError(e);
      }

      throw e;
    }
  }

  async get(path: string, params?: Object): Promise<any> {
    try {
      return await super.get(path, params);
    } catch (e) {
      if (e instanceof AuthenticationError) {
        this.onAuthError(e);
      }

      throw e;
    }
  }

  async getCurrentPerson(): Promise<PersonResponse> {
    // response has no content, so any non-error means success
    try {
      const res: PersonResponse = await this.getJSON('/api/person/current');

      // Also this method acts as a proxy for logging in sometimes...
      this.onLogin();

      return res;
    } catch (e) {
      // If this method isn't returning, something's wrong.
      this.onAuthError(e);
      throw e;
    }
  }

  async updatePersonDemographics(
    options: PersonDemographicsRequest,
  ): Promise<PersonResponse> {
    return this.postJSON('/api/person/demographics', options);
  }

  async register(
    username: string,
    email: ?string,
    password: string,
  ): Promise<void> {
    await this.postForm('/api/register', { username, email, password });
  }

  async login(username: string, password: string): Promise<void> {
    // response has no content, so any non-error means success
    await this.postForm('/api/login', { username, password });
    this.onLogin();
  }

  async getLocationOptions(place: string) {
    const res = this.getJSON(
      `/api/twofishes?query=${place}&maxInterpretations=5`,
    );
    return res;
  }

  async getDecodedLocation(id: string) {
    const res = this.getJSON(`/api/twofishes?slug=${id}`);
    return res;
  }

  async logout(): Promise<void> {
    await this.postForm('/api/logout');
    this.onLogout();
  }

  async getFilteredAdCounts(f: FilterPair): Promise<FiltersResponse> {
    // TODO: move this somewhere better
    const cpy = _.cloneDeep(f);
    if (cpy.filter_a.demographics) {
      for (let i = cpy.filter_a.demographics.length - 1; i >= 0; --i) {
        if (cpy.filter_a.demographics[i].values.length === 0) {
          cpy.filter_a.demographics = cpy.filter_a.demographics.splice(i, 1);
        }
      }
    }
    if (cpy.filter_b.demographics) {
      for (let i = cpy.filter_b.demographics.length - 1; i >= 0; --i) {
        if (cpy.filter_b.demographics[i].values.length === 0) {
          cpy.filter_b.demographics = cpy.filter_b.demographics.splice(i, 1);
        }
      }
    }
    return this.postJSON('/api/recorded_ads/filtered', f);
  }

  startPasswordReset(email: string): Promise<void> {
    return this.postJSON('/api/reset_password/start', { email });
  }

  completePasswordReset(token: string, password: string): Promise<void> {
    return this.postJSON('/api/reset_password/complete', {
      password_reset_token: token,
      password,
    });
  }

  requestGalleryImage(req: GalleryImageRequest): Promise<GalleryImageResponse> {
    return this.postJSON('/api/recorded_ads/screenshot', req);
  }

  getGalleryImage(slug: string): Promise<GalleryImageResponse> {
    return this.getJSON(`/api/gallery/image/${slug}`);
  }

  getImpressionsPaged(req: ImpressionsRequest): Promise<ImpressionsResponse> {
    return this.getJSON('/api/recorded_ads/impressions', req);
  }
}
