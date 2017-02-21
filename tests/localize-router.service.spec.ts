import {Injector} from '@angular/core';
import {XHRBackend, HttpModule} from '@angular/http';
import {MockBackend, MockConnection} from '@angular/http/testing';
import {LocalizeRouterService} from '../src/localize-router.service';
import {LocalizeParser} from '../src/localize-router.parser';
import {LocalizeRouterModule} from '../src/localize-router.module';
import {getTestBed, TestBed, fakeAsync, tick} from '@angular/core/testing';
import {Routes, Router, Event, NavigationStart, NavigationEnd} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {TranslateService} from '@ngx-translate/core';
import { CommonModule, Location } from '@angular/common';

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
  use(lang: string) { this.currentLang = lang; }
  get(input: string) { return Observable.of(this.content[input] || input); }

  getBrowserLang() { return this.browserLang; }
}

class FakeRouter {
  routes: Routes;
  fakeRouterEvents: Subject<Event> = new Subject<Event>();

  resetConfig(routes: Routes) { this.routes = routes; }
  get events(): Observable<Event> { return this.fakeRouterEvents; }

  parseUrl() { return ''; }
}

class FakeLocation {
  path():string {
    return "";
  }
}

class DummyComponent {}

describe('LocalizeRouterService', () => {
  let injector: Injector;
  let backend: MockBackend;
  let parser: LocalizeParser;
  let router: Router;
  let localizeRouterService: LocalizeRouterService;
  let connection: MockConnection; // this will be set when a new connection is emitted from the backend.
  let routes: Routes;

  beforeEach(() => {
    routes = [{ path: '', component: DummyComponent }];

    TestBed.configureTestingModule({
      imports: [HttpModule, CommonModule, LocalizeRouterModule.forRoot(routes)],
      providers: [
        {provide: XHRBackend, useClass: MockBackend},
        {provide: Router, useClass: FakeRouter},
        {provide: TranslateService, useClass: FakeTranslateService},
        {provide: Location, useClass: FakeLocation}
      ]
    });
    injector = getTestBed();
    backend = injector.get(XHRBackend);
    parser = injector.get(LocalizeParser);
    router = injector.get(Router);
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
    localizeRouterService = new LocalizeRouterService(parser, router);
    expect(localizeRouterService).toBeDefined();
    expect(localizeRouterService instanceof LocalizeRouterService).toBeTruthy();
  });

  it('should initialize routerEvents', () => {
    localizeRouterService = new LocalizeRouterService(parser, router);
    expect(localizeRouterService.routerEvents).toBeDefined();
  });

  it('should reset route config on init', () => {
    expect((<any>router)['routes']).toEqual(void 0);
    parser.routes = routes;
    spyOn(router, 'resetConfig').and.callThrough();

    localizeRouterService = new LocalizeRouterService(parser, router);
    localizeRouterService.init();
    expect(router.resetConfig).toHaveBeenCalledWith(routes);
  });

  it('should call parser translateRoute', () => {
    localizeRouterService = new LocalizeRouterService(parser, router);
    let testString = 'result/path';
    spyOn(parser, 'translateRoute').and.returnValue(Observable.of(testString));

    localizeRouterService.translateRoute('my/path').subscribe((res: string) => {
      expect(res).toEqual(testString);
    });
    expect(parser.translateRoute).toHaveBeenCalledWith('my/path');
  });

  it('should append language if root route', () => {
    localizeRouterService = new LocalizeRouterService(parser, router);
    parser.currentLang = 'de';
    spyOn(parser, 'translateRoute').and.stub();

    localizeRouterService.translateRoute('/my/path');
    expect(parser.translateRoute).toHaveBeenCalledWith('/de/my/path');
  });

  it('should translate complex route', () => {
    localizeRouterService = new LocalizeRouterService(parser, router);
    parser.currentLang = 'de';
    spyOn(parser, 'translateRoute').and.stub();

    localizeRouterService.translateRoute(['/my/path', 123, 'about']);
    expect(parser.translateRoute).toHaveBeenCalledWith('/de/my/path');
    expect(parser.translateRoute).toHaveBeenCalledWith('about');
  });

  it('should translate routes if language had changed on route event', () => {
    localizeRouterService = new LocalizeRouterService(parser, router);
    localizeRouterService.init();
    parser.currentLang = 'de';
    parser.locales = ['de', 'en'];
    spyOn(parser, 'translateRoutes').and.stub();

    (<any>router).fakeRouterEvents.next(new NavigationStart(1, '/en/new/path'));
    expect(parser.translateRoutes).toHaveBeenCalledWith('en');
  });

  it('should not translate routes if language not found', () => {
    localizeRouterService = new LocalizeRouterService(parser, router);
    parser.currentLang = 'de';
    parser.locales = ['de', 'en'];
    spyOn(parser, 'translateRoutes').and.stub();

    (<any>router).fakeRouterEvents.next(new NavigationStart(1, '/bla/new/path'));
    expect(parser.translateRoutes).not.toHaveBeenCalled();
  });

  it('should not translate routes if language is same', () => {
    localizeRouterService = new LocalizeRouterService(parser, router);
    parser.currentLang = 'de';
    parser.locales = ['de', 'en'];
    spyOn(parser, 'translateRoutes').and.stub();

    (<any>router).fakeRouterEvents.next(new NavigationStart(1, '/de/new/path'));
    expect(parser.translateRoutes).not.toHaveBeenCalled();
  });

  it('should not translate routes if not NavigationStart', () => {
    localizeRouterService = new LocalizeRouterService(parser, router);
    parser.currentLang = 'de';
    parser.locales = ['de', 'en'];
    spyOn(parser, 'translateRoutes').and.stub();

    (<any>router).fakeRouterEvents.next(new NavigationEnd(1, '/en/new/path', '/en/new/path'));
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
    localizeRouterService = new LocalizeRouterService(parser, router);
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
