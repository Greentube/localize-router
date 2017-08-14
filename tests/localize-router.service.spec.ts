import { Injector } from '@angular/core';
import {
  BaseRequestOptions, ConnectionBackend, Http, HttpModule, RequestOptions, XHRBackend
} from '@angular/http';
import { LocalizeRouterService } from '../src/localize-router.service';
import { LocalizeParser } from '../src/localize-router.parser';
import { LocalizeRouterModule } from '../src/localize-router.module';
import { getTestBed, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Routes, Router, Event, NavigationStart, NavigationEnd } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { TranslateService } from '@ngx-translate/core';
import { CommonModule, Location } from '@angular/common';
import { MockBackend, MockConnection } from '@angular/http/testing';

class FakeTranslateService {
  defLang: string;
  currentLang: string;

  browserLang: string = '';

  content: any = {
    'PREFIX.home': 'home_TR',
    'PREFIX.about': 'about_TR'
  };

  setDefaultLang = (lang: string) => { this.defLang = lang; };

  use = (lang: string) => { this.currentLang = lang; };

  get = (input: string) => Observable.of(this.content[input] || input);

  getBrowserLang = () => this.browserLang;
}

class FakeRouter {
  routes: Routes;
  fakeRouterEvents: Subject<Event> = new Subject<Event>();

  resetConfig = (routes: Routes) => {  this.routes = routes; };

  get events(): Observable<Event> {
    return this.fakeRouterEvents;
  }

  parseUrl = () => '';
}

class FakeLocation {
  path = () => '';
}

class DummyComponent {
}

describe('LocalizeRouterService', () => {
  let injector: Injector;
  let parser: LocalizeParser;
  let router: Router;
  let localizeRouterService: LocalizeRouterService;
  let routes: Routes;

  let backend: any;
  let connection: MockConnection;

  beforeEach(() => {
    routes = [{ path: '', component: DummyComponent }];

    TestBed.configureTestingModule({
      imports: [HttpModule, CommonModule, LocalizeRouterModule.forRoot(routes)],
      providers: [
        { provide: Router, useClass: FakeRouter },
        { provide: TranslateService, useClass: FakeTranslateService },
        { provide: Location, useClass: FakeLocation },
        { provide: XHRBackend, useClass: MockBackend },
        { provide: ConnectionBackend, useClass: MockBackend },
        { provide: RequestOptions, useClass: BaseRequestOptions },
        Http
      ]
    });
    injector = getTestBed();
    parser = injector.get(LocalizeParser);
    router = injector.get(Router);

    backend = injector.get(XHRBackend);
    backend.connections.subscribe((c: MockConnection) => connection = c);
  });

  afterEach(() => {
    injector = void 0;
    localizeRouterService = void 0;
    backend = void 0;
    connection = void 0;
  });

  it('is defined', () => {
    expect(LocalizeRouterService).toBeDefined();
    localizeRouterService = new LocalizeRouterService(parser, router);
    expect(localizeRouterService).toBeDefined();
    expect(localizeRouterService instanceof LocalizeRouterService).toBeTruthy();
  });

  it('should initialize routerEvents', () => {
    localizeRouterService = new LocalizeRouterService(parser, router);

    // mockBackendResponse(connection, '{"TEST": "This is a test", "TEST2": "This is another test"}');

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
    spyOn(parser, 'translateRoute').and.returnValue(testString);

    let res = localizeRouterService.translateRoute('my/path');
    expect(res).toEqual(testString);
    expect(parser.translateRoute).toHaveBeenCalledWith('my/path');
  });

  it('should append language if root route', () => {
    localizeRouterService = new LocalizeRouterService(parser, router);
    parser.currentLang = 'de';
    parser.locales = ['de', 'en'];
    let testString = '/my/path';
    spyOn(parser, 'translateRoute').and.returnValue(testString);

    let res = localizeRouterService.translateRoute(testString);
    expect(res).toEqual('/de' + testString);
    expect(parser.translateRoute).toHaveBeenCalledWith('/my/path');
  });

  it('should translate complex route', () => {
    localizeRouterService = new LocalizeRouterService(parser, router);
    parser.currentLang = 'de';
    parser.locales = ['de', 'en'];
    spyOn(parser, 'translateRoute').and.callFake((val: any) => val);

    let res = localizeRouterService.translateRoute(['/my/path', 123, 'about']);
    expect(res[0]).toEqual('/de/my/path');

    expect(parser.translateRoute).toHaveBeenCalledWith('/my/path');
    expect(parser.translateRoute).toHaveBeenCalledWith('about');
  });

  it('should translate routes if language had changed on route event', () => {
    localizeRouterService = new LocalizeRouterService(parser, router);
    localizeRouterService.init();
    parser.currentLang = 'de';
    parser.locales = ['de', 'en'];
    spyOn(parser, 'translateRoutes').and.returnValue(Observable.of(void 0));

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
