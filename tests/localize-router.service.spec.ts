import {Injector} from "@angular/core";
import {XHRBackend, HttpModule} from "@angular/http";
import {MockBackend, MockConnection} from "@angular/http/testing";
import {
  LocalizeRouterService,} from '../src/localize-router.service';
import {LocalizeRouterModule} from '../src/localize-router.module';
import {getTestBed, TestBed} from "@angular/core/testing";
import {RouterModule} from "@angular/router";
import {TranslateModule} from "ng2-translate";

xdescribe('LocalizeRouterService', () => {
  let injector: Injector;
  let backend: MockBackend;
  let localizeRouterService: LocalizeRouterService;
  let connection: MockConnection; // this will be set when a new connection is emitted from the backend.

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpModule, TranslateModule.forRoot(), LocalizeRouterModule.forRoot([]), RouterModule.forRoot([])],
      providers: [
        {provide: XHRBackend, useClass: MockBackend}
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
