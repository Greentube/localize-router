import { LocalizeRouterPipe } from '../../src/localize-router.pipe';
import { LocalizeRouterService } from '../../src/localize-router.service';
import { ChangeDetectorRef } from '@angular/core';
import { inject, TestBed } from '@angular/core/testing';
import { LocalizeParser } from '../localize-router.parser';
import { LocalizeParserMock } from '../mocks/localize-parser.mock';
import { ChangeDetectorRefMock } from '../mocks/change-detector-ref.mock';
import { LocalizeRouterServiceMock } from '../mocks/localize-router-service.mock';
import { TranslateService } from '../../node_modules/@ngx-translate/core';
import { TranslateServiceMock } from '../mocks/translate-service.mock';
import { LocationMock } from '../mocks/location.mock';
import { LocalizeRouterSettings } from '../localize-router.config';
import { Location } from '@angular/common';
import { LocalizeRouterSettingsMock } from '../mocks/localized-router-settings.mock';

describe('LocalizeRouterPipe', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LocalizeRouterPipe,
        LocalizeParserMock,
        { provide: LocalizeRouterSettings, useClass: LocalizeRouterSettingsMock },
        { provide: TranslateService, useClass: TranslateServiceMock },
        { provide: Location, useClass: LocationMock },
        { provide: ChangeDetectorRef, useClass: ChangeDetectorRefMock },
        { provide: LocalizeParser, useClass: LocalizeParserMock },
        { provide: LocalizeRouterService, useClass: LocalizeRouterServiceMock }
      ]
    });
  });

  it('is defined',
    inject([LocalizeRouterPipe],
      (localizeRouterPipe: LocalizeRouterPipe) => {
        expect(localizeRouterPipe).toBeDefined();
        expect(localizeRouterPipe instanceof LocalizeRouterPipe).toBeTruthy();
  }));

  it('should translate a route',
    inject([LocalizeRouterService, LocalizeRouterPipe],
      (localizeService: LocalizeRouterService, localizePipe: LocalizeRouterPipe) => {
        localizeService.parser.currentLang = 'en';
        expect(localizePipe.transform('route')).toEqual('route_TR');
  }));

  it('should translate a multi segment route',
    inject([LocalizeRouterService, LocalizeRouterPipe],
      (localizeService: LocalizeRouterService, localizePipe: LocalizeRouterPipe) => {
        localizeService.parser.currentLang = 'en';
        expect(localizePipe.transform('path/to/my/route')).toEqual('path/to/my/route_TR');
  }));

  it('should translate a complex segment route if it changed',
    inject([LocalizeRouterService, LocalizeRouterPipe, ChangeDetectorRef],
      (localizeService: LocalizeRouterService, localizePipe: LocalizeRouterPipe, ref: ChangeDetectorRef) => {

        localizeService.parser.currentLang = 'en';
        const detectChangesSpy = spyOn(ref, 'detectChanges').and.callThrough();

        localizePipe.transform(['/path', null, 'my', 5]);
        detectChangesSpy.calls.reset();

        localizePipe.transform(['/path', 4, 'my', 5]);
        expect(detectChangesSpy).toHaveBeenCalled();
  }));

  it('should not translate a complex segment route if it`s not changed',
    inject([LocalizeRouterService, LocalizeRouterPipe, ChangeDetectorRef],
      (localizeService: LocalizeRouterService, localizePipe: LocalizeRouterPipe, ref: ChangeDetectorRef) => {

        localizeService.parser.currentLang = 'en';
        const detectChangesSpy = spyOn(ref, 'detectChanges').and.callThrough();

        localizePipe.transform(['/path', 4, 'my', 5]);
        detectChangesSpy.calls.reset();

        localizePipe.transform(['/path', 4, 'my', 5]);
        expect(detectChangesSpy).not.toHaveBeenCalled();
  }));

  it('should call markForChanges when it translates a string',
    inject([LocalizeRouterService, LocalizeRouterPipe, ChangeDetectorRef],
      (localizeService: LocalizeRouterService, localizePipe: LocalizeRouterPipe, ref: ChangeDetectorRef) => {
        localizeService.parser.currentLang = 'en';
        const detectChangesSpy = spyOn(ref, 'detectChanges').and.callThrough();

        localizePipe.transform('route');
        expect(detectChangesSpy).toHaveBeenCalled();
  }));

  it('should not call markForChanges when query is not string',
    inject([LocalizeRouterService, LocalizeRouterPipe, ChangeDetectorRef],
      (localizeService: LocalizeRouterService, localizePipe: LocalizeRouterPipe, ref: ChangeDetectorRef) => {
        localizeService.parser.currentLang = 'en';
        const detectChangesSpy = spyOn(ref, 'detectChanges').and.callThrough();

        localizePipe.transform(null);
        expect(detectChangesSpy).not.toHaveBeenCalled();
  }));

  it('should not call markForChanges when query is empty string',
    inject([LocalizeRouterService, LocalizeRouterPipe, ChangeDetectorRef],
      (localizeService: LocalizeRouterService, localizePipe: LocalizeRouterPipe, ref: ChangeDetectorRef) => {
        localizeService.parser.currentLang = 'en';
        const detectChangesSpy = spyOn(ref, 'detectChanges').and.callThrough();

        localizePipe.transform('');
        expect(detectChangesSpy).not.toHaveBeenCalled();
  }));

  it('should not call markForChanges when no language selected',
    inject([LocalizeRouterService, LocalizeRouterPipe, ChangeDetectorRef],
      (localizeService: LocalizeRouterService, localizePipe: LocalizeRouterPipe, ref: ChangeDetectorRef) => {
        localizeService.parser.currentLang = null;
        const detectChangesSpy = spyOn(ref, 'detectChanges').and.callThrough();

        localizePipe.transform('route');
        expect(detectChangesSpy).not.toHaveBeenCalled();
  }));

  it('should not call markForChanges if same route already translated',
    inject([LocalizeRouterService, LocalizeRouterPipe, ChangeDetectorRef],
      (localizeService: LocalizeRouterService, localizePipe: LocalizeRouterPipe, ref: ChangeDetectorRef) => {
        localizeService.parser.currentLang = 'en';
        const detectChangesSpy = spyOn(ref, 'detectChanges').and.callThrough();
        localizePipe.transform('route');
        localizePipe.transform('route');
        expect(detectChangesSpy.calls.count()).toEqual(1);
  }));

  it('should subscribe to service`s routerEvents',
    inject([LocalizeRouterService, LocalizeRouterPipe, ChangeDetectorRef],
      (localizeService: LocalizeRouterService, localizePipe: LocalizeRouterPipe, ref: ChangeDetectorRef) => {
        let query = 'MY_TEXT';
        localizeService.parser.currentLang = 'en';
        const transformSpy = spyOn(localizePipe, 'transform').and.callThrough();
        const detectChangesSpy = spyOn(ref, 'detectChanges').and.callThrough();

        localizePipe.transform(query);
        detectChangesSpy.calls.reset();
        transformSpy.calls.reset();

        localizeService.parser.currentLang = 'de';
        localizeService.routerEvents.next('de');
        expect(transformSpy).toHaveBeenCalled();
        expect(detectChangesSpy).toHaveBeenCalled();
  }));
});
