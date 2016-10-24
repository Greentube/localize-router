import {Injector, ApplicationRef} from "@angular/core";
import {XHRBackend, HttpModule} from "@angular/http";
import {MockBackend, MockConnection} from "@angular/http/testing";
import {LocalizeRouterService, LocalizeParser, ManualParserLoader} from '../src/localize-router.service';
import {LocalizeRouterModule} from '../src/localize-router.module';
import {getTestBed, TestBed, fakeAsync, tick} from "@angular/core/testing";
import {Routes, Router, Event, NavigationStart, NavigationEnd} from "@angular/router";
import {Observable, Subject} from "rxjs";
import {TranslateService} from "ng2-translate";

class FakeTranslateService {
  defLang: string;
  currentLang: string;

  content: any = {
    'PREFIX.home': 'home_TR',
    'PREFIX.about': 'about_TR'
  };

  setDefaultLang(lang: string) { this.defLang = lang; }
  getDefaultLang() { return this.defLang; }
  use(lang: string) { this.currentLang = lang; }
  get(input: string) { return Observable.of(this.content[input] || input); }
}

class FakeRouter extends Router {
  routes: Routes;
  fakeRouterEvents: Subject<Event> = new Subject<Event>();

  resetConfig(routes: Routes) { this.routes = routes; }
  get events(): Observable<Event> { return this.fakeRouterEvents; }
}

class FakeApplicationRef {
  componentTypes: any[];

  constructor(){ this.componentTypes = [DummyComponent]; }
}

class DummyComponent {}

