import {NgModule, ModuleWithProviders, APP_INITIALIZER} from '@angular/core';
import {HttpModule, Http} from '@angular/http';
import {
  LocalizeRouterService, LocalizeLoader, LocalizeStaticLoader,
  LocalizeManualLoader
} from './localize-router.service';
import {RouterModule, Routes} from '@angular/router';
import {LocalizeRouterPipe} from './localize-router.pipe';
import {TranslateModule, TranslateService} from 'ng2-translate';

/**
 * Helper function for loading external loader
 * @param translate
 * @param http
 * @returns {LocalizeStaticLoader}
 */
export function localizeLoaderFactory(translate: TranslateService, http: Http) {
  return new LocalizeStaticLoader(translate, http);
}

/**
 * Helper function for manual loader setting
 * @param translate
 * @param locales
 * @param prefix
 * @returns {LocalizeManualLoader}
 */
export function localizeManualLoaderFactory(translate: TranslateService, locales: Array<string>, prefix: string) {
  return new LocalizeManualLoader(translate, locales, prefix);
}

/**
 * Helper function for localize router initialization
 * @param routes
 * @returns {(loader:LocalizeLoader)=>()=>Promise<any>}
 */
export function initializeLocalizeRouterFactory(routes: Routes) {
  return (loader: LocalizeLoader) => () => loader.load(routes);
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
      provide: LocalizeLoader,
      useFactory: localizeLoaderFactory,
      deps: [TranslateService, Http]
  }): ModuleWithProviders {
    let localizeInitiator: any = {
      provide: APP_INITIALIZER,
      useFactory: initializeLocalizeRouterFactory(routes),
      deps: [LocalizeLoader],
      multi: true
    };

    return {
      ngModule: LocalizeRouterModule,
      providers: [ localizeLoader, localizeInitiator, LocalizeRouterService ]
    };
  }
}
