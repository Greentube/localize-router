import { PipeTransform, Pipe, ChangeDetectorRef, OnDestroy, Injectable } from '@angular/core';
import { LocalizeRouterService } from './localize-router.service';
import { Subscription } from 'rxjs';
import { equals } from './util';

const VIEW_DESTROYED_STATE = 128;

@Pipe({
  name: 'localize',
  pure: false // required to update the value when the promise is resolved
})
@Injectable()
export class LocalizeRouterPipe implements PipeTransform, OnDestroy {
  private value: string | any[] = '';
  private lastKey: string | any[];
  private lastLanguage: string;
  private subscription: Subscription;

  /**
   * CTOR
   * @param localize
   * @param _ref
   */
  constructor(private localize: LocalizeRouterService, private _ref: ChangeDetectorRef) {
    this.subscription = this.localize.routerEvents.subscribe(() => {
      this.transform(this.lastKey);
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
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
    if (equals(query, this.lastKey) && equals(this.lastLanguage, this.localize.parser.currentLang)) {
      return this.value;
    }
    this.lastKey = query;
    this.lastLanguage = this.localize.parser.currentLang;

    /** translate key and update values */
    this.value = this.localize.translateRoute(query);
    this.lastKey = query;
    // if view is already destroyed, ignore firing change detection
    if ((<any> this._ref)._view.state & VIEW_DESTROYED_STATE) {
      return this.value;
    }
    this._ref.detectChanges();
    return this.value;
  }
}
