import { Injectable } from '@angular/core';
import { Router, NavigationStart, ActivatedRouteSnapshot, NavigationExtras, Route } from '@angular/router';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';

import { LocalizeParser } from './localize-router.parser';
import { LocalizeRouterSettings } from './localize-router.config';

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
  constructor(public parser: LocalizeParser, public settings: LocalizeRouterSettings, private router: Router) {
    this.routerEvents = new Subject<string>();
  }

  /**
   * Start up the service
   */
  init(): void {
    this.router.resetConfig(this.parser.routes);
    this.router.events.subscribe(this._routeChanged());
  }

  /**
   * Change language and navigate to translated route
   * @param lang
   * @param extras
   * @param useNavigateMethod
   */
  changeLanguage(lang: string, extras?: NavigationExtras, useNavigateMethod?: boolean): void {
    if (lang !== this.parser.currentLang) {
      let rootSnapshot: ActivatedRouteSnapshot = this.router.routerState.snapshot.root;

      this.parser.translateRoutes(lang).subscribe(() => {
        let url = this.traverseRouteSnapshot(rootSnapshot);

        if (!this.settings.alwaysSetPrefix) {
          //If the default language has no prefix make sure to remove and add it when necessary
          if (this.parser.currentLang == this.parser.defaultLang) {
            //Remove the language prefix from url when current language is the default language
            if (url.indexOf(this.parser.currentLang + '/') === -1) {
              url = url.substring((this.parser.currentLang + '/').length - 1);
            }
          } else if (this.parser.currentLang != this.parser.defaultLang) {
            //When coming from a default language it's possible that the url doesn't contain the language, make sure it does.
            if (url.indexOf(this.parser.currentLang + '/') === -1) {
              var urls = url.split('/');
              //If the url starts with a slash make sure to keep it.
              if (urls[0] === '') {
                urls.splice(1, 0, this.parser.currentLang);
              } else {
                urls.splice(0, 0, this.parser.currentLang);
              }
              url = urls.join('/');
            }
          }
        }

        if (useNavigateMethod) {
          this.router.navigate([url], extras);
        } else {
          this.router.navigateByUrl(url, extras);
        }
      });
    }
  }

  /**
   * Traverses through the tree to assemble new translated url
   * @param snapshot
   * @returns {string}
   */
  private traverseRouteSnapshot(snapshot: ActivatedRouteSnapshot): string {
    if (snapshot.firstChild && snapshot.firstChild.routeConfig && snapshot.firstChild.routeConfig.path && snapshot.firstChild.routeConfig.path != '**') {
      return this.parseSegmentValue(snapshot) + '/' + this.traverseRouteSnapshot(snapshot.firstChild);
    } else if (snapshot.firstChild && snapshot.firstChild.routeConfig && snapshot.firstChild.routeConfig.path && snapshot.firstChild.routeConfig.path == '**') {
      return this.parseSegmentValue(snapshot.firstChild);
    }
    return this.parseSegmentValue(snapshot);
  }

  /**
   * Extracts new segment value based on routeConfig and url
   * @param snapshot
   * @returns {string}
   */
  private parseSegmentValue(snapshot: ActivatedRouteSnapshot): string {
    if (snapshot.routeConfig) {
      if (snapshot.routeConfig.path == '**') {
        let urls = [];
        for (let subPathSegment of snapshot.url) {
          if (subPathSegment.path) urls.push(subPathSegment.path);
        }
        return urls.join('/');
      } else {
        let subPathSegments = snapshot.routeConfig.path.split('/');
        return subPathSegments.map((s: string, i: number) => s.indexOf(':') === 0 ? snapshot.url[i].path : s).join('/');
      }
    }
    return '';
  }

  /**
   * Translate route to current language
   * If new language is explicitly provided then replace language part in url with new language
   * @param path
   * @returns {string | any[]}
   */
  translateRoute(path: string | any[]): string | any[] {
    if (typeof path === 'string') {
      let result = this.parser.translateRoute(path);
      return !path.indexOf('/') ? `/${this.parser.urlPrefix}${result}` : result;
    }
    // it's an array
    let result: any[] = [];
    (path as Array<any>).forEach((segment: any, index: number) => {
      if (typeof segment === 'string') {
        const res = this.parser.translateRoute(segment);
        if (!index && !segment.indexOf('/')) {
          result.push(`/${this.parser.urlPrefix}${res}`);
        } else {
          result.push(res);
        }
      } else {
        result.push(segment);
      }
    });
    return result;
  }

  /**
   * Event handler to react on route change
   * @returns {(event:any)=>void}
   * @private
   */
  private _routeChanged(): ((event: any) => void) {
    let self = this;

    return (event: any) => {
      let lang = this.parser.getLocationLang(event.url);
      if (event instanceof NavigationStart && lang && lang !== this.parser.currentLang) {
        this.parser.translateRoutes(lang).subscribe(() => {
          // Fire route change event
          this.routerEvents.next(lang);
        });
      }
      // This value does not exist in Router before version 4
      // so we have to find it indirectly
      if (event.toString().match(/RouteConfigLoadEnd/)) {
        Observable.of(event.route).toPromise().then(function (route: Route) {
          self.parser.initChildRoutes((<any>route)._loadedConfig.routes);
        });
      }
    };
  }
}
