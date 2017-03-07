import {LocalizeRouterPipe} from '../src/localize-router.pipe';
import {LocalizeRouterService} from '../src/localize-router.service';
import {XHRBackend} from '@angular/http';
import {Injector, ChangeDetectorRef} from '@angular/core';
import {getTestBed, TestBed} from '@angular/core/testing';
import {MockConnection, MockBackend} from '@angular/http/testing';
import {Subject} from 'rxjs/Subject';

class FakeChangeDetectorRef extends ChangeDetectorRef {
  markForCheck(): void {  }
  detach(): void {  }
  detectChanges(): void {  }
  checkNoChanges(): void {  }
  reattach(): void {  }
}

class DummyLocalizeParser { currentLang: string; }

class FakeLocalizeRouterService {
  routerEvents: Subject<string> = new Subject<string>();
  parser: DummyLocalizeParser;

  constructor() {
    this.parser = new DummyLocalizeParser();
  }

  translateRoute(route: string): string {
    return route + '_TR';
  }
}

describe('LocalizeRouterPipe', () => {
  let injector: Injector;
  let backend: MockBackend;
  let localize: LocalizeRouterService;
  let connection: MockConnection; // this will be set when a new connection is emitted from the backend.
  let localizePipe: LocalizeRouterPipe;
  let ref: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LocalizeRouterPipe],
      providers: [
        {provide: XHRBackend, useClass: MockBackend},
        {provide: LocalizeRouterService, useClass: FakeLocalizeRouterService}
      ]
    });
    injector = getTestBed();
    backend = injector.get(XHRBackend);
    localize = injector.get(LocalizeRouterService);
    // sets the connection when someone tries to access the backend with an xhr request
    backend.connections.subscribe((c: MockConnection) => connection = c);

    ref = new FakeChangeDetectorRef();
    localizePipe = new LocalizeRouterPipe(localize, ref);
  });

  afterEach(() => {
    injector = undefined;
    backend = undefined;
    localize = undefined;
    connection = undefined;
    localizePipe = undefined;
    ref = undefined;
  });

  it('is defined', () => {
    expect(LocalizeRouterPipe).toBeDefined();
    expect(localizePipe).toBeDefined();
    expect(localizePipe instanceof LocalizeRouterPipe).toBeTruthy();
  });

  it('should translate a route', () => {
    localize.parser.currentLang = 'en';

    expect(localizePipe.transform('route')).toEqual('route_TR');
  });

  it('should translate a multi segment route', () => {
    localize.parser.currentLang = 'en';

    expect(localizePipe.transform('path/to/my/route')).toEqual('path/to/my/route_TR');
  });

  it('should translate a complex segment route if it changed', () => {
    localize.parser.currentLang = 'en';
    spyOn(ref, 'markForCheck').and.callThrough();

    localizePipe.transform(['/path', null, 'my', 5]);
    ref.markForCheck.calls.reset();

    localizePipe.transform(['/path', 4, 'my', 5]);
    expect(ref.markForCheck).toHaveBeenCalled();
  });

  it('should not translate a complex segment route if it`s not changed', () => {
    localize.parser.currentLang = 'en';
    spyOn(ref, 'markForCheck').and.callThrough();

    localizePipe.transform(['/path', 4, 'my', 5]);
    ref.markForCheck.calls.reset();

    localizePipe.transform(['/path', 4, 'my', 5]);
    expect(ref.markForCheck).not.toHaveBeenCalled();
  });

  it('should call markForChanges when it translates a string', () => {
    localize.parser.currentLang = 'en';
    spyOn(ref, 'markForCheck').and.callThrough();

    localizePipe.transform('route');
    expect(ref.markForCheck).toHaveBeenCalled();
  });

  it('should not call markForChanges when query is not string', () => {
    localize.parser.currentLang = 'en';
    spyOn(ref, 'markForCheck').and.callThrough();

    localizePipe.transform(null);
    expect(ref.markForCheck).not.toHaveBeenCalled();
  });

  it('should not call markForChanges when query is empty string', () => {
    localize.parser.currentLang = 'en';
    spyOn(ref, 'markForCheck').and.callThrough();

    localizePipe.transform('');
    expect(ref.markForCheck).not.toHaveBeenCalled();
  });

  it('should not call markForChanges when no language selected', () => {
    localize.parser.currentLang = null;
    spyOn(ref, 'markForCheck').and.callThrough();

    localizePipe.transform('route');
    expect(ref.markForCheck).not.toHaveBeenCalled();
  });

  it('should not call markForChanges if same route already translated', () => {
    localize.parser.currentLang = 'en';
    spyOn(ref, 'markForCheck').and.callThrough();
    localizePipe.transform('route');
    localizePipe.transform('route');
    expect(ref.markForCheck.calls.count()).toEqual(1);
  });

  it('should subscribe to service`s routerEvents', () => {
    let query = 'MY_TEXT';
    localize.parser.currentLang = 'en';
    spyOn(localizePipe, 'transform').and.callThrough();
    spyOn(ref, 'markForCheck').and.callThrough();

    localizePipe.transform(query);
    ref.markForCheck.calls.reset();
    (<any>localizePipe.transform)['calls'].reset();

    localize.parser.currentLang = 'de';
    localize.routerEvents.next('de');
    expect(localizePipe.transform).toHaveBeenCalled();
    expect(ref.markForCheck).toHaveBeenCalled();
  });
});
