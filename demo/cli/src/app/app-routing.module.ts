import { NgModule }             from '@angular/core';
import { RouterModule } from '@angular/router';
import { LocalizeRouterModule, LocalizeRouterSettings, LocalizeParser } from 'localize-router';
import { LocalizeRouterHttpLoader } from 'localize-router-http-loader';
import { Http } from '@angular/http';
import { TranslateService } from '@ngx-translate/core';
import { Location } from '@angular/common';

export function HttpLoaderFactory(translate: TranslateService, location: Location, settings: LocalizeRouterSettings, http: Http) {
  return new LocalizeRouterHttpLoader(translate, location, settings, http);
}

const routes = [
  { path: 'lazy', loadChildren: './+lazy/lazy.module#LazyModule' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    LocalizeRouterModule.forRoot(routes, {
      parser: {
        provide: LocalizeParser,
        useFactory: HttpLoaderFactory,
        deps: [TranslateService, Location, LocalizeRouterSettings, Http]
      }
    })
  ],
  exports: [ RouterModule, LocalizeRouterModule ]
})
export class AppRoutingModule {}
