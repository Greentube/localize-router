import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { MembersComponent } from './members/members.component';
import { MembersListComponent } from './members/members-list/members-list.component';
import { BioComponent } from './members/bio/bio.component';
import { LocalizeRouterModule, LocalizeRouterSettings, LocalizeParser, ManualParserLoader } from 'localize-router';
import { TranslateService } from '@ngx-translate/core';
import { Location } from '@angular/common';

export function ManualLoaderFactory(translate: TranslateService, location: Location, settings: LocalizeRouterSettings) {
  return new ManualParserLoader(translate, location, settings, ['en', 'de']);
}

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'members', component: MembersComponent, children: [
    { path: 'membersList', component: MembersListComponent, outlet: 'list' },
    { path: ':id', component: BioComponent, outlet: 'bio' }
  ] },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    LocalizeRouterModule.forRoot(routes, {
      parser: {
        provide: LocalizeParser,
        useFactory: ManualLoaderFactory,
        deps: [TranslateService, Location, LocalizeRouterSettings]
      },
      alwaysSetPrefix: false,
      useCachedLang: false
    })
  ],
  exports: [ RouterModule, LocalizeRouterModule ]
})
export class RoutingModule { }