describe('LocalizeRouterService', () => {
  let injector: Injector;
  let backend: MockBackend;
  let parser: LocalizeParser;
  let router: Router;
  let appRef: ApplicationRef;
  let localizeRouterService: LocalizeRouterService;
  let connection: MockConnection; // this will be set when a new connection is emitted from the backend.
  let routes: Routes;

  beforeEach(() => {
    routes = [{ path: '', component: DummyComponent }];

    TestBed.configureTestingModule({
      imports: [HttpModule, LocalizeRouterModule.forRoot(routes)],
      providers: [
        {provide: XHRBackend, useClass: MockBackend},
        {provide: Router, useClass: FakeRouter},
        {provide: TranslateService, useClass: FakeTranslateService},
        {provide: ApplicationRef, useClass: FakeApplicationRef}
      ]
    });
    injector = getTestBed();
    backend = injector.get(XHRBackend);
    parser = injector.get(LocalizeParser);
    router = injector.get(Router);
    appRef = injector.get(ApplicationRef);
    // sets the connection when someone tries to access the backend with an xhr request
    backend.connections.subscribe((c: MockConnection) => connection = c);
  });

  afterEach(() => {
    injector = undefined;
    backend = undefined;
    localizeRouterService = undefined;
    connection = undefined;
  });

  it('is defined', () => {
    expect(LocalizeRouterService).toBeDefined();
    localizeRouterService = new LocalizeRouterService(parser, router, appRef);
    expect(localizeRouterService).toBeDefined();
    expect(localizeRouterService instanceof LocalizeRouterService).toBeTruthy();
  });

  it('should initialize routerEvents', () => {
    localizeRouterService = new LocalizeRouterService(parser, router, appRef);
    expect(localizeRouterService.routerEvents).toBeDefined();
  });

  it('should reset route config on load', () => {
    expect((router as FakeRouter).routes).toEqual(void 0);
    parser.routes = routes;
    spyOn(router, 'resetConfig').and.callThrough();

    localizeRouterService = new LocalizeRouterService(parser, router, appRef);
    expect(router.resetConfig).toHaveBeenCalledWith(routes);
  });

  it('should call parser translateRoute', () => {
    localizeRouterService = new LocalizeRouterService(parser, router, appRef);
    let testString = 'result/path';
    spyOn(parser, 'translateRoute').and.returnValue(Observable.of(testString));

    localizeRouterService.translateRoute('my/path').subscribe((res: string) => {
      expect(res).toEqual(testString);
    });
    expect(parser.translateRoute).toHaveBeenCalledWith('my/path');
  });

  it('should append language if root route', () => {
    localizeRouterService = new LocalizeRouterService(parser, router, appRef);
    parser.currentLang = 'de';
    spyOn(parser, 'translateRoute').and.stub();

    localizeRouterService.translateRoute('/my/path');
    expect(parser.translateRoute).toHaveBeenCalledWith('/de/my/path');
  });

  it('should append language if second param is true', () => {
    localizeRouterService = new LocalizeRouterService(parser, router, appRef);
    parser.currentLang = 'de';
    spyOn(parser, 'translateRoute').and.stub();

    localizeRouterService.translateRoute('my/path', true);
    expect(parser.translateRoute).toHaveBeenCalledWith('/de/my/path');
  });

  it('should append language if second param is true and is root route', () => {
    localizeRouterService = new LocalizeRouterService(parser, router, appRef);
    parser.currentLang = 'de';
    spyOn(parser, 'translateRoute').and.stub();

    localizeRouterService.translateRoute('/my/path', true);
    expect(parser.translateRoute).toHaveBeenCalledWith('/de/my/path');
  });

  it('should not append language if second param is false', () => {
    localizeRouterService = new LocalizeRouterService(parser, router, appRef);
    parser.currentLang = 'de';
    spyOn(parser, 'translateRoute').and.stub();

    localizeRouterService.translateRoute('/my/path', false);
    expect(parser.translateRoute).toHaveBeenCalledWith('/my/path');
  });

  it('should translate routes if language had changed on route event', () => {
    localizeRouterService = new LocalizeRouterService(parser, router, appRef);
    parser.currentLang = 'de';
    parser.locales = ['de', 'en'];
    spyOn(parser, 'translateRoutes').and.stub();

    (router as FakeRouter).fakeRouterEvents.next(new NavigationStart(1, '/en/new/path'));
    expect(parser.translateRoutes).toHaveBeenCalledWith('en');
  });

  it('should not translate routes if language not found', () => {
    localizeRouterService = new LocalizeRouterService(parser, router, appRef);
    parser.currentLang = 'de';
    parser.locales = ['de', 'en'];
    spyOn(parser, 'translateRoutes').and.stub();

    (router as FakeRouter).fakeRouterEvents.next(new NavigationStart(1, '/bla/new/path'));
    expect(parser.translateRoutes).not.toHaveBeenCalled();
  });

  it('should not translate routes if language is same', () => {
    localizeRouterService = new LocalizeRouterService(parser, router, appRef);
    parser.currentLang = 'de';
    parser.locales = ['de', 'en'];
    spyOn(parser, 'translateRoutes').and.stub();

    (router as FakeRouter).fakeRouterEvents.next(new NavigationStart(1, '/de/new/path'));
    expect(parser.translateRoutes).not.toHaveBeenCalled();
  });

  it('should not translate routes if not NavigationStart', () => {
    localizeRouterService = new LocalizeRouterService(parser, router, appRef);
    parser.currentLang = 'de';
    parser.locales = ['de', 'en'];
    spyOn(parser, 'translateRoutes').and.stub();

    (router as FakeRouter).fakeRouterEvents.next(new NavigationEnd(1, '/en/new/path', '/en/new/path'));
    expect(parser.translateRoutes).not.toHaveBeenCalled();
  });

  // it('should set new url', fakeAsync(() => {
  //   localizeRouterService = new LocalizeRouterService(parser, router, appRef);
  //   parser.currentLang = 'de';
  //   parser.locales = ['de', 'en'];
  //   parser.routes = [{ path: 'en', component: DummyComponent, children: [
  //     {path: 'about', children: [
  //       {path:'', component: DummyComponent},
  //       {path:':id', component: DummyComponent}
  //     ]},
  //   ]}];
  //   spyOn(router, 'parseUrl').and.returnValue(null);
  //   spyOn(parser, 'translateRoutes').and.returnValue(Promise.resolve('en'));
  //   spyOn(history, 'pushState').and.stub();
  //
  //   localizeRouterService.changeLanguage('de');
  //   tick();
  //   expect(history.pushState).toHaveBeenCalled();
  // }));

  it('should not set new url if same language', fakeAsync(() => {
    localizeRouterService = new LocalizeRouterService(parser, router, appRef);
    parser.currentLang = 'de';
    parser.locales = ['de', 'en'];
    parser.routes = routes;
    spyOn(router, 'parseUrl').and.returnValue(null);
    spyOn(parser, 'translateRoutes').and.returnValue(Promise.resolve('en'));
    spyOn(history, 'pushState').and.stub();

    localizeRouterService.changeLanguage('de');
    tick();
    expect(history.pushState).not.toHaveBeenCalled();
  }));
});

