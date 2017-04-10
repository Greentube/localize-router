import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutComponent } from './about/about.component';
import { LocalizeRouterModule } from 'localize-router';

const aboutRoutes: Routes = [
  { path: 'about',  component: AboutComponent },
];

@NgModule({
  imports: [
    RouterModule.forChild(aboutRoutes),
    LocalizeRouterModule.forChild(aboutRoutes)
  ],
  exports: [ RouterModule, LocalizeRouterModule ]
})
export class AboutRoutingModule { }
