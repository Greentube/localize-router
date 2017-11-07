import { Inject, InjectionToken, Provider } from '@angular/core';

/**
 * Guard to make sure we have single initialization of forRoot
 * @type {InjectionToken<LocalizeRouterModule>}
 */
export const LOCALIZE_ROUTER_FORROOT_GUARD = new InjectionToken('LOCALIZE_ROUTER_FORROOT_GUARD');

/**
 * Static provider for keeping track of routes
 * @type {InjectionToken<Routes[]>}
 */
export const RAW_ROUTES = new InjectionToken('RAW_ROUTES');

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
 * @type {InjectionToken<boolean>}
 */
export const USE_CACHED_LANG = new InjectionToken<boolean>('USE_CACHED_LANG');
/**
 * Cache mechanism type
 * @type {InjectionToken<CacheMechanism>}
 */
export const CACHE_MECHANISM = new InjectionToken<CacheMechanism>('CACHE_MECHANISM');
/**
 * Cache name
 * @type {InjectionToken<string>}
 */
export const CACHE_NAME = new InjectionToken<string>('CACHE_NAME');

/**
 * Type for default language function
 * Used to override basic behaviour
 */
export type DefaultLanguageFunction = (languages: string[], cachedLang?: string, browserLang?: string) => string;

/**
 * Function for calculating default language
 * @type {InjectionToken<DefaultLanguageFunction>}
 */
export const DEFAULT_LANG_FUNCTION = new InjectionToken<DefaultLanguageFunction>('DEFAULT_LANG_FUNCTION');

/**
 * Boolean to indicate whether prefix should be set for single language scenarios
 * @type {InjectionToken<boolean>}
 */
export const ALWAYS_SET_PREFIX = new InjectionToken<boolean>('ALWAYS_SET_PREFIX');

/**
 * Config interface for LocalizeRouter
 */
export interface LocalizeRouterConfig {
  parser?: Provider;
  useCachedLang?: boolean;
  cacheMechanism?: CacheMechanism;
  cacheName?: string;
  defaultLangFunction?: DefaultLanguageFunction;
  alwaysSetPrefix?: boolean;
}

const LOCALIZE_CACHE_NAME = 'LOCALIZE_DEFAULT_LANGUAGE';

export class LocalizeRouterSettings implements LocalizeRouterConfig {
  /**
   * Settings for localize router
   * @param {boolean} useCachedLang
   * @param {boolean} alwaysSetPrefix
   * @param {CacheMechanism} cacheMechanism
   * @param {string} cacheName
   * @param {DefaultLanguageFunction} defaultLangFunction
   */
  constructor(
    @Inject(USE_CACHED_LANG) public useCachedLang: boolean = true,
    @Inject(ALWAYS_SET_PREFIX) public alwaysSetPrefix: boolean = true,
    @Inject(CACHE_MECHANISM) public cacheMechanism: CacheMechanism = CacheMechanism.LocalStorage,
    @Inject(CACHE_NAME) public cacheName: string = LOCALIZE_CACHE_NAME,
    @Inject(DEFAULT_LANG_FUNCTION) public defaultLangFunction: DefaultLanguageFunction = void 0
  ) {
  }
}