describe('LocalizeParser', () => {
  let injector: Injector;
  let loader: ManualParserLoader;
  let translate: TranslateService;

  let fakeLocation = { pathname: '' };
  let routes: Routes;
  let locales: string[];
  let prefix = 'PREFIX.';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {provide: TranslateService, useClass: FakeTranslateService},
        {provide: location, useValue: fakeLocation}
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
    injector = getTestBed();
    translate = injector.get(TranslateService);
    loader = new ManualParserLoader(translate);
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
    loader = new ManualParserLoader(translate, locales, prefix);
    expect(loader.locales).toEqual(locales);
  });

  it('should extract language from url on getLocationLang', () => {
    loader = new ManualParserLoader(translate, locales, prefix);

    expect(loader.getLocationLang('/en/some/path/after')).toEqual('en');
    expect(loader.getLocationLang('de/some/path/after')).toEqual('de');
  });

  it('should return null on getLocationLang if lang not found', () => {
    loader = new ManualParserLoader(translate, locales, prefix);

    expect(loader.getLocationLang('/se/some/path/after')).toEqual(null);
    expect(loader.getLocationLang('rs/some/path/after')).toEqual(null);
  });

  it('should call translateRoutes on init if locales passed', fakeAsync(() => {
    loader = new ManualParserLoader(translate, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();

    loader.load([]);
    tick();
    expect(loader.translateRoutes).toHaveBeenCalled();
  }));

  it('should not call translateRoutes on init if no locales', fakeAsync(() => {
    loader = new ManualParserLoader(translate, [], prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();

    loader.load(routes);
    tick();
    expect(loader.translateRoutes).not.toHaveBeenCalled();
  }));

  it('should set language from navigator params', fakeAsync(() => {
    loader = new ManualParserLoader(translate, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();

    (<any>navigator)['__defineGetter__']('language', function () { return 'de-AT'; });

    routes = [];
    loader.load(routes);
    tick();
    expect(routes[0]).toEqual({path: '', redirectTo: 'de', pathMatch: 'full'});
    expect(routes[1]).toEqual({path: 'de', children: []});
    expect(loader.currentLang).toEqual('de');
    expect(translate.currentLang).toEqual('de');
  }));

  it('should pick first language from locales if navigator language not recognized', fakeAsync(() => {
    loader = new ManualParserLoader(translate, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();

    (<any>navigator)['__defineGetter__']('language', function () { return 'sr-sp'; });

    routes = [];
    loader.load(routes);
    tick();
    expect(routes[0].redirectTo).toEqual('en');
    expect(loader.currentLang).toEqual('en');
    expect(translate.currentLang).toEqual('en');
  }));

  it('should translate path', fakeAsync(() => {
    loader = new ManualParserLoader(translate, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();
    (<any>navigator)['__defineGetter__']('language', function () { return 'sr-sp'; });

    routes = [{path: 'home', component: DummyComponent }];
    loader.load(routes);
    tick();
    expect(routes[1].children[0].path).toEqual('home_TR');
  }));

  it('should not translate path if translation not found', fakeAsync(() => {
    loader = new ManualParserLoader(translate, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();
    (<any>navigator)['__defineGetter__']('language', function () { return 'sr-sp'; });

    routes = [{path: 'abc', component: DummyComponent }];
    loader.load(routes);
    tick();
    expect(routes[1].children[0].path).toEqual('abc');
  }));

  it('should translate redirectTo', fakeAsync(() => {
    loader = new ManualParserLoader(translate, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();
    (<any>navigator)['__defineGetter__']('language', function () { return 'sr-sp'; });

    routes = [{redirectTo: 'home' }];
    loader.load(routes);
    tick();
    expect(routes[1].children[0].redirectTo).toEqual('home_TR');
  }));

  it('should translate complex path segments', fakeAsync(() => {
    loader = new ManualParserLoader(translate, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();
    (<any>navigator)['__defineGetter__']('language', function () { return 'sr-sp'; });

    routes = [{path: '/home/about', component: DummyComponent }];
    loader.load(routes);
    tick();
    expect(routes[1].children[0].path).toEqual('/home_TR/about_TR');
  }));

  it('should translate children', fakeAsync(() => {
    loader = new ManualParserLoader(translate, locales, prefix);
    spyOn(loader, 'translateRoutes').and.callThrough();
    (<any>navigator)['__defineGetter__']('language', function () { return 'sr-sp'; });

    routes = [
      {path: 'home', children: [
        {path: 'about', component: DummyComponent }
      ]}
    ];
    loader.load(routes);
    tick();
    expect(routes[1].children[0].path).toEqual('home_TR');
    expect(routes[1].children[0].children[0].path).toEqual('about_TR');
  }));
});
