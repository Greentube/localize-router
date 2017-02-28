import { PipeTransform, Pipe, Injectable, ChangeDetectorRef } from '@angular/core';
import { LocalizeRouterService } from './localize-router.service';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/observable/forkJoin';
import { equals } from './util';

@Injectable()
@Pipe({
  name: 'localize',
  pure: false // required to update the value when the promise is resolved
})
export class LocalizeRouterPipe implements PipeTransform {
  private value: string = '';
  private lastKey: string | Array<any>;
  private lastLanguage: string;
  private subscription: Subscription;

  /**
   * CTOR
   * @param localize
   * @param _ref
   */
  constructor(private localize: LocalizeRouterService, private _ref: ChangeDetectorRef ) {
    this.subscription = this.localize.routerEvents.subscribe(() => {
      this.transform(this.lastKey);
    });
  }

  /**
   * Transform current url to localized one
   * @param query
   * @returns {string}
   */
  transform(query: string | Array<any>): any {
    if(!query || query.length === 0 || !this.localize.parser.currentLang) {
      return query;
    }
    if(equals(query, this.lastKey) && equals(this.lastLanguage, this.localize.parser.currentLang)) {
      return this.value;
    }
    this.lastKey = query;
    this.lastLanguage = this.localize.parser.currentLang;
    this.updateValue(query);

    return this.value;
  }

  /**
   * Translate key and update values
   * @param key
   */
  private updateValue(key: string | Array<any>) {
    this.localize.translateRoute(key).subscribe(this.translateCallback(key));
  }

  /**
   * Callback on translateRoute subscription
   * @param key
   * @returns {(route:any)=>undefined}
   */
  private translateCallback(key: string | Array<any>): (route: any) => void {
    return (route: any) => {
      this.value = route;
      this.lastKey = key;
      this._ref.markForCheck();
    };
  }
}
