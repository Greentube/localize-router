import { Http, Response } from '@angular/http';
import { OpaqueToken } from '@angular/core';
import { Routes, Route } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { Location } from '@angular/common';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/operator/toPromise';

const LOCALIZE_LOCAL_STORAGE = 'LOCALIZE_LOCAL_STORAGE';

/**
 * Static provider for keeping track of routes
 * @type {OpaqueToken}
 */
export const RAW_ROUTES = new OpaqueToken('RAW_ROUTES');

/**
 * Config interface
 */
export interface ILocalizeRouteConfig {
  locales: Array<string>;
  prefix: string;
}

/**
 * Abstract class for parsing localization
 */
export abstract class LocalizeParser {
  locales: Array<string>;
  currentLang: string;
  routes: Routes;

  protected prefix: string;
  private originalRouteNames: Routes;
  private originalWildcard: Route;

  /**
   * Loader constructor
   * @param translate
   * @param location
   */
  constructor(private translate: TranslateService, private location: Location) {}

  /**
   * Load routes and fetch necessary data
   * @param routes
   */
  abstract load(routes: Routes): Promise<any>;

  /**
   * Initialize language and routes
   * @param routes
   * @returns {Promise<any>}
   */
  protected init(routes: Routes): Promise<any> {
    let selectedLanguage: string;

    if (this.routes) {
      // add new routes
      selectedLanguage = this.currentLang;
      // append new routes
      this.originalRouteNames.splice(0, 0, ...JSON.parse(JSON.stringify(routes)));
      this.routes[1].children.splice(0, 0, ...routes);
    } else {
      // extract potential wildcard route
      let wildcardIndex = routes.findIndex((route: Route) => route.path === '**');
      let wildcardRoute: Route;
      if (wildcardIndex !== -1) {
        wildcardRoute = routes.splice(wildcardIndex, 1)[0];
        this.originalWildcard = JSON.parse(JSON.stringify(wildcardRoute));
      }

      // init routes
      this.routes = routes;
      this.originalRouteNames = JSON.parse(JSON.stringify(routes));

      if (!this.locales.length) {
        return Promise.resolve();
      }
      /** detect current language */
      let locationLang = this.getLocationLang();
      let defaultLanguage = this._cachedLang || this._getBrowserLang() || this.locales[ 0 ];
      selectedLanguage = locationLang || defaultLanguage;
      this.translate.setDefaultLang(defaultLanguage);

      /** mutable operation on routes */
      let children = this.routes.splice(0, this.routes.length,
        { path: '', redirectTo: this.translate.getDefaultLang(), pathMatch: 'full' });

      /** append children routes... */
      this.routes.push({ children: children });

      /** ...and potential wildcard route */
      if (wildcardRoute) {
        this.routes.push(wildcardRoute);
      }
    }
    /** translate routes */
    return this.translateRoutes(selectedLanguage);
  }

  /**
   * Translate routes to selected language
   * @param language
   * @returns {Promise<any>}
   */
  translateRoutes(language: string): Promise<any> {
    this.translate.use(language);
    this.currentLang = language;
    this._cachedLang = language;
    this.routes[1].path = language;

    let promises: Promise<any>[] = [];
    if (this.originalWildcard && this.originalWildcard.redirectTo) {
      promises.push(this._getTranslatePromise(this.originalWildcard, this.routes[2], 'redirectTo', true));
    }
    promises.push(this._translateRouteTree(this.routes[1].children, this.originalRouteNames));

    // resolve all
    return Promise.all(promises);
  }

  /**
   * Translate the route node and recursively call for all it's children
   * @param routes
   * @param originals
   * @returns {Promise<any>}
   * @private
   */
  private _translateRouteTree(routes: Routes, originals: Routes): Promise<any> {
    let promises: Promise<any>[] = [];
    routes.forEach((route: Route, index: number) => {
      let original = originals[index];
      if (route.path && route.path !== '**') {
        promises.push(this._getTranslatePromise(original, route, 'path'));
      }
      if (route.redirectTo) {
        promises.push(this._getTranslatePromise(original, route, 'redirectTo'));
      }
      if (route.children) {
        promises.push(this._translateRouteTree(route.children, original.children));
      }
    });

    return Promise.all(promises);
  }

  private _getTranslatePromise(target: Route, destination: Route, property: string, prefixLang?: boolean): Promise<any> {
    let observable = this.translateRoute((<any>target)[property]);
    observable.subscribe((result: string) => {
      (<any>destination)[property] = prefixLang ? `${this.currentLang}/${result}` : result;
    });
    return observable.toPromise();
  }

  /**
   * Translate route and return observable
   * @param path
   * @returns {Observable<string>}
   */
  translateRoute(path: string): Observable<string> {
    let pathSegments = path.split('/');

    /** collect observables  */
    let routeObservables: Observable<any>[] = pathSegments.map((part: string) =>
      part.length ?
        this.translate.get(this.prefix + part) :
        Observable.of(part));

    return new Observable<string>((observer: Observer<string>) => {
      Observable.forkJoin(routeObservables).subscribe((translatedSegments: Array<string>) => {
        for (let i = 0; i < translatedSegments.length; i++) {
          if (translatedSegments[i] === this.prefix + pathSegments[i]) {
            translatedSegments[i] = pathSegments[i];
          }
        }
        observer.next(translatedSegments.join('/'));
        observer.complete();
      });
    });
  }


  /**
   * Get language from url
   * @returns {any}
   * @private
   */
  getLocationLang(url?: string): string {
    let pathSlices = (url || this.location.path()).split('/');

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
   * @returns {any}
   * @private
   */
  private _getBrowserLang(): string {
    return this._returnIfInLocales(this.translate.getBrowserLang());
  }

  /**
   * Get language from local storage
   * @returns {string}
   * @private
   */
  private get _cachedLang(): string {
    if(typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return undefined;
    }
    return this._returnIfInLocales(window.localStorage.getItem(LOCALIZE_LOCAL_STORAGE));
  }

  /**
   * Save language to local storage
   * @param value
   * @private
   */
  private set _cachedLang(value: string) {
    if(typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return;
    }
    window.localStorage.setItem(LOCALIZE_LOCAL_STORAGE, value);
  }

  private _returnIfInLocales(value: string): string {
    if (value && this.locales.indexOf(value) !== -1) {
      return value;
    }
    return null;
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
   * @param locales
   * @param prefix
   */
  constructor(translate: TranslateService, location: Location, locales: Array<string> = ['en'], prefix: string = 'ROUTES.') {
    super(translate, location);
    this.locales = locales;
    this.prefix = prefix;
  }

  /**
   * Initialize or append routes
   * @param routes
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
   * @param http
   * @param path
   */
  constructor(translate: TranslateService, location: Location, private http: Http, private path: string = 'assets/locales.json') {
    super(translate, location);
    this._dataLoaded = false;
  }

  /**
   * Initialize or append routes
   * @param routes
   */
  load(routes: Routes): Promise<any> {
    return new Promise((resolve: any) => {
      if (this._dataLoaded) {
        this.init(routes).then(resolve);
      } else {
        this.http.get(`${this.path}`)
          .map((res: Response) => res.json())
          .subscribe((data: ILocalizeRouteConfig) => {
            this._dataLoaded = true;
            this.locales = data.locales;
            this.prefix = data.prefix;
            this.init(routes).then(resolve);
          });
      }
    });
  }
}
