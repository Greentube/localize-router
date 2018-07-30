import { Injectable } from '@angular/core';
import { Routes, Route } from '@angular/router';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class RouterMock {
  routes: Route[];
  fakeRouterEvents: Subject<Event> = new Subject<Event>();

  resetConfig = (routes: Routes) => { this.routes = routes; };

  get events(): Observable<Event> {
    return this.fakeRouterEvents;
  }

  parseUrl = () => '';
}
