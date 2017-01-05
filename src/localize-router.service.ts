import { Injectable, Inject, ApplicationRef, OpaqueToken } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Routes, Router, Route, NavigationStart, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { recognize } from "@angular/router/src/recognize";
import { TranslateService } from 'ng2-translate';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { Subject } from "rxjs/Subject";
import 'rxjs/add/observable/forkJoin';

/**
 * Config interface
 */
interface ILocalizeRouteConfig {
  locales: Array<string>;
  prefix: string;
}

/**
 * Static provider for keeping track of routes
 * @type {OpaqueToken}
 */
export const RAW_ROUTUES = new OpaqueToken('RAW_ROUTUES');

/**
 * Abstract class for parsing localization
 */
export abstract class LocalizeParser {
  locales: Array<string>;
  currentLang: string;
  routes: Routes;

  protected prefix: string;
  private originalRouteNames: Routes;

  /**
   * Loader constructor
   * @param translate
   */
  constructor(private translate: TranslateService) {}

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
      // init first routes
      this.routes = routes;
      this.originalRouteNames = JSON.parse(JSON.stringify(routes));

      if (!this.locales.length) {
        return Promise.resolve();
      }
      /** detect current language */
      let locationLang = this.getLocationLang();
      let browserLang = this._getBrowserLang();
      selectedLanguage = locationLang || browserLang || this.locales[ 0 ];
      this.translate.setDefaultLang(browserLang || this.locales[ 0 ]);

