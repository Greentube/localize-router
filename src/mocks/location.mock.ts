import { Injectable } from '@angular/core';

@Injectable()
export class LocationMock {
  path(includeHash?: boolean): string {
    return '';
  }
}
