import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LazyComponent } from './lazy/lazy.component';
import { TranslateModule } from '@ngx-translate/core';
import { LazyRoutingModule } from './lazy-routing.module';
import { SecondLevelComponent } from './second-level/second-level.component';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    LazyRoutingModule
  ],
  declarations: [LazyComponent, SecondLevelComponent]
})
export class LazyModule { }
