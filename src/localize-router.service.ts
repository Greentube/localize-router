import { Injectable, OpaqueToken } from '@angular/core';
import { Router, NavigationStart, ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/observable/forkJoin';

import { LocalizeParser } from './localize-router.parser';

/**
 * Static provider for keeping track of routes
 * @type {OpaqueToken}
 */
export const RAW_ROUTES = new OpaqueToken('RAW_ROUTES');

/**
 * Localization service
 * modifyRoutes
 */
@Injectable()
export class LocalizeRouterService {
  routerEvents: Subject<string>;

  /**
   * CTOR
   * @param parser
   * @param router
   */
  constructor(public parser: LocalizeParser, private router: Router) {
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
      let rootSnapshot: ActivatedRouteSnapshot = this.router.routerState.snapshot.root;

      this.parser.translateRoutes(lang).then(() => {
        this.router.navigateByUrl(this.traverseRouteSnapshot(rootSnapshot));
      });
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
