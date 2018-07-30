import { LocalizeRouterService } from '../../src/localize-router.service';
import { LocalizeParser } from '../../src/localize-router.parser';
import { LocalizeRouterSettings } from '../../src/localize-router.config';
import { LocalizeRouterModule } from '../../src/localize-router.module';
import { TestBed, inject } from '@angular/core/testing';
import { Routes, Router, NavigationStart, NavigationEnd } from '@angular/router';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { CommonModule, Location } from '@angular/common';
import { RouterMock } from '../mocks/router.mock';
import { TranslateServiceMock } from '../mocks/translate-service.mock';
import { LocationMock } from '../mocks/location.mock';
import { LocalizeParserMock } from '../mocks/localize-parser.mock';

class DummyComponent {
}

describe('LocalizeRouterService', () => {
  let routes: Routes;

  beforeEach(() => {
    routes = [
      { path: 'home', component: DummyComponent },
      { path: 'home/about', component: DummyComponent }
    ];

    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        LocalizeRouterModule.forRoot(routes)
      ],
      providers: [
        LocalizeRouterSettings,
        LocalizeRouterService,
        { provide: Router, useClass: RouterMock },
        { provide: TranslateService, useClass: TranslateServiceMock },
        { provide: Location, useClass: LocationMock },
        { provide: LocalizeParser, useClass: LocalizeParserMock }
      ]
    });
  });

  it('is defined',
    inject([LocalizeRouterService],
      (localizeRouterService: LocalizeRouterService) => {
        expect(localizeRouterService).toBeDefined();
        expect(localizeRouterService instanceof LocalizeRouterService).toBeTruthy();
  }));

  it('should initialize routerEvents',
    inject([LocalizeRouterService],
      (localizeRouterService: LocalizeRouterService) => {
        expect(localizeRouterService.routerEvents).toBeDefined();
  }));

  it('should reset route config on init',
    inject([LocalizeParser, LocalizeRouterService, Router],
      (parser: LocalizeParser, localizeRouterService: LocalizeRouterService, router: Router) => {
        expect((<any>router)['routes']).toEqual(void 0);
        parser.routes = routes;
        spyOn(router, 'resetConfig').and.callThrough();

        localizeRouterService.init();
        expect(router.resetConfig).toHaveBeenCalledWith(routes);
  }));

  it('should call parser translateRoute',
    inject([LocalizeParser, LocalizeRouterService],
      (parser: LocalizeParser, localizeRouterService: LocalizeRouterService) => {
        let testString = 'result/path';
        spyOn(parser, 'translateRoute').and.returnValue(testString);

        let res = localizeRouterService.translateRoute('my/path');
        expect(res).toEqual(testString);
        expect(parser.translateRoute).toHaveBeenCalledWith('my/path');
  }));

  it('should append language if root route',
    inject([LocalizeParser, LocalizeRouterService],
      (parser: LocalizeParser, localizeRouterService: LocalizeRouterService) => {
        parser.currentLang = 'de';
        parser.locales = ['de', 'en'];
        let testString = '/my/path';
        spyOn(parser, 'translateRoute').and.returnValue(testString);

        let res = localizeRouterService.translateRoute(testString);
        expect(res).toEqual('/de' + testString);
        expect(parser.translateRoute).toHaveBeenCalledWith('/my/path');
  }));

  it('should translate complex route',
    inject([LocalizeParser, LocalizeRouterService],
      (parser: LocalizeParser, localizeRouterService: LocalizeRouterService) => {
        parser.currentLang = 'de';
        parser.locales = ['de', 'en'];
        spyOn(parser, 'translateRoute').and.callFake((val: any) => val);

        let res = localizeRouterService.translateRoute(['/my/path', 123, 'about']);
        expect(res[0]).toEqual('/de/my/path');

        expect(parser.translateRoute).toHaveBeenCalledWith('/my/path');
        expect(parser.translateRoute).toHaveBeenCalledWith('about');
  }));

  it('should translate routes if language had changed on route event',
    inject([LocalizeParser, LocalizeRouterService, Router],
      (parser: LocalizeParser, localizeRouterService: LocalizeRouterService, router: Router) => {
        localizeRouterService.init();
        parser.currentLang = 'de';
        (<any>router).fakeRouterEvents.next(new NavigationStart(1, '/de/new/path'));
        parser.locales = ['de', 'en'];
        spyOn(parser, 'translateRoutes').and.returnValue(of(void 0));

        (<any>router).fakeRouterEvents.next(new NavigationStart(1, '/en/new/path'));
        expect(parser.translateRoutes).toHaveBeenCalledWith('en');
  }));

  it('should not translate routes if language not found',
    inject([LocalizeParser, Router],
      (parser: LocalizeParser, router: Router) => {
        parser.currentLang = 'de';
        parser.locales = ['de', 'en'];
        spyOn(parser, 'translateRoutes').and.stub();

        (<any>router).fakeRouterEvents.next(new NavigationStart(1, '/bla/new/path'));
        expect(parser.translateRoutes).not.toHaveBeenCalled();
  }));

  it('should not translate routes if language is same',
    inject([LocalizeParser, Router],
      (parser: LocalizeParser, router: Router) => {
        parser.currentLang = 'de';
        parser.locales = ['de', 'en'];
        spyOn(parser, 'translateRoutes').and.stub();

        (<any>router).fakeRouterEvents.next(new NavigationStart(1, '/de/new/path'));
        expect(parser.translateRoutes).not.toHaveBeenCalled();
  }));

  it('should not translate routes if not NavigationStart',
    inject([LocalizeParser, Router],
      (parser: LocalizeParser, router: Router) => {
        parser.currentLang = 'de';
        parser.locales = ['de', 'en'];
        spyOn(parser, 'translateRoutes').and.stub();

        (<any>router).fakeRouterEvents.next(new NavigationEnd(1, '/en/new/path', '/en/new/path'));
        expect(parser.translateRoutes).not.toHaveBeenCalled();
  }));

  it('should not set new url if same language',
    inject([LocalizeParser, LocalizeRouterService, Router],
      (parser: LocalizeParser, localizeRouterService: LocalizeRouterService, router: Router) => {
        parser.currentLang = 'de';
        parser.locales = ['de', 'en'];
        parser.routes = routes;
        spyOn(router, 'parseUrl').and.returnValue(null);
        spyOn(parser, 'translateRoutes').and.returnValue(Promise.resolve('en'));
        spyOn(history, 'pushState').and.stub();

        localizeRouterService.changeLanguage('de');
        expect(history.pushState).not.toHaveBeenCalled();
  }));
});
