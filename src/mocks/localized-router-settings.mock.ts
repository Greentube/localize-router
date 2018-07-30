import { DefaultLanguageFunction, CacheMechanism } from '../localize-router.config';

export class LocalizeRouterSettingsMock {

  private LOCALIZE_CACHE_NAME: string = 'LOCALIZE_DEFAULT_LANGUAGE';

  public useCachedLang: boolean = true;
  public alwaysSetPrefix: boolean = true;
  public cacheMechanism: CacheMechanism = CacheMechanism.LocalStorage;
  public cacheName: string = this.LOCALIZE_CACHE_NAME;
  public defaultLangFunction: DefaultLanguageFunction = void 0;
}
