import { PipeTransform, Pipe, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { LocalizeRouterService } from './localize-router.service';
import { Subscription } from 'rxjs/Subscription';
import { equals } from './util';

@Pipe({
  name: 'localize',
  pure: false // required to become stateful and keep value updated on event changes.
})
export class LocalizeRouterPipe implements PipeTransform, OnDestroy {
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
      this.transform(this.lastKey);
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
    if (this.lastLanguage === this.localize.parser.currentLang && equals(query, this.lastKey)) {
      return this.value;
    }
    this.lastKey = query;
    this.lastLanguage = this.localize.parser.currentLang;

    /** translate key and update values */
    this.value = this.localize.translateRoute(query);
    this.lastKey = query;
    return this.value;
  }

  ngOnDestroy() {
      this.changes$$.unsubscribe();
  }

}
