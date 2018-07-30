import { Injectable } from '@angular/core';
import { of, Observable } from 'rxjs';

@Injectable()
export class TranslateServiceMock {
  defLang: string;
  currentLang: string;

  browserLang: string = '';

  content: any = {
    'PREFIX.home': 'home_TR',
    'PREFIX.about': 'about_TR'
  };

  setDefaultLang = (lang: string) => { this.defLang = lang; };
  use = (lang: string) => { this.currentLang = lang; };
  get: (input: string) => Observable<any> = (input: string) => of(this.content[input] || input);
  getBrowserLang = () => this.browserLang;
}