      /** mutable operation on routes */
      let children = this.routes.splice(0, this.routes.length,
        { path: '', redirectTo: this.translate.getDefaultLang(), pathMatch: 'full' });
      this.routes.push({ children: children });
    }
    /** translate routes */
    return this.translateRoutes(selectedLanguage);
  }

  /**
   * Translate routes to selected language
   * @param language
   * @returns {Promise<any>}
   */
  public translateRoutes(language: string): Promise<any> {
    this.translate.use(language);
    this.currentLang = language;

    this.routes[1].path = language;
    return this._translateRouteTree(this.routes[1].children, this.originalRouteNames);
  }

  private _translateRouteTree(routes: Routes, originals: Routes): Promise<any> {
    let promises: Promise<any>[] = [];
    routes.forEach((route: Route, index: number) => {
      let original = originals[index];
      if (route.path) {
        promises.push(this._getTranslatePromise(original, route, 'path'));
      }
      if (route.redirectTo) {
        promises.push(this._getTranslatePromise(original, route, 'redirectTo'));
      }
      if (route.children) {
        this._translateRouteTree(route.children, original.children);
      }
    });

    return Promise.all(promises);
  }

  private _getTranslatePromise(target: Route, destination: Route, property: string): Promise<any> {
    let observable = this.translateRoute((<any>target)[property]);
    observable.subscribe((result: string) => {
      (<any>destination)[property] = result;
    });
    return observable.toPromise();
  }

  public translateRoute(path: string): Observable<string> {
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
   * Get user's language set in the browser
   * @returns {any}
   * @private
   */
  private _getBrowserLang(): string {
    if (typeof this.translate.getBrowserLang === 'function') {
      return this.translate.getBrowserLang();
    } else if (navigator) {
      let lang = navigator.language.split( '-' )[ 0 ];
      if (this.locales.indexOf(lang) !== -1) {
        return lang;
      }
    }
    return null;
  }

  /**
   * Get language from url
   * @returns {any}
   * @private
   */
  getLocationLang(url?: string): string {
    let pathSlices = (url || location.pathname).split('/');

    if (pathSlices.length > 1 && this.locales.indexOf(pathSlices[1]) !== -1) {
      return pathSlices[1];
    }
    if (pathSlices.length && this.locales.indexOf(pathSlices[0]) !== -1) {
      return pathSlices[0];
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
   * @param locales
   * @param prefix
   */
  constructor(translate: TranslateService, locales: Array<string> = ['en'], prefix: string = 'ROUTES.') {
    super(translate);
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
   * @param http
   * @param path
   */
  constructor(translate: TranslateService, private http: Http, private path: string = 'assets/locales.json') {
    super(translate);
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

/**
 * Localization service
 *
 * modifyRoutes
 */
@Injectable()
export class LocalizeRouterService {
  routerEvents: Subject<string>;

  /**
   * CTOR
   * @param parser
   * @param router
   * @param appRef
   */
  constructor(public parser: LocalizeParser, private router: Router, private appRef: ApplicationRef) {
    this.router.resetConfig(this.parser.routes);
    this.router.events.subscribe(this._routeChanged());
    this.routerEvents = new Subject<string>();
  }

  /**
   * Change language and navigate to translated route
   * @param lang
   */
  changeLanguage(lang: string) {
    if (lang !== this.parser.currentLang) {
      let currentTree = this.router.parseUrl(location.pathname);

      recognize(this.appRef.componentTypes[0], this.parser.routes, currentTree, location.pathname).subscribe(
        (s: RouterStateSnapshot) => {
          this.parser.translateRoutes(lang).then(() => {
            this.router.navigateByUrl(this.traverseRouteSnapshot(s.root));
          });
        }
      );
    }
  }

  /**
   * Traverses through the tree to assemble new translated url
   * @param snapshot
   * @returns {string}
   */
  private traverseRouteSnapshot(snapshot: ActivatedRouteSnapshot): string {
    if (snapshot.firstChild && snapshot.firstChild.routeConfig && snapshot.firstChild.routeConfig.path) {
      return this.parseSegmentValue(snapshot) + '/' + this.traverseRouteSnapshot(snapshot.firstChild);
    }
    return this.parseSegmentValue(snapshot);
  }

  /**
   * Extracts new segment value based on routeConfig and url
   * @param snapshot
   * @returns {any}
   */
  private parseSegmentValue(snapshot: ActivatedRouteSnapshot): string {
    if (snapshot.routeConfig) {
      let subPathSegments = snapshot.routeConfig.path.split('/');
      return subPathSegments.
      map((s: string, i: number) => s.indexOf(':') === 0 ? snapshot.url[i].path : s).
      join('/');
    }
    return '';
  }

  /**
   * Translate route to current language
   * If new language is explicitly provided then replace language part in url with new language
   * @param path
   * @param prependLanguage
   * @returns {Observable<string>}
   */
  translateRoute(path: string, prependLanguage?: boolean): Observable<string> {
    let startsWithBackslash = path.length && path.indexOf('/') === 0;
    if (prependLanguage === void 0) {
      prependLanguage = startsWithBackslash;
    }
    let interpolated = prependLanguage ?
      startsWithBackslash ? `/${this.parser.currentLang}${path}` : `/${this.parser.currentLang}/${path}` :
      path;

    return this.parser.translateRoute(interpolated);
  }

  /**
   * Event handler to react on route change
   * @returns {(event:any)=>undefined}
   * @private
   */
  private _routeChanged() {
    let self = this;

    return (event: any) => {
      let lang = self.parser.getLocationLang(event.url);
      if (event instanceof NavigationStart && lang && lang !== this.parser.currentLang) {
        this.parser.translateRoutes(lang);

        /** Fire route change event */
        this.routerEvents.next(lang);
      }
    };
  }
}

/**
 * Pre-loading helper functions
 * Necessary evil for AOT
 * @param parser
 * @param routes
 * @returns {any}
 */
export function parserInitializer(parser: LocalizeParser, routes: any) {
  loadRoutes.prototype.parser = parser;
  loadRoutes.prototype.routes = routes.reduce(concatArrays);
  return loadRoutes;
}

export function concatArrays(a: Array<any>, b: Array<any>): Array<any> {
  return a.concat(b);
}

export function loadRoutes() {
  return loadRoutes.prototype.parser.load(loadRoutes.prototype.routes);
}
