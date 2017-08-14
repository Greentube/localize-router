import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Routes, Route } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { Location } from '@angular/common';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/share';
import { CacheMechanism, LocalizeRouterSettings } from './localize-router.config';

const COOKIE_EXPIRY = 30; // 1 month

/**
 * Config interface
 */
export interface ILocalizeRouterParserConfig {
  locales: Array<string>;
  prefix?: string;
}

/**
 * Abstract class for parsing localization
 */
@Injectable()
export abstract class LocalizeParser {
  locales: Array<string>;
  currentLang: string;
  routes: Routes;
  defaultLang: string;

  protected prefix: string;

  private translationObject: any;

  /**
   * Loader constructor
   * @param translate
   * @param location
   * @param settings
   */
  constructor(private translate: TranslateService,
              private location: Location,
              private settings: LocalizeRouterSettings) {
  }

  /**
   * Load routes and fetch necessary data
   * @param routes
   * @returns {Promise<any>}
   */
  abstract load(routes: Routes): Promise<any>;

  /**
   * Initialize language and routes
   * @param routes
   * @returns {Promise<any>}
   */
  protected init(routes: Routes): Promise<any> {
    let selectedLanguage: string;
    let wildcardRoute: Route;

    this.routes = routes;

    if (!this.locales.length) {
      return Promise.resolve();
    }
    /** detect current language */
    let locationLang = this.getLocationLang();
    let browserLang = this._getBrowserLang();

    if (this.settings.defaultLangFunction) {
      this.defaultLang = this.settings.defaultLangFunction(this.locales, this._cachedLang, browserLang);
    } else {
      this.defaultLang = this._cachedLang || browserLang || this.locales[0];
    }
    selectedLanguage = locationLang || this.defaultLang;
    this.translate.setDefaultLang(this.defaultLang);

    /** set base route */
    const baseRoute = { path: '', redirectTo: this.defaultLang, pathMatch: 'full' };

    /** extract potential wildcard route */
    let wildcardIndex = routes.findIndex((route: Route) => route.path === '**');
    if (wildcardIndex !== -1) {
      wildcardRoute = routes.splice(wildcardIndex, 1)[0];
    }

    /** mutable operation on routes */
    let children = this.routes.splice(0, this.routes.length, baseRoute);

    /** append children routes... */
    this.routes.push({ children: children });

    /** ...and potential wildcard route */
    if (wildcardRoute) {
      this.routes.push(wildcardRoute);
    }

    /** translate routes */
    const res = this.translateRoutes(selectedLanguage);
    return res.toPromise();
  }

  initChildRoutes(routes: Routes) {
    if (!this.translationObject) {
      // not lazy, it will be translated in main init
      return routes;
    }

    this._translateRouteTree(routes);
    return routes;
  }

  /**
   * Translate routes to selected language
   * @param language
   * @returns {Promise<any>}
   */
  translateRoutes(language: string): Observable<any> {
    return new Observable<any>((observer: Observer<any>) => {
      this._cachedLang = language;
      if (this.routes.length > 1) {
        this.routes[1].path = language;
      }

      this.translate.use(language).subscribe((translations: any) => {
        this.translationObject = translations;
        this.currentLang = language;

        if (this.routes.length > 1) {
          this._translateRouteTree(this.routes[1].children);
        }
        // if there is wildcard route
        if (this.routes.length > 2 && this.routes[2].redirectTo) {
          this._translateProperty(this.routes[2], 'redirectTo', true);
        }

        observer.next(void 0);
        observer.complete();
      });
    });
  }

  /**
   * Translate the route node and recursively call for all it's children
   * @param routes
   * @private
   */
  private _translateRouteTree(routes: Routes): void {
    routes.forEach((route: Route) => {
      if (route.path && route.path !== '**') {
        this._translateProperty(route, 'path');
      }
      if (route.redirectTo) {
        this._translateProperty(route, 'redirectTo', !route.redirectTo.indexOf('/'));
      }
      if (route.children) {
        this._translateRouteTree(route.children);
      }
      if (route.loadChildren && (<any>route)._loadedConfig) {
        this._translateRouteTree((<any>route)._loadedConfig.routes);
      }
    });
  }

  /**
   * Translate property and if first time add original to cache
   * @param route
   * @param property
   * @param prefixLang
   * @private
   */
  private _translateProperty(route: Route, property: string, prefixLang?: boolean): void {
    // set property to data if not there yet
    let dataPointer: any = route.data = route.data || {};
    if (!dataPointer.localizeRouter) {
      dataPointer.localizeRouter = {};
    }
    if (!dataPointer.localizeRouter[property]) {
      dataPointer.localizeRouter[property] = (<any>route)[property];
    }

    let result = this.translateRoute(dataPointer.localizeRouter[property]);
    (<any>route)[property] = prefixLang ? `/${this.currentLang}${result}` : result;
  }

  /**
   * Translate route and return observable
   * @param path
   * @returns {string}
   */
  translateRoute(path: string): string {
    let pathSegments = path.split('/');

    /** collect observables  */
    return pathSegments.map((part: string) => part.length ? this.translateText(part) : part).join('/');
  }

