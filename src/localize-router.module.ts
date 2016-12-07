import { NgModule, ModuleWithProviders, APP_INITIALIZER, Provider } from '@angular/core';
import { HttpModule, Http } from '@angular/http';
import {
  LocalizeRouterService, LocalizeParser, StaticParserLoader, RAW_ROUTUES, parserInitializer
} from './localize-router.service';
import { RouterModule, Routes } from '@angular/router';
import { LocalizeRouterPipe } from './localize-router.pipe';
import { TranslateModule, TranslateService } from 'ng2-translate';

export * from './localize-router.pipe';
export * from './localize-router.service';

/**
 * Helper function for loading external parser
 * @param translate
 * @param http
 * @returns {StaticParserLoader}
 */
export function localizeLoaderFactory(translate: TranslateService, http: Http) {
  return new StaticParserLoader(translate, http);
}

@NgModule({
  imports: [HttpModule, RouterModule, TranslateModule],
  declarations: [LocalizeRouterPipe],
  exports: [HttpModule, TranslateModule, LocalizeRouterPipe]
})
export class LocalizeRouterModule {

  static forRoot(
    routes: Routes,
    localizeLoader: Provider = {
      provide: LocalizeParser,
      useFactory: localizeLoaderFactory,
      deps: [TranslateService, Http]
    }
  ): ModuleWithProviders {
    return {
      ngModule: LocalizeRouterModule,
      providers: [
        localizeLoader,
        LocalizeRouterService,
        {
          provide: RAW_ROUTUES,
          multi: true,
          useValue: routes
        },
        {
          provide: APP_INITIALIZER,
          useFactory: parserInitializer,
          deps: [LocalizeParser, RAW_ROUTUES],
          multi: true
        }
      ]
    };
  }

  static forChild(routes: Routes): ModuleWithProviders {
    return {
      ngModule: LocalizeRouterModule,
      providers: [{
        provide: RAW_ROUTUES,
        multi: true,
        useValue: routes
      }]
    };
  }
}
