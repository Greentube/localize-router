import {PipeTransform, Pipe, Injectable, ChangeDetectorRef, EventEmitter} from '@angular/core';
import {LocalizeRouterService} from './localize-router.service';
import {Observable, Subscription} from "rxjs";
import 'rxjs/add/observable/forkJoin';

@Injectable()
@Pipe({
  name: 'localize',
  pure: false // required to update the value when the promise is resolved
})
export class LocalizeRouterPipe implements PipeTransform {
  private value: string = '';
  private lastKey: string | Array<any>;
  private lastLanguage: string;
  private rootMarker: string;
  private subscription: Subscription;

  /**
   * CTOR
   * @param localize
   * @param translate
   * @param _ref
   */
  constructor(private localize: LocalizeRouterService, private _ref: ChangeDetectorRef ) {
    this.subscription = this.localize.routerEvents.subscribe((lang: string) => {

      this.transform(this.lastKey, this.rootMarker);
    });
  }

  /**
   * Transform current url to localized one
   * @param query
   * @returns {string}
   */
  transform(query: string | Array<any>, rootMarker: string): any {
    if(!query || query.length === 0 || !this.localize.loader.currentLang) {
      return query;
    }
    if(this.equals(query, this.lastKey) && this.equals(this.lastLanguage, this.localize.loader.currentLang)) {
      return this.value
    }
    this.rootMarker = rootMarker;
    this.lastKey = query;
    this.lastLanguage = this.localize.loader.currentLang;
    this.updateValue(query, rootMarker === 'root');

    return this.value;
  }

  /**
   * Translate key and update values
   * @param key
   */
  private updateValue(key: string | Array<any>, isRoot: boolean) {
    let translateBatch: Array<Observable<any>> = [];

    if (typeof key === 'string') {
      translateBatch.push(this.localize.translateRoute(key as string, isRoot));
    } else { // it's array
      (key as Array<any>).forEach((part: any, index: number) => {
        if (index === 0) {
          if (typeof part !== 'string') {
            translateBatch.push(Observable.of(this.localize.loader.currentLang));
          }
        } else {
          isRoot = false;
        }
        if (typeof part === 'string') {
          translateBatch.push(this.localize.translateRoute(part, isRoot));
        } else {
          translateBatch.push(Observable.of(part));
        }
      });
    }
    Observable.forkJoin(translateBatch).subscribe((route: any) => {
      this.value = route;
      this.lastKey = key;
      this._ref.markForCheck();
    });
  }

  /**
   * Compare if two objects are same
   * @param o1
   * @param o2
   * @returns {boolean}
   */
  private equals(o1: any, o2: any): boolean {
    if (o1 === o2) return true;
    if(o1 === null || o2 === null) return false;

    let t1 = typeof o1,
        t2 = typeof o2,
        length: number,
        index: any;

     if(t1 == t2 && t1 == 'object' && Array.isArray(o1) && Array.isArray(o2)) {
      if((length = o1.length) == o2.length) {
        for(index = 0; index < length; index++) {
          if(!this.equals(o1[index], o2[index])) return false;
        }
        return true;
      }
    }

    return false;
  }
}
