import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LocalizeRouterModule } from 'localize-router';

const routes: Routes = [
  { path: 'lazy', loadChildren: './+lazy/lazy.module#LazyModule' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    LocalizeRouterModule.forRoot(routes)
  ],
  exports: [ RouterModule, LocalizeRouterModule ]
})
export class AppRoutingModule {}
