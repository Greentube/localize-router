import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { BioComponent } from './members/bio/bio.component';
import { MembersListComponent } from './members/members-list/members-list.component';
import { MembersComponent } from './members/members.component';
import { HomeComponent } from './home/home.component';
import { RoutingModule } from './app-routing.module';
import { MatButtonModule, MatCardModule, MatToolbarModule, MatGridListModule } from '@angular/material';
import { MembersService } from './members/shared/members.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, '/assets/locales/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    MembersComponent,
    MembersListComponent,
    BioComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [ HttpClient ]
      }
    }),
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatGridListModule,
    RoutingModule
  ],
  providers: [MembersService],
  bootstrap: [AppComponent]
})
export class AppModule { }
