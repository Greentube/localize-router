import { Injector } from '@angular/core';
import { LocalizeParser, ManualParserLoader } from '../src/localize-router.parser';
import { getTestBed, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Routes } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { TranslateService } from '@ngx-translate/core';
import { Location, CommonModule } from '@angular/common';
import {
  CACHE_MECHANISM,
  CACHE_NAME,
  DEFAULT_LANG_FUNCTION,
  LocalizeRouterSettings,
  USE_CACHED_LANG,
  CacheMechanism, ALWAYS_SET_PREFIX
} from '../src/localize-router.config';

class FakeTranslateService {
  defLang: string;
  currentLang: string;

  browserLang: string = '';

  content: any = {
    'PREFIX.home': 'home_',
    'PREFIX.about': 'about_',
    'PREFIX.contact': 'contact_',
    'PREFIX.info': 'info_'
  };

  setDefaultLang(lang: string) {
    this.defLang = lang;
  }

  getDefaultLang() {
    return this.defLang;
  }

  use(lang: string) {
    this.currentLang = lang;
    return Observable.of(Object.keys(this.content).reduce((prev: any, key) => {
      prev[key] = this.content[key] + this.currentLang;
      return prev;
    }, {}));
  }

  get(input: string) {
    return Observable.of(this.content[input] ? this.content[input] + this.currentLang : input);
  }

  getBrowserLang() {
    return this.browserLang;
  }
}

class FakeLocation {
  path(): string {
    return '';
  }
}

class DummyComponent {
}

