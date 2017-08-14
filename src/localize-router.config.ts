import { Inject, OpaqueToken, Provider } from '@angular/core';

/**
 * Guard to make sure we have single initialization of forRoot
 * @type {OpaqueToken<LocalizeRouterModule>}
 */
export const LOCALIZE_ROUTER_FORROOT_GUARD = new OpaqueToken('LOCALIZE_ROUTER_FORROOT_GUARD');

/**
 * Static provider for keeping track of routes
 * @type {OpaqueToken<Routes[]>}
 */
export const RAW_ROUTES = new OpaqueToken('RAW_ROUTES');

/**
 * Type for Caching of default language
 */
export type CacheMechanism = 'LocalStorage' | 'Cookie';

/**
 * Namespace for fail proof access of CacheMechanism
 */
export namespace CacheMechanism {
  export const LocalStorage: CacheMechanism = 'LocalStorage';
  export const Cookie: CacheMechanism = 'Cookie';
}

/**
 * Boolean to indicate whether to use cached language value
 * @type {OpaqueToken<boolean>}
 */
export const USE_CACHED_LANG = new OpaqueToken('USE_CACHED_LANG');
/**
 * Cache mechanism type
 * @type {OpaqueToken<CacheMechanism>}
 */
export const CACHE_MECHANISM = new OpaqueToken('CACHE_MECHANISM');
/**
 * Cache name
 * @type {OpaqueToken<string>}
 */
export const CACHE_NAME = new OpaqueToken('CACHE_NAME');

/**
 * Type for default language function
 * Used to override basic behaviour
 */
export interface DefaultLanguageFunction {
  (languages: string[], cachedLang?: string, browserLang?: string): string;
}

/**
 * Function for calculating default language
 * @type {OpaqueToken<DefaultLanguageFunction>}
 */
export const DEFAULT_LANG_FUNCTION = new OpaqueToken('DEFAULT_LANG_FUNCTION');

/**
 * Config interface for LocalizeRouter
 */
export interface LocalizeRouterConfig {
  parser?: Provider;
  useCachedLang?: boolean;
  cacheMechanism?: CacheMechanism;
  cacheName?: string;
  defaultLangFunction?: DefaultLanguageFunction;
  // alwaysSetPrefix: boolean; // TODO this will be implemented later
  //
}

const LOCALIZE_CACHE_NAME = 'LOCALIZE_DEFAULT_LANGUAGE';

export class LocalizeRouterSettings implements LocalizeRouterConfig {
  constructor(
    @Inject(USE_CACHED_LANG) public useCachedLang: boolean = true,
    @Inject(CACHE_MECHANISM) public cacheMechanism: CacheMechanism = CacheMechanism.LocalStorage,
    @Inject(CACHE_NAME) public cacheName: string = LOCALIZE_CACHE_NAME,
    @Inject(DEFAULT_LANG_FUNCTION) public defaultLangFunction: DefaultLanguageFunction = void 0
  ) {

  }
}
