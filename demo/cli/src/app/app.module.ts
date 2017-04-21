import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Http, HttpModule } from '@angular/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HomeModule } from './home/home.module';
import {UsersModule} from "./users/users.module";

export function HttpLoaderFactory(http: Http) {
  return new TranslateHttpLoader(http, '/assets/locales/', '.json');
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [ Http ]
      }
    }),
    // feature modules
    HomeModule,
    UsersModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
