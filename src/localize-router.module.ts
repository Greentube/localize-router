import { NgModule, ModuleWithProviders, APP_INITIALIZER, Provider, OpaqueToken, Optional, SkipSelf } from '@angular/core';
import { HttpModule, Http } from '@angular/http';
import { LocalizeRouterService } from './localize-router.service';
import { LocalizeParser, RAW_ROUTES, StaticParserLoader, parserInitializer } from './localize-router.parser';
import { RouterModule, Routes } from '@angular/router';
import { LocalizeRouterPipe } from './localize-router.pipe';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Location, CommonModule } from '@angular/common';

export * from './localize-router.pipe';
export * from './localize-router.service';
export * from './localize-router.parser';

export const LOCALIZE_ROUTER_FORROOT_GUARD = new OpaqueToken('LOCALIZE_ROUTER_FORROOT_GUARD');

/**
 * Helper function for loading external parser
 * @param translate
 * @param location
 * @param http
 * @returns {StaticParserLoader}
 */
export function localizeLoaderFactory(translate: TranslateService, location: Location, http: Http) {
  return new StaticParserLoader(translate, location, http);
}

@NgModule({
  imports: [HttpModule, CommonModule, RouterModule, TranslateModule],
  declarations: [LocalizeRouterPipe],
  exports: [LocalizeRouterPipe]
})
export class LocalizeRouterModule {

  static forRoot(
    routes: Routes,
    localizeLoader: Provider = {
      provide: LocalizeParser,
      useFactory: localizeLoaderFactory,
      deps: [TranslateService, Location, Http]
    }
  ): ModuleWithProviders {
    return {
      ngModule: LocalizeRouterModule,
      providers: [
        localizeLoader,
        LocalizeRouterService,
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
        {
          provide: APP_INITIALIZER,
          useFactory: parserInitializer,
          deps: [LocalizeParser, RAW_ROUTES],
          multi: true
        }
      ]
    };
  }

  static forChild(routes: Routes): ModuleWithProviders {
    return {
      ngModule: LocalizeRouterModule,
      providers: [{
        provide: RAW_ROUTES,
        multi: true,
        useValue: routes
      }]
    };
  }
}

export function provideForRootGuard(localizeRouterModule: LocalizeRouterModule): any {
  if (localizeRouterModule) {
    throw new Error(
      `LocalizeRouterModule.forRoot() called twice. Lazy loaded modules should use LocalizeRouterModule.forChild() instead.`);
  }
  return 'guarded';
}
