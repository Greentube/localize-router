import {
  NgModule, ModuleWithProviders, APP_INITIALIZER, Provider, InjectionToken, Optional, SkipSelf,
  Injectable, Injector
} from '@angular/core';
import { HttpModule, Http } from '@angular/http';
import { LocalizeRouterService } from './localize-router.service';
import { LocalizeParser, RAW_ROUTES, StaticParserLoader, DefaultStorageKey } from './localize-router.parser';
import { RouterModule, Routes } from '@angular/router';
import { LocalizeRouterPipe } from './localize-router.pipe';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Location, CommonModule } from '@angular/common';

export const LOCALIZE_ROUTER_FORROOT_GUARD = new InjectionToken('LOCALIZE_ROUTER_FORROOT_GUARD');

/**
 * Helper function for loading external parser
 * @param translate
 * @param location
 * @param http
 * @returns {StaticParserLoader}
 */
export function localizeLoaderFactory(translate: TranslateService, location: Location, storageKey: string, http: Http) {
  return new StaticParserLoader(translate, location, storageKey, http);
}

@Injectable()
export class ParserInitializer {
  parser: LocalizeParser;
  routes: Routes;

  /**
   * CTOR
   * @param injector
   */
  constructor(private injector: Injector) {
  }

  /**
   * @returns {Promise<any>}
   */
  appInitializer(): Promise<any> {
    const res = this.parser.load(this.routes);
    res.then(() => {
      const localize: LocalizeRouterService = this.injector.get(LocalizeRouterService);
      localize.init();
    });

    return res;
  }

  /**
   * @param parser
   * @param routes
   * @returns {()=>Promise<any>}
   */
  generateInitializer(parser: LocalizeParser, routes: Routes[]): () => Promise<any> {
    this.parser = parser;
    this.routes = routes.reduce((a, b) => a.concat(b));
    return this.appInitializer;
  }
}

/**
 * @param p
 * @param parser
 * @param routes
 * @returns {any}
 */
export function getAppInitializer(p: ParserInitializer, parser: LocalizeParser, routes: Routes[]): any {
  return p.generateInitializer(parser, routes).bind(p);
}

@NgModule({
  imports: [HttpModule, CommonModule, RouterModule, TranslateModule],
  declarations: [LocalizeRouterPipe],
  exports: [LocalizeRouterPipe]
})
export class LocalizeRouterModule {

  static forRoot(routes: Routes,
    localizeLoader: Provider = {
      provide: LocalizeParser,
      useFactory: localizeLoaderFactory,
      deps: [TranslateService, Location, DefaultStorageKey, Http]
    }): ModuleWithProviders {
    return {
      ngModule: LocalizeRouterModule,
      providers: [
        {
          provide: LOCALIZE_ROUTER_FORROOT_GUARD,
          useFactory: provideForRootGuard,
          deps: [[LocalizeRouterModule, new Optional(), new SkipSelf()]]
        },
        {
          provide: RAW_ROUTES,
          multi: true,
          useValue: routes
        },
        localizeLoader,
        LocalizeRouterService,
        ParserInitializer,
        {
          provide: APP_INITIALIZER,
          multi: true,
          useFactory: getAppInitializer,
          deps: [ParserInitializer, LocalizeParser, RAW_ROUTES]
        }
      ]
    };
  }

  static forChild(routes: Routes): ModuleWithProviders {
    return {
      ngModule: LocalizeRouterModule,
      providers: [
        {
          provide: RAW_ROUTES,
          multi: true,
          useValue: routes
        }
      ]
    };
  }
}

/**
 * @param localizeRouterModule
 * @returns {string}
 */
export function provideForRootGuard(localizeRouterModule: LocalizeRouterModule): string {
  if (localizeRouterModule) {
    throw new Error(
      `LocalizeRouterModule.forRoot() called twice. Lazy loaded modules should use LocalizeRouterModule.forChild() instead.`);
  }
  return 'guarded';
}
