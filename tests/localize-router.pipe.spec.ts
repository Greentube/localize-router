import { LocalizeRouterPipe } from '../src/localize-router.pipe';
import { LocalizeRouterService } from '../src/localize-router.service';
import { Injector, ChangeDetectorRef } from '@angular/core';
import { getTestBed, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs/Subject';

class FakeChangeDetectorRef extends ChangeDetectorRef {
  markForCheck(): void {
  }

  detach(): void {
  }

  detectChanges(): void {
  }

  checkNoChanges(): void {
  }

  reattach(): void {
  }
}

class DummyLocalizeParser {
  currentLang: string;
}

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
  let localize: LocalizeRouterService;
  let localizePipe: LocalizeRouterPipe;
  let ref: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LocalizeRouterPipe],
      providers: [
        { provide: LocalizeRouterService, useClass: FakeLocalizeRouterService }
      ]
    });
    injector = getTestBed();
    localize = injector.get(LocalizeRouterService);

    ref = new FakeChangeDetectorRef();
    localizePipe = new LocalizeRouterPipe(localize, ref);
  });

  afterEach(() => {
    injector = undefined;
    localize = undefined;
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
    const translateRouteSpy = spyOn(localize, 'translateRoute').and.callThrough();

    localizePipe.transform(['/path', null, 'my', 5]);
    translateRouteSpy.calls.reset();

    localizePipe.transform(['/path', 4, 'my', 5]);
    expect(translateRouteSpy).toHaveBeenCalled();
  });

  it('should not translate a complex segment route if it`s not changed', () => {
    localize.parser.currentLang = 'en';
    const translateRouteSpy = spyOn(localize, 'translateRoute').and.callThrough();

    localizePipe.transform(['/path', 4, 'my', 5]);
    translateRouteSpy.calls.reset();

    localizePipe.transform(['/path', 4, 'my', 5]);
    expect(translateRouteSpy).not.toHaveBeenCalled();
  });

  it('should not translate if same route already translated', () => {
    localize.parser.currentLang = 'en';
    const translateRouteSpy = spyOn(localize, 'translateRoute').and.callThrough();
    localizePipe.transform('route');
    localizePipe.transform('route');
    expect(translateRouteSpy.calls.count()).toEqual(1);
  });

  it('should translate when query is a string', () => {
    localize.parser.currentLang = 'en';
    const translateRouteSpy = spyOn(localize, 'translateRoute').and.callThrough();

    localizePipe.transform('route');
    expect(translateRouteSpy).toHaveBeenCalled();
  });

  it('should not translate when query is null', () => {
    localize.parser.currentLang = 'en';
    const translateRouteSpy = spyOn(localize, 'translateRoute').and.callThrough();

    localizePipe.transform(null);
    expect(translateRouteSpy).not.toHaveBeenCalled();
  });

  it('should not translate when query is empty string', () => {
    localize.parser.currentLang = 'en';
    const translateRouteSpy = spyOn(localize, 'translateRoute').and.callThrough();

    localizePipe.transform('');
    expect(translateRouteSpy).not.toHaveBeenCalled();
  });

  it('should not translate when no language selected', () => {
    localize.parser.currentLang = null;
    const translateRouteSpy = spyOn(localize, 'translateRoute').and.callThrough();

    localizePipe.transform('route');
    expect(translateRouteSpy).not.toHaveBeenCalled();
  });

  it('should subscribe to service`s routerEvents', () => {
    let query = 'MY_TEXT';
    localize.parser.currentLang = 'en';
    const transmformSpy = spyOn(localizePipe, 'transform').and.callThrough();
    spyOn(ref, 'markForCheck').and.callThrough();

    localizePipe.transform(query);
    ref.markForCheck.calls.reset();
    transmformSpy.calls.reset();

    localize.parser.currentLang = 'de';
    localize.routerEvents.next('de');
    expect(localizePipe.transform).toHaveBeenCalled();
    expect(ref.markForCheck).toHaveBeenCalled();
  });
});
