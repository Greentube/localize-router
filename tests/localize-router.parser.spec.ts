import {Injector} from '@angular/core';
import {LocalizeParser, ManualParserLoader} from '../src/localize-router.parser';
import {getTestBed, TestBed, fakeAsync, tick} from '@angular/core/testing';
import {Routes} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {TranslateService} from '@ngx-translate/core';
import {Location, CommonModule} from '@angular/common';

class FakeTranslateService {
  defLang: string;
  currentLang: string;

  browserLang: string = '';

  content: any = {
    'PREFIX.home': 'home_TR',
    'PREFIX.about': 'about_TR'
  };

  setDefaultLang(lang: string) { this.defLang = lang; }
  getDefaultLang() { return this.defLang; }
  use(lang: string) {
    this.currentLang = lang;
    return Observable.of(this.content);
  }
  get(input: string) { return Observable.of(this.content[input] || input); }

  getBrowserLang() { return this.browserLang; }
}

class FakeLocation {
  path():string {
    return "";
  }
}

class DummyComponent {}

describe('LocalizeParser', () => {
  let injector: Injector;
  let loader: ManualParserLoader;
  let translate: TranslateService;
  let location: Location;

  let routes: Routes;
  let locales: string[];
  let prefix = 'PREFIX.';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CommonModule],
      providers: [
        {provide: TranslateService, useClass: FakeTranslateService},
        {provide: Location, useClass: FakeLocation}
      ]
    });
    routes = [
      { path: '', redirectTo: 'some/path' },
      { path: 'some/path', children: [
        { path: '', redirectTo: 'nothing' },
        { path: 'else/:id', redirectTo: 'nothing/else' }
      ]}
    ];
    locales = ['en', 'de', 'fr'];
    localStorage.removeItem('LOCALIZE_LOCAL_STORAGE');
    injector = getTestBed();
    translate = injector.get(TranslateService);
    location = injector.get(Location);
    loader = new ManualParserLoader(translate, location);
  });

  afterEach(() => {
    injector = undefined;
    translate = undefined;
    loader = undefined;
  });

  it('is defined', () => {
    expect(ManualParserLoader).toBeDefined();
    expect(loader).toBeDefined();
    expect(loader instanceof LocalizeParser).toEqual(true);
  });

  it('should set default locales if not set', () => {
    expect(loader.locales).toEqual(['en']);
  });

  it('should set locales on init', () => {
    loader = new ManualParserLoader(translate, location, locales, prefix);
    expect(loader.locales).toEqual(locales);
  });

  it('should extract language from url on getLocationLang', () => {
    loader = new ManualParserLoader(translate, location, locales, prefix);

    expect(loader.getLocationLang('/en/some/path/after')).toEqual('en');
    expect(loader.getLocationLang('de/some/path/after')).toEqual('de');
  });

  it('should return null on getLocationLang if lang not found', () => {
    loader = new ManualParserLoader(translate, location, locales, prefix);

    expect(loader.getLocationLang('/se/some/path/after')).toEqual(null);
    expect(loader.getLocationLang('rs/some/path/after')).toEqual(null);
  });

  it('should call translateRoutes on init if locales passed', fakeAsync(() => {
    loader = new ManualParserLoader(translate, location, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();

    loader.load([]);
    tick();
    expect(loader.translateRoutes).toHaveBeenCalled();
  }));

  it('should not call translateRoutes on init if no locales', fakeAsync(() => {
    loader = new ManualParserLoader(translate, location, [], prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();

    loader.load(routes);
    tick();
    expect(loader.translateRoutes).not.toHaveBeenCalled();
  }));

  it('should set language from navigator params', fakeAsync(() => {
    loader = new ManualParserLoader(translate, location, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();

    (<any>translate)['browserLang'] = 'de';
    localStorage.removeItem('LOCALIZE_DEFAULT_LANGUAGE');

    routes = [];
    loader.load(routes);
    tick();
    expect(routes[0]).toEqual({path: '', redirectTo: 'de', pathMatch: 'full'});
    expect(routes[1]).toEqual({path: 'de', children: []});
    expect(loader.currentLang).toEqual('de');
    expect(translate.currentLang).toEqual('de');
  }));
  it('should set language from localStorage', fakeAsync(() => {
    loader = new ManualParserLoader(translate, location, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();

    (<any>translate)['browserLang'] = 'de';
    localStorage.setItem('LOCALIZE_DEFAULT_LANGUAGE', 'fr');

    routes = [];
    loader.load(routes);
    tick();
    expect(routes[0]).toEqual({path: '', redirectTo: 'fr', pathMatch: 'full'});
    expect(routes[1]).toEqual({path: 'fr', children: []});
    expect(loader.currentLang).toEqual('fr', 'loader currentLang should equal');
    expect(translate.currentLang).toEqual('fr', 'translate currentLang should equal');
  }));

  it('should pick first language from locales if navigator language not recognized', fakeAsync(() => {
    loader = new ManualParserLoader(translate, location, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();

    (<any>translate)['browserLang'] = 'sr';
    localStorage.removeItem('LOCALIZE_DEFAULT_LANGUAGE');

    routes = [];
    loader.load(routes);
    tick();
    expect(routes[0].redirectTo).toEqual('en');
    expect(loader.currentLang).toEqual('en', 'loader currentLang should equal');
    expect(translate.currentLang).toEqual('en', 'translate currentLang should equal');
  }));

  it('should translate path', fakeAsync(() => {
    loader = new ManualParserLoader(translate, location, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();

    (<any>translate)['browserLang'] = 'sr';

    routes = [{path: 'home', component: DummyComponent }];
    loader.load(routes);
    tick();
    expect(routes[1].children[0].path).toEqual('home_TR');
  }));

  it('should not translate path if translation not found', fakeAsync(() => {
    loader = new ManualParserLoader(translate, location, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();
    (<any>translate)['browserLang'] = 'sr';

    routes = [{path: 'abc', component: DummyComponent }];
    loader.load(routes);
    tick();
    expect(routes[1].children[0].path).toEqual('abc');
  }));

  it('should translate redirectTo', fakeAsync(() => {
    loader = new ManualParserLoader(translate, location, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();
    (<any>translate)['browserLang'] = 'sr';

    routes = [{redirectTo: 'home' }];
    loader.load(routes);
    tick();
    expect(routes[1].children[0].redirectTo).toEqual('home_TR');
  }));

  it('should translate complex path segments', fakeAsync(() => {
    loader = new ManualParserLoader(translate, location, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();
    (<any>translate)['browserLang'] = 'sr';

    routes = [{path: '/home/about', component: DummyComponent }];
    loader.load(routes);
    tick();
    expect(routes[1].children[0].path).toEqual('/home_TR/about_TR');
  }));

  it('should translate children', fakeAsync(() => {
    loader = new ManualParserLoader(translate, location, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();
    (<any>translate)['browserLang'] = 'sr';

    routes = [
      { path: 'home', children: [
        {path: 'about', component: DummyComponent }
      ]}
    ];
    loader.load(routes);
    tick();
    expect(routes[1].children[0].path).toEqual('home_TR');
    expect(routes[1].children[0].children[0].path).toEqual('about_TR');
  }));
});
