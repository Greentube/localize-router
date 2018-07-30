import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { LocalizeParserMock } from './localize-parser.mock';

@Injectable()
export class LocalizeRouterServiceMock {
  routerEvents: Subject<string> = new Subject<string>();
  parser: LocalizeParserMock;

  constructor(parser: LocalizeParserMock) {
    this.parser = parser;
  }

  translateRoute(route: string): string {
    return route + '_TR';
  }
}