describe('LocalizeParser', () => {
  let injector: Injector;
  let loader: ManualParserLoader;
  let translate: TranslateService;
  let location: Location;
  let settings: LocalizeRouterSettings;

  let routes: Routes;
  let locales: string[];
  let prefix = 'PREFIX.';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CommonModule],
      providers: [
        { provide: TranslateService, useClass: FakeTranslateService },
        { provide: Location, useClass: FakeLocation },
        { provide: USE_CACHED_LANG, useValue: true },
        { provide: DEFAULT_LANG_FUNCTION, useValue: void 0 },
        { provide: CACHE_NAME, useValue: 'LOCALIZE_DEFAULT_LANGUAGE' },
        { provide: CACHE_MECHANISM, useValue: CacheMechanism.LocalStorage },
        { provide: ALWAYS_SET_PREFIX, useValue: true },
        LocalizeRouterSettings
      ]
    });
    routes = [
      { path: '', redirectTo: 'some/path' },
      {
        path: 'some/path', children: [
        { path: '', redirectTo: 'nothing' },
        { path: 'else/:id', redirectTo: 'nothing/else' }
      ]
      }
    ];
    locales = ['en', 'de', 'fr'];
    localStorage.removeItem('LOCALIZE_LOCAL_STORAGE');
    injector = getTestBed();
    translate = injector.get(TranslateService);
    location = injector.get(Location);
    settings = injector.get(LocalizeRouterSettings);
    loader = new ManualParserLoader(translate, location, settings);
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
    loader = new ManualParserLoader(translate, location, settings, locales, prefix);
    expect(loader.locales).toEqual(locales);
  });

  it('should extract language from url on getLocationLang', () => {
    loader = new ManualParserLoader(translate, location, settings, locales, prefix);

    expect(loader.getLocationLang('/en/some/path/after')).toEqual('en');
    expect(loader.getLocationLang('de/some/path/after')).toEqual('de');
    expect(loader.getLocationLang('en')).toEqual('en');
    expect(loader.getLocationLang('en/')).toEqual('en');
    expect(loader.getLocationLang('/en')).toEqual('en');
    expect(loader.getLocationLang('/en/')).toEqual('en');
    expect(loader.getLocationLang('en?q=str')).toEqual('en');
    expect(loader.getLocationLang('en/?q=str')).toEqual('en');
    expect(loader.getLocationLang('/en?q=str')).toEqual('en');
    expect(loader.getLocationLang('/en/q=str')).toEqual('en');
  });

  it('should return null on getLocationLang if lang not found', () => {
    loader = new ManualParserLoader(translate, location, settings, locales, prefix);

    expect(loader.getLocationLang('/se/some/path/after')).toEqual(null);
    expect(loader.getLocationLang('rs/some/path/after')).toEqual(null);
    expect(loader.getLocationLang('')).toEqual(null);
    expect(loader.getLocationLang('/')).toEqual(null);
    expect(loader.getLocationLang('rs')).toEqual(null);
    expect(loader.getLocationLang('rs/')).toEqual(null);
    expect(loader.getLocationLang('/rs')).toEqual(null);
    expect(loader.getLocationLang('/rs/')).toEqual(null);
    expect(loader.getLocationLang('?q=str')).toEqual(null);
    expect(loader.getLocationLang('/?q=str')).toEqual(null);
    expect(loader.getLocationLang('rs?q=str')).toEqual(null);
    expect(loader.getLocationLang('rs/?q=str')).toEqual(null);
    expect(loader.getLocationLang('/rs?q=str')).toEqual(null);
    expect(loader.getLocationLang('/rs/q=str')).toEqual(null);
  });

  it('should call translateRoutes on init if locales passed', fakeAsync(() => {
    loader = new ManualParserLoader(translate, location, settings, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();

    loader.load([]);
    tick();
    expect(loader.translateRoutes).toHaveBeenCalled();
  }));

  it('should not call translateRoutes on init if no locales', fakeAsync(() => {
    loader = new ManualParserLoader(translate, location, settings, [], prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();

    loader.load(routes);
    tick();
    expect(loader.translateRoutes).not.toHaveBeenCalled();
  }));

  it('should set language from navigator params', fakeAsync(() => {
    loader = new ManualParserLoader(translate, location, settings, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();

    (<any>translate)['browserLang'] = 'de';
    localStorage.removeItem('LOCALIZE_DEFAULT_LANGUAGE');

    routes = [{ path: 'home' }];
    loader.load(routes);
    tick();
    expect(routes[0]).toEqual(
      { path: 'de', children: [{ path: 'home_de', data: { localizeRouter: { path: 'home' } } }] });
    expect(routes[1]).toEqual({ path: '', redirectTo: 'de', pathMatch: 'full' });
    expect(loader.currentLang).toEqual('de');
    expect(translate.currentLang).toEqual('de');
  }));

  it('should set language from localStorage', fakeAsync(() => {
    loader = new ManualParserLoader(translate, location, settings, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();

    (<any>translate)['browserLang'] = 'de';
    localStorage.setItem('LOCALIZE_DEFAULT_LANGUAGE', 'fr');

    routes = [{ path: 'home' }];
    loader.load(routes);
    tick();
    expect(routes[0]).toEqual(
      { path: 'fr', children: [{ path: 'home_fr', data: { localizeRouter: { path: 'home' } } }] });
    expect(routes[1]).toEqual({ path: '', redirectTo: 'fr', pathMatch: 'full' });
    expect(loader.currentLang).toEqual('fr', 'loader currentLang should equal');
    expect(translate.currentLang).toEqual('fr', 'translate currentLang should equal');
  }));

  it('should pick first language from locales if navigator language not recognized', fakeAsync(() => {
    loader = new ManualParserLoader(translate, location, settings, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();

    localStorage.setItem('LOCALIZE_DEFAULT_LANGUAGE', 'en');

    routes = [{ path: 'home' }];
    loader.load(routes);
    tick();
    expect(routes[0].path).toEqual('en');
    expect(routes[1].redirectTo).toEqual('en');
    expect(loader.currentLang).toEqual('en', 'loader currentLang should equal');
    expect(translate.currentLang).toEqual('en', 'translate currentLang should equal');
  }));

  it('should translate path', fakeAsync(() => {
    loader = new ManualParserLoader(translate, location, settings, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();

    localStorage.setItem('LOCALIZE_DEFAULT_LANGUAGE', 'en');

    routes = [{ path: 'home', component: DummyComponent }, { path: '**', component: DummyComponent }];
    loader.load(routes);
    tick();
    expect(routes[0].children[0].path).toEqual('home_en');
    expect(routes.length).toEqual(3);
  }));

  it('should translate path to new language', fakeAsync(() => {
    loader = new ManualParserLoader(translate, location, settings, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();

    localStorage.setItem('LOCALIZE_DEFAULT_LANGUAGE', 'en');

    routes = [{ path: 'home', component: DummyComponent }];
    loader.load(routes);
    tick();
    expect(routes[0].children[0].path).toEqual('home_en');
    loader.translateRoutes('de').subscribe(() => {
      expect(routes[0].children[0].path).toEqual('home_de');
    });
    tick();
  }));

  it('should not translate path if translation not found', fakeAsync(() => {
    loader = new ManualParserLoader(translate, location, settings, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();

    localStorage.setItem('LOCALIZE_DEFAULT_LANGUAGE', 'en');

    routes = [{ path: 'abc', component: DummyComponent }];
    loader.load(routes);
    tick();
    expect(routes[0].children[0].path).toEqual('abc');
  }));

  it('should not translate if prefix does not match', fakeAsync(() => {
    loader = new ManualParserLoader(translate, location, settings, locales);
    spyOn(loader, 'translateRoutes').and.callThrough();

    localStorage.setItem('LOCALIZE_DEFAULT_LANGUAGE', 'en');

    routes = [{ path: 'home', component: DummyComponent }];
    loader.load(routes);
    tick();
    expect(routes[0].children[0].path).toEqual('home');
  }));

  it('should not translate if prefix does not match', fakeAsync(() => {
    loader = new ManualParserLoader(translate, location, settings, locales, null);
    spyOn(loader, 'translateRoutes').and.callThrough();

    localStorage.setItem('LOCALIZE_DEFAULT_LANGUAGE', 'en');

    routes = [{ path: 'home', component: DummyComponent }];
    loader.load(routes);
    tick();
    expect(routes[0].children[0].path).toEqual('home');
  }));

  it('should translate redirectTo', fakeAsync(() => {
    loader = new ManualParserLoader(translate, location, settings, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();

    localStorage.setItem('LOCALIZE_DEFAULT_LANGUAGE', 'en');

    routes = [{ redirectTo: 'home' }];
    loader.load(routes);
    tick();
    expect(routes[0].children[0].redirectTo).toEqual('home_en');
  }));

  it('should translate wildcard redirectTo', fakeAsync(() => {
    loader = new ManualParserLoader(translate, location, settings, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();

    localStorage.setItem('LOCALIZE_DEFAULT_LANGUAGE', 'en');

    routes = [{ path: 'home', component: DummyComponent }, { path: '**', redirectTo: '/home' }];
    loader.load(routes);
    tick();
    expect(routes[2].redirectTo).toEqual('/en/home_en');
  }));

  it('should translate complex path segments', fakeAsync(() => {
    loader = new ManualParserLoader(translate, location, settings, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();

    localStorage.setItem('LOCALIZE_DEFAULT_LANGUAGE', 'en');

    routes = [{ path: '/home/about', component: DummyComponent }];
    loader.load(routes);
    tick();
    expect(routes[0].children[0].path).toEqual('/home_en/about_en');
  }));

  it('should translate children', fakeAsync(() => {
    loader = new ManualParserLoader(translate, location, settings, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();

    localStorage.setItem('LOCALIZE_DEFAULT_LANGUAGE', 'en');

    routes = [
      {
        path: 'home', children: [
        { path: 'about', component: DummyComponent }
      ]
      },
      {
        path: 'contact', children: [
        { path: 'info', component: DummyComponent }
      ]
      }
    ];
    loader.load(routes);
    tick();
    expect(routes[0].children[0].path).toEqual('home_en');
    expect(routes[0].children[0].children[0].path).toEqual('about_en');
  }));

  it('should translate lazy loaded children', fakeAsync(() => {
    loader = new ManualParserLoader(translate, location, settings, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();

    localStorage.setItem('LOCALIZE_DEFAULT_LANGUAGE', 'en');

    routes = <any> [
      {
        path: 'home', children: [
        { path: 'about', component: DummyComponent }
      ]
      },
      {
        path: 'contact',
        loadChildren: '#pathToSomeModule',
        _loadedConfig: { routes: [{ path: 'info', component: DummyComponent }] }
      }
    ];

    loader.load(routes);
    tick();
    expect(routes[0].children[0].path).toEqual('home_en');
    expect(routes[0].children[0].children[0].path).toEqual('about_en');
    expect(routes[0].children[1].path).toEqual('contact_en');
    expect((<any>routes[0].children[1])._loadedConfig.routes[0].path).toEqual('info_en');
  }));

  /**
   * Configuration tests
   */
  it('should not use cached version', fakeAsync(() => {
    settings.useCachedLang = false;
    loader = new ManualParserLoader(translate, location, settings, locales, prefix);

    (<any>translate)['browserLang'] = 'de';
    localStorage.setItem('LOCALIZE_DEFAULT_LANGUAGE', 'fr');

    routes = [{ path: 'home' }];
    loader.load(routes);
    tick();

    expect(routes[0]).toEqual(
      { path: 'de', children: [{ path: 'home_de', data: { localizeRouter: { path: 'home' } } }] });
    expect(routes[1]).toEqual({ path: '', redirectTo: 'de', pathMatch: 'full' });
    expect(loader.currentLang).toEqual('de', 'loader currentLang should equal');
    expect(translate.currentLang).toEqual('de', 'translate currentLang should equal');
  }));
  it('should use cached version', fakeAsync(() => {
    settings.useCachedLang = true;
    loader = new ManualParserLoader(translate, location, settings, locales, prefix);

    (<any>translate)['browserLang'] = 'de';
    localStorage.setItem('LOCALIZE_DEFAULT_LANGUAGE', 'fr');

    routes = [];
    loader.load(routes);
    tick();

    expect(loader.currentLang).toEqual('fr', 'loader currentLang should equal');
    expect(translate.currentLang).toEqual('fr', 'translate currentLang should equal');
  }));

  it('should set different cache name', fakeAsync(() => {
    settings.cacheName = 'MY_CUSTOM_CACHE_NAME';

    loader = new ManualParserLoader(translate, location, settings, locales, prefix);

    localStorage.setItem('MY_CUSTOM_CACHE_NAME', 'fr');
    localStorage.setItem('LOCALIZE_DEFAULT_LANGUAGE', 'de');

    routes = [];
    loader.load(routes);
    tick();

    expect(loader.currentLang).toEqual('fr', 'loader currentLang should equal');
    expect(translate.currentLang).toEqual('fr', 'translate currentLang should equal');
  }));

  it('should add prefix if enforced and single lang', fakeAsync(() => {
    settings.alwaysSetPrefix = true;

    loader = new ManualParserLoader(translate, location, settings, ['de'], prefix);

    localStorage.setItem('LOCALIZE_DEFAULT_LANGUAGE', 'de');

    routes = [{ path: 'home', component: DummyComponent }];
    loader.load(routes);
    tick();

    expect(routes[0]).toEqual({
      path: 'de',
      children: [{ path: 'home_de', component: DummyComponent, data: { localizeRouter: { path: 'home' } } }]
    });
    expect(routes[1]).toEqual({ path: '', redirectTo: 'de', pathMatch: 'full' });
    expect(loader.currentLang).toEqual('de', 'loader currentLang should equal');
    expect(translate.currentLang).toEqual('de', 'translate currentLang should equal');
  }));

  it('should not add prefix if not enforced and single lang', fakeAsync(() => {
    settings.alwaysSetPrefix = false;

    loader = new ManualParserLoader(translate, location, settings, ['de'], prefix);

    localStorage.setItem('LOCALIZE_DEFAULT_LANGUAGE', 'de');

    routes = [{ path: 'home', component: DummyComponent }];
    loader.load(routes);
    tick();

    expect(routes[0]).toEqual(
      { path: 'home_de', component: DummyComponent, data: { localizeRouter: { path: 'home' } } });
    expect(loader.currentLang).toEqual('de', 'loader currentLang should equal');
    expect(translate.currentLang).toEqual('de', 'translate currentLang should equal');
  }));
  it('should add prefix if not enforced and multi lang', fakeAsync(() => {
    settings.alwaysSetPrefix = false;

    loader = new ManualParserLoader(translate, location, settings, ['de', 'en'], prefix);

    localStorage.setItem('LOCALIZE_DEFAULT_LANGUAGE', 'de');

    routes = [{ path: 'home', component: DummyComponent }];
    loader.load(routes);
    tick();

    expect(routes[0]).toEqual({
      path: 'de',
      children: [{ path: 'home_de', component: DummyComponent, data: { localizeRouter: { path: 'home' } } }]
    });
    expect(routes[1]).toEqual(
      { path: 'home_de', component: DummyComponent, data: { localizeRouter: { path: 'home' } } });
    expect(loader.currentLang).toEqual('de', 'loader currentLang should equal');
    expect(translate.currentLang).toEqual('de', 'translate currentLang should equal');
  }));
  it('should exclude certain routes', fakeAsync(() => {
    settings.useCachedLang = false;
    loader = new ManualParserLoader(translate, location, settings, locales, prefix);
    (<any>translate)['browserLang'] = 'de';

    routes = [{ path: 'home' }, { path: 'about', data: { skipRouteLocalization: true } }];
    loader.load(routes);
    tick();

    expect(routes.length).toEqual(3);
    expect(routes[0]).toEqual(
      { path: 'de', children: [{ path: 'home_de', data: { localizeRouter: { path: 'home' } } }] });
    expect(routes[1]).toEqual({ path: '', redirectTo: 'de', pathMatch: 'full' });
    expect(routes[2]).toEqual({ path: 'about', data: { skipRouteLocalization: true } });
  }));

  it('should translate route', fakeAsync(() => {
    loader = new ManualParserLoader(translate, location, settings, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();
    localStorage.setItem('LOCALIZE_DEFAULT_LANGUAGE', 'en');

    routes = [{ path: 'home', component: DummyComponent }];
    loader.load(routes);
    tick();

    expect(routes[0].children[0].path).toEqual('home_en');
    expect(loader.translateRoute('home/whatever')).toEqual('home_en/whatever');
  }));
  it('should keep query params while translate route', fakeAsync(() => {
    loader = new ManualParserLoader(translate, location, settings, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();
    localStorage.setItem('LOCALIZE_DEFAULT_LANGUAGE', 'en');

    routes = [{ path: 'home', component: DummyComponent }];
    loader.load(routes);
    tick();

    expect(routes[0].children[0].path).toEqual('home_en');
    expect(loader.translateRoute('home/whatever?test=123')).toEqual('home_en/whatever?test=123');
    expect(loader.translateRoute('home?test=123')).toEqual('home_en?test=123');
    expect(() => loader.translateRoute('home?test=123?test=123')).toThrow();
  }));
});