  /**
   * Get language from url
   * @returns {string}
   * @private
   */
  getLocationLang(url?: string): string {
    let queryParamSplit = (url || this.location.path()).split('?');
    let pathSlices: string[] = [];
    if (queryParamSplit.length > 0) {
      pathSlices = queryParamSplit[0].split('/');
    }
    if (pathSlices.length > 1 && this.locales.indexOf(pathSlices[1]) !== -1) {
      return pathSlices[1];
    }
    if (pathSlices.length && this.locales.indexOf(pathSlices[0]) !== -1) {
      return pathSlices[0];
    }
    return null;
  }

  /**
   * Get user's language set in the browser
   * @returns {string}
   * @private
   */
  private _getBrowserLang(): string {
    return this._returnIfInLocales(this.translate.getBrowserLang());
  }

  /**
   * Get language from local storage or cookie
   * @returns {string}
   * @private
   */
  private get _cachedLang(): string {
    if (!this.settings.useCachedLang) {
      return;
    }
    if (this.settings.cacheMechanism === CacheMechanism.LocalStorage) {
      return this._cacheWithLocalStorage();
    }
    if (this.settings.cacheMechanism === CacheMechanism.Cookie) {
      return this._cacheWithCookies();
    }
  }

  /**
   * Save language to local storage or cookie
   * @param value
   * @private
   */
  private set _cachedLang(value: string) {
    if (!this.settings.useCachedLang) {
      return;
    }
    if (this.settings.cacheMechanism === CacheMechanism.LocalStorage) {
      this._cacheWithLocalStorage(value);
    }
    if (this.settings.cacheMechanism === CacheMechanism.Cookie) {
      this._cacheWithCookies(value);
    }
  }

  /**
   * Cache value to local storage
   * @param value
   * @returns {string}
   * @private
   */
  private _cacheWithLocalStorage(value?: string): string {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return;
    }
    try {
      if (value) {
        window.localStorage.setItem(this.settings.cacheName, value);
        return;
      }
      return this._returnIfInLocales(window.localStorage.getItem(this.settings.cacheName));
    } catch (e) {
      // weird Safari issue in private mode, where LocalStorage is defined but throws error on access
      return;
    }
  }

  /**
   * Cache value via cookies
   * @param value
   * @private
   */
  private _cacheWithCookies(value?: string): string {
    if (typeof document === 'undefined' || typeof document.cookie === 'undefined') {
      return;
    }
    try {
      const name = encodeURIComponent(this.settings.cacheName);
      if (value) {
        let d: Date = new Date();
        d.setTime(d.getTime() + COOKIE_EXPIRY * 86400000); // * days
        document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()}`;
        return;
      }
      const regexp = new RegExp('(?:^' + name + '|;\\s*' + name + ')=(.*?)(?:;|$)', 'g');
      const result = regexp.exec(document.cookie);
      return decodeURIComponent(result[1]);
    } catch (e) {
      return; // should not happen but better safe than sorry
    }
  }

  /**
   * Check if value exists in locales list
   * @param value
   * @returns {any}
   * @private
   */
  private _returnIfInLocales(value: string): string {
    if (value && this.locales.indexOf(value) !== -1) {
      return value;
    }
    return null;
  }

  /**
   * Get translated value
   * @param key
   * @returns {any}
   */
  private translateText(key: string): string {
    if (!this.translationObject) {
      return key;
    }
    let res = this.translationObject[this.prefix + key];
    return res || key;
  }
}

/**
 * Manually set configuration
 */
export class ManualParserLoader extends LocalizeParser {

  /**
   * CTOR
   * @param translate
   * @param location
   * @param settings
   * @param locales
   * @param prefix
   */
  constructor(translate: TranslateService, location: Location, settings: LocalizeRouterSettings, locales: Array<string> = ['en'], prefix: string = 'ROUTES.') {
    super(translate, location, settings);
    this.locales = locales;
    this.prefix = prefix || '';
  }

  /**
   * Initialize or append routes
   * @param routes
   * @returns {Promise<any>}
   */
  load(routes: Routes): Promise<any> {
    return new Promise((resolve: any) => {
      this.init(routes).then(resolve);
    });
  }
}

/**
 * Load configuration from server
 */
export class StaticParserLoader extends LocalizeParser {
  private _dataLoaded: boolean;

  /**
   * CTOR
   * @param translate
   * @param location
   * @param settings
   * @param http
   * @param path
   */
  constructor(translate: TranslateService, location: Location, settings: LocalizeRouterSettings, private http: Http, private path: string = 'assets/locales.json') {
    super(translate, location, settings);
    this._dataLoaded = false;
  }

  /**
   * Initialize or append routes
   * @param routes
   * @returns {Promise<any>}
   */
  load(routes: Routes): Promise<any> {
    return new Promise((resolve: any) => {
      if (this._dataLoaded) {
        this.init(routes).then(resolve);
      } else {
        this.http.get(`${this.path}`)
          .map((res: Response) => res.json())
          .subscribe((data: ILocalizeRouterParserConfig) => {
            this._dataLoaded = true;
            this.locales = data.locales;
            this.prefix = data.prefix || '';
            this.init(routes).then(resolve);
          });
      }
    });
  }
}
