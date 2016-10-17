import {Injector} from "@angular/core";
import {ResponseOptions, Response, XHRBackend, HttpModule} from "@angular/http";
import {MockBackend, MockConnection} from "@angular/http/testing";
import {
    LocalizeRouterService,
    LocalizeLoader,
    LocalizeManualLoader,
    LocalizeStaticLoader
} from '../src/localize-router.service';
import {LocalizeRouterModule} from '../src/localize-router.module';
import {Observable} from "rxjs/Observable";
import {getTestBed, TestBed} from "@angular/core/testing";

const mockBackendResponse = (connection: MockConnection, response: string) => {
    connection.mockRespond(new Response(new ResponseOptions({body: response})));
};

describe('TranslateService', () => {
    let injector: Injector;
    let backend: MockBackend;
    let localizeRouterService: LocalizeRouterService;
    let connection: MockConnection; // this will be set when a new connection is emitted from the backend.

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpModule, LocalizeRouterModule.forRoot([])],
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
