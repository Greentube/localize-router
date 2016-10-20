import {Injectable, Inject} from '@angular/core';
import {Http, Response} from '@angular/http';
import {Routes, Router, Route, NavigationStart} from '@angular/router';
import {TranslateService} from 'ng2-translate';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import {Subject} from "rxjs/Subject";
import 'rxjs/add/observable/forkJoin';

interface ILocalizeRouteConfig {
  locales: Array<string>;
  prefix: string;
}

/**
 * Abstract class for loading localization
 */
export abstract class LocalizeLoader {
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
    this.originalRouteNames = JSON.parse(JSON.stringify(routes));

    if (!this.locales.length) {
      return Promise.resolve();
    }
    /** detect current language */
    let locationLang = this.getLocationLang();
    let browserLang = this._getBrowserLang();
    let selectedLanguage = locationLang || browserLang || this.locales[0];
    this.translate.setDefaultLang(browserLang || this.locales[0]);

    /** mutable operation on routes */
    let children = this.routes.splice(0, this.routes.length,
      {path: '', redirectTo: this.translate.getDefaultLang(), pathMatch: 'full'});
    this.routes.push({path: selectedLanguage, children: children });
    /** translate routes */

    return this.translateRoutes(selectedLanguage);
  }

  /**
   * Translate routes to selected language
   * @param language
   * @returns {Promise<T>}
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
   * Get user's language set in the browser
   * @returns {any}
   * @private
   */
  private _getBrowserLang(): string {
    if (navigator) {
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
export class LocalizeManualLoader extends LocalizeLoader {

  constructor(
    @Inject(TranslateService) translate: TranslateService,
    locales: Array<string> = ['en'],
    prefix: string = 'ROUTES.'
  ) {
    super(translate);
    this.locales = locales;
    this.prefix = prefix;
  }

  load(routes: Routes): Promise<any> {
    return new Promise((resolve: any) => {
      this.routes = routes;

      this.init(this.routes).then(resolve);
    });
  }
}

/**
 * Load configuration from server
 */
export class LocalizeStaticLoader extends LocalizeLoader {

  constructor(
    @Inject(TranslateService) translate: TranslateService,
    @Inject(Http) private http: Http,
    private path: string = 'assets/locales.json'
  ) {
    super(translate);
  }

  load(routes: Routes): Promise<any> {
    return new Promise((resolve: any) => {
      this.http.get(`${this.path}`)
        .map((res: Response) => res.json())
        .subscribe((data: ILocalizeRouteConfig) => {
          this.locales = data.locales;
          this.prefix = data.prefix;
          this.routes = routes;
          this.init(this.routes).then(resolve);
        });
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
   * @param loader
   * @param router
   */
  constructor(public loader: LocalizeLoader, private router: Router) {
    this.router.resetConfig(this.loader.routes);
    this.router.events.subscribe(this._routeChanged());
    this.routerEvents = new Subject<string>();
  }

  /**
   * Change language and navigate to translated route
   * @param lang
   */
  changeLanguage(lang: string) {
    if (lang !== this.loader.currentLang) {
      let currentTree = this.router.parseUrl(location.pathname);
      let newUrl = location.pathname;
      console.log(currentTree);
      this.loader.translateRoutes(lang).then(() => {
        console.log('done translating');

        // silently change the url
        history.pushState(null, '', newUrl);
      });
      throw new Error('Not implemented yet');
    }
  }

  /**
   * Translate route to current language
   * If new language is explicitly provided then replace language part in url with new language
   * @param path
   * @param appendLanguage
   * @returns {Observable<string>}
   */
  translateRoute(path: string, appendLanguage?: boolean): Observable<string> {
    let startsWithBackslash = path.length && path.indexOf('/') === 0;
    if (appendLanguage === void 0) {
      appendLanguage = startsWithBackslash;
    }
    let interpolated = appendLanguage ?
      startsWithBackslash ? `/${this.loader.currentLang}${path}` : `/${this.loader.currentLang}/${path}` :
      path;

    return this.loader.translateRoute(interpolated);
  }

  /**
   * Event handler to react on route change
   * @returns {(event:any)=>undefined}
   * @private
   */
  private _routeChanged() {
    let self = this;

    return (event: any) => {
      let lang = self.loader.getLocationLang(event.url);
      if (event instanceof NavigationStart && lang && lang !== this.loader.currentLang) {
        this.loader.translateRoutes(lang);

        /** Fire route change event */
        this.routerEvents.next(lang);
      }
    };
  }
}
