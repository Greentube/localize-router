import { Component } from '@angular/core';
import { LocalizeRouterService } from 'localize-router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  constructor(private localize: LocalizeRouterService) {}

  changeLanguage(lang: string) {
    this.localize.changeLanguage(lang);
  }
}
