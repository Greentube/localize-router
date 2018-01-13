import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LocalizeRouterModule, LocalizeRouterSettings, LocalizeParser, ManualParserLoader } from 'localize-router';
import { LocalizeRouterHttpLoader } from 'localize-router-http-loader';
import { TranslateService } from '@ngx-translate/core';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';

//LocalizeRouterHttpLoader need to be updated

// export function HttpLoaderFactory(translate: TranslateService, location: Location, settings: LocalizeRouterSettings, http: HttpClient) {
//   return new LocalizeRouterHttpLoader(translate, location, settings, http);
// }

export function HttpLoaderFactory(location: Location, settings: LocalizeRouterSettings) {
  return new ManualParserLoader(location, settings, ["en", "de"], null);
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
        deps: [Location, LocalizeRouterSettings]
      }
    })
  ],
  exports: [ RouterModule, LocalizeRouterModule ]
})
export class AppRoutingModule {}
