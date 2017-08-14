import { NgModule }             from '@angular/core';
import { RouterModule } from '@angular/router';
import { LocalizeRouterModule } from 'localize-router';

const routes = [
  { path: 'lazy', loadChildren: './+lazy/lazy.module#LazyModule' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    LocalizeRouterModule.forRoot(routes, {
      useCachedLang: false
    })
  ],
  exports: [ RouterModule, LocalizeRouterModule ]
})
export class AppRoutingModule {}
