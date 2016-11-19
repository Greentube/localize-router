import { NgModule, ModuleWithProviders, APP_INITIALIZER } from '@angular/core';
import { HttpModule, Http } from '@angular/http';
import {
  LocalizeRouterService, LocalizeParser, StaticParserLoader
} from './localize-router.service';
import { RouterModule, Routes } from '@angular/router';
import { LocalizeRouterPipe } from './localize-router.pipe';
import { TranslateModule, TranslateService } from 'ng2-translate';

/**
 * Helper function for loading external parser
 * @param translate
 * @param http
 * @returns {StaticParserLoader}
 */
export function localizeLoaderFactory(translate: TranslateService, http: Http) {
  return new StaticParserLoader(translate, http, 'assets/locales.json');
}

/**
 * Helper function for localize router initialization
 * @param routes
 * @returns {(parser:LocalizeParser)=>()=>Promise<any>}
 */
export function initializeLocalizeRouterFactory(routes: Routes) {
  return (loader: LocalizeParser) => () => loader.load(routes);
}

@NgModule({
  imports: [HttpModule, RouterModule, TranslateModule],
  declarations: [LocalizeRouterPipe],
  exports: [HttpModule, TranslateModule, LocalizeRouterPipe]
})
export class LocalizeRouterModule {
  static forRoot(
    routes: Routes,
    localizeLoader: any = {
      provide: LocalizeParser,
      useFactory: localizeLoaderFactory,
      deps: [TranslateService, Http]
  }): ModuleWithProviders {
    let localizeInitiator: any = {
      provide: APP_INITIALIZER,
      useFactory: initializeLocalizeRouterFactory(routes),
      deps: [LocalizeParser],
      multi: true
    };

    return {
      ngModule: LocalizeRouterModule,
      providers: [ localizeLoader, localizeInitiator, LocalizeRouterService ]
    };
  }
}
