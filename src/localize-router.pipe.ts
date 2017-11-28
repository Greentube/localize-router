import { PipeTransform, Pipe, Injectable, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { LocalizeRouterService } from './localize-router.service';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/observable/forkJoin';
import { equals } from './util';

@Injectable()
@Pipe({
  name: 'localize',
  pure: false // required to update the value when the promise is resolved
})
export class LocalizeRouterPipe implements PipeTransform, OnDestroy {
  private markForTransform = true;
  private value: string | any[] = '';
  private lastKey: string | any[];
  private lastLanguage: string;
  private changes$$: Subscription;

  /**
   * CTOR
   * @param localize
   * @param _ref
   */
  constructor(private localize: LocalizeRouterService, private _ref: ChangeDetectorRef) {
    this.changes$$ = this.localize.routerEvents.subscribe(() => {
      this.markForTransform = true;
      this._ref.markForCheck();
    });
  }

  /**
   * Transform current url to localized one
   * @param query
   * @returns {string | any[]}
   */
  transform(query: string | any[]): string | any[] {
    if (!query || query.length === 0 || !this.localize.parser.currentLang) {
      return query;
    }
    if (!this.markForTransform && equals(query, this.lastKey) && this.lastLanguage === this.localize.parser.currentLang) {
      return this.value;
    }
    this.lastKey = query;
    this.lastLanguage = this.localize.parser.currentLang;

    /** translate key and update values */
    this.value = this.localize.translateRoute(query);
    this.lastKey = query;
    this.markForTransform = false;
    return this.value;
  }

  ngOnDestroy() {
    if (this.changes$$) {
      this.changes$$.unsubscribe();
    }
  }

}
