import {LocalizeRouterPipe} from '../src/localize-router.pipe';
import {LocalizeRouterService, LocalizeRouterModule} from "./../localize-router";
import {ResponseOptions, Response, XHRBackend, HttpModule} from "@angular/http";
import {Injector, ChangeDetectorRef} from "@angular/core";
import {getTestBed, TestBed} from "@angular/core/testing";
import {MockConnection, MockBackend} from "@angular/http/testing";

class FakeChangeDetectorRef extends ChangeDetectorRef {
    markForCheck(): void {}

    detach(): void {}

    detectChanges(): void {}

    checkNoChanges(): void {}

    reattach(): void {}
}

const mockBackendResponse = (connection: MockConnection, response: string) => {
    connection.mockRespond(new Response(new ResponseOptions({body: response})));
};

describe('LocalizeRouterPipe', () => {
    let injector: Injector;
    let backend: MockBackend;
    let localizeRouterService: LocalizeRouterService;
    let connection: MockConnection; // this will be set when a new connection is emitted from the backend.
    let localizeRouterPipe: LocalizeRouterPipe;
    let ref: any;

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

        ref = new FakeChangeDetectorRef();
        localizeRouterPipe = new LocalizeRouterPipe(localizeRouterService, ref);
    });

    afterEach(() => {
        injector = undefined;
        backend = undefined;
        localizeRouterService = undefined;
        connection = undefined;
        localizeRouterPipe = undefined;
        ref = undefined;
    });

    it('is defined', () => {
        expect(LocalizeRouterPipe).toBeDefined();
        expect(localizeRouterPipe).toBeDefined();
        expect(localizeRouterPipe instanceof LocalizeRouterPipe).toBeTruthy();
    });
});
