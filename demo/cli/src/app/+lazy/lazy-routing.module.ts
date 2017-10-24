import { NgModule }             from '@angular/core';
import { RouterModule } from '@angular/router';
import { LazyComponent } from './lazy/lazy.component';
import { LocalizeRouterModule } from 'localize-router';
import { SecondLevelComponent } from "./second-level/second-level.component";

const lazyRoutes = [
  { path: '',  component: LazyComponent },
  { path: 'secondlevel',  component: SecondLevelComponent }
];

@NgModule({
  imports: [
    RouterModule.forChild(lazyRoutes),
    LocalizeRouterModule.forChild(lazyRoutes)
  ],
  exports: [ RouterModule, LocalizeRouterModule ]
})
export class LazyRoutingModule { }
