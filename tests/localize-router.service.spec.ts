import {Injector} from "@angular/core";
import {XHRBackend, HttpModule} from "@angular/http";
import {MockBackend, MockConnection} from "@angular/http/testing";
import { LocalizeRouterService } from '../src/localize-router.service';
import {LocalizeRouterModule} from '../src/localize-router.module';
import {getTestBed, TestBed} from "@angular/core/testing";
import {Routes, NavigationStart, Router} from "@angular/router";
import {Observable, Subject} from "rxjs";
import {TranslateService} from "ng2-translate";

class FakeTranslateService {
  defLang: string;
  currentLang: string;

  content: any = {};

  setDefaultLang(lang: string) { this.defLang = lang; }
  getDefaultLang() { return this.defLang; }
  use(lang: string) { this.currentLang = lang; }
  get(input: string) { return Observable.of(this.content[input] || input); }
}

class FakeRouter {
  routes: Routes;
  events: Subject<NavigationStart | string> = new Subject<NavigationStart | string>();

  resetConfig(routes: Routes) { this.routes = routes; }
  parseUrl(input: string) { return input; }
}

describe('LocalizeRouterService', () => {
  let injector: Injector;
  let backend: MockBackend;
  let localizeRouterService: LocalizeRouterService;
  let connection: MockConnection; // this will be set when a new connection is emitted from the backend.
  let routes: Routes;

  beforeEach(() => {
    routes = [{ path: '', redirectTo: 'some/path' }];

    TestBed.configureTestingModule({
      imports: [HttpModule, LocalizeRouterModule.forRoot(routes)],
      providers: [
        {provide: XHRBackend, useClass: MockBackend},
        {provide: Router, useClass: FakeRouter},
        {provide: TranslateService, useClass: FakeTranslateService}
      ]
    });
    injector = getTestBed();
    backend = injector.get(XHRBackend);
    localizeRouterService = injector.get(LocalizeRouterService);
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
    expect(localizeRouterService).toBeDefined();
    expect(localizeRouterService instanceof LocalizeRouterService).toBeTruthy();
  });
});
