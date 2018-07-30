import { Injectable } from '@angular/core';
import { LocalizeParser } from '../localize-router.parser';
import { Routes } from '@angular/router';

@Injectable()
export class LocalizeParserMock extends LocalizeParser {

  load(routes: Routes): Promise<any> {
    return new Promise((resolve: any) => {
      this.init(routes).then(resolve);
    });
  }
}
