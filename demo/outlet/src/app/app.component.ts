import { Component } from '@angular/core';
import { LocalizeRouterService } from 'localize-router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';

  constructor(private localize: LocalizeRouterService, private router: Router) {
    console.log('PARSER ROUTES', this.localize.parser.routes);
    console.log('ROUTER ROUTES', this.router.config);
  }

  changeLanguage(lang: string) {
    this.localize.changeLanguage(lang);
  }
}
