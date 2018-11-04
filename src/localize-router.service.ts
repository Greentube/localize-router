import { Inject } from '@angular/core';
import {
  Router,
  NavigationStart,
  ActivatedRouteSnapshot,
  UrlSegment,
  PRIMARY_OUTLET,
  NavigationExtras
} from '@angular/router';
import { Subject } from 'rxjs';
import { pairwise, filter, tap } from 'rxjs/operators';
import { LocalizeParser } from './localize-router.parser';
import { LocalizeRouterSettings } from './localize-router.config';

/**
 * Localization service
 * modifyRoutes
 */
export class LocalizeRouterService {
  routerEvents: Subject<string>;

  /**
   * CTOR
   * @param parser
   * @param settings
   * @param router
   */
  constructor(
    @Inject(LocalizeParser) public parser: LocalizeParser,
    @Inject(LocalizeRouterSettings) public settings: LocalizeRouterSettings,
    @Inject(Router) private router: Router
  ) {
    this.routerEvents = new Subject<string>();
  }

  /**
   * Start up the service
   */
  init(): void {
    this.router.resetConfig(this.parser.routes);
    // subscribe to router events
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationStart),
        pairwise()
      )
      .subscribe(this._routeChanged());
  }

  /**
   * Change language and navigate to translated route
   * @param lang
   */
  changeLanguage(lang: string): void {
    if (lang !== this.parser.currentLang) {
      const rootSnapshot: ActivatedRouteSnapshot = this.router.routerState.snapshot.root;
      const previousLanguage = this.parser.currentLang;

      this.parser.translateRoutes(lang)
        .pipe(
          // reset routes
          tap(() => this.router.resetConfig(this.parser.routes))
        )
        .subscribe(() => {
          const urlSegments = this.traverseSnapshot(
            rootSnapshot,
            true,
            previousLanguage === this.parser.defaultLang
          );

          const navigationExtras: NavigationExtras = {
            ...rootSnapshot.queryParamMap.keys.length ? { queryParams: rootSnapshot.queryParams } : {},
            ...rootSnapshot.fragment ? { fragment: rootSnapshot.fragment } : {}
          };

          // use navigate to keep extras unchanged
          this.router.navigate(urlSegments, navigationExtras);
        });
    }
  }

  /**
   * Traverses through the tree to assemble new translated url
   * @param snapshot
   * @param isRoot
   * @param wasDefaultLanguage
   * @returns {string}
   */
  private traverseSnapshot(snapshot: ActivatedRouteSnapshot,
                           isRoot: boolean = false,
                           wasDefaultLanguage: boolean = false): any[] {

    if (isRoot) {
      if (!snapshot.firstChild) {
        return [''];
      }
      if (this.settings.alwaysSetPrefix) {
        return [`/${this.parser.currentLang}`, ...this.traverseSnapshot(snapshot.firstChild.firstChild)];
      }

      // if it was default route, the second route param is already important
      // otherwise the second part is language and we should skip it
      const firstChild = wasDefaultLanguage ?
        snapshot.firstChild :
        snapshot.firstChild.firstChild;

      if (this.parser.currentLang !== this.parser.defaultLang) {
        return [`/${this.parser.currentLang}`, ...this.traverseSnapshot(firstChild)];

      } else {
        return [...this.traverseSnapshot(firstChild)];
      }
    }

    const urlPart = this.parseSegmentValue(snapshot);

    const outletChildren = snapshot.children
      .filter(child => child.outlet !== PRIMARY_OUTLET);

    const outlets = outletChildren
      .reduce((acc, cur) => ({
        outlets: {
          ...acc.outlets,
          [cur.outlet]: this.parseSegmentValue(cur)
        }
      }), { outlets: {} });

    const primaryChild = snapshot.children.find(child => child.outlet === PRIMARY_OUTLET);

    return [
      urlPart,
      ...snapshot.params ? [snapshot.params] : [],
      ...outletChildren.length ? [outlets] : [],
      ...primaryChild ? this.traverseSnapshot(primaryChild) : []
    ];
  }

  /**
   * Extracts new segment value based on routeConfig and url
   * @param snapshot
   * @returns {string}
   */
  private parseSegmentValue(snapshot: ActivatedRouteSnapshot): string {
    if (snapshot.routeConfig) {
      if (snapshot.routeConfig.path === '**') {
        return snapshot.url
          .filter((segment: UrlSegment) => segment.path)
          .map((segment: UrlSegment) => segment.path)
          .join('/');
      } else {
        let subPathSegments = snapshot.routeConfig.path.split('/');
        return subPathSegments
          .map((s: string, i: number) => s.indexOf(':') === 0 ? snapshot.url[i].path : s)
          .join('/');
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
    // path is null (e.g. resetting auxiliary outlet)
    if (!path) {
      return path;
    }
    if (typeof path === 'string') {
      const url = this.parser.translateRoute(path);
      return !path.indexOf('/') ? `/${this.parser.urlPrefix}${url}` : url;
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
        // translate router outlets block
        if (segment && segment.outlets) {
          let outlets: any = {};
          for (let key in segment.outlets) {
            if (segment.outlets.hasOwnProperty(key)) {
              outlets[key] = this.translateRoute(segment.outlets[key]);
            }
          }
          result.push({ ...segment, outlets: outlets });
        } else {
          result.push(segment);
        }
      }
    });
    return result;
  }

  /**
   * Event handler to react on route change
   * @returns {(event:any)=>void}
   * @private
   */
  private _routeChanged(): (eventPair: [NavigationStart, NavigationStart]) => void {
    return ([previousEvent, currentEvent]: [NavigationStart, NavigationStart]) => {
      const previousLang = this.parser.getLocationLang(previousEvent.url) || this.parser.defaultLang;
      const currentLang = this.parser.getLocationLang(currentEvent.url) || this.parser.defaultLang;

      if (currentLang !== previousLang) {
        // mutate router config directly to avoid getting out of sync
        this.parser.mutateRouterRootRoute(currentLang, previousLang, this.router.config);
        this.parser.translateRoutes(currentLang)
          .pipe(
            // reset routes again once they are all translated
            tap(() => this.router.resetConfig(this.parser.routes))
          )
          .subscribe(() => {
            // Fire route change event
            this.routerEvents.next(currentLang);
          });
      }
    };
  }
}
