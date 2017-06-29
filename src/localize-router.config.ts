import { OpaqueToken, Provider } from '@angular/core';

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

export const USE_CACHED_LANG = new OpaqueToken('USE_CACHED_LANG');
export const CACHE_MECHANISM = new OpaqueToken('CACHE_MECHANISM');
export const CACHE_NAME = new OpaqueToken('CACHE_NAME');

/**
 * Config interface for LocalizeRouter
 */
export interface LocalizeRouterConfig {
  parser?: Provider;
  useCachedLang?: boolean;
  cacheMechanism?: CacheMechanism; // cookie or local storage
  cacheName?: string;

  // defaultLangFunction: any; // TODO this will be implemented later
  // alwaysSetPrefix: boolean; // TODO this will be implemented later
  //
}
