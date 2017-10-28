# localize-router
[![Build Status](https://travis-ci.org/Greentube/localize-router.svg?branch=master)](https://travis-ci.org/Greentube/localize-router)
[![npm version](https://img.shields.io/npm/v/localize-router.svg)](https://www.npmjs.com/package/localize-router)
> An implementation of routes localization for Angular.

Based on and extension of [ngx-translate](https://github.com/ngx-translate/core).
Demo project can be found [here](https://github.com/meeroslav/localize-router-example) or under sub folder `demo/cli`.

> This documentation is for version 1.x.x. If you are migrating from the older version follow [migration guide](https://github.com/Greentube/localize-router/blob/master/MIGRATION_GUIDE.md) to upgrade to latest version.

# Table of contents:
- [Installation](#installation)
- [Usage](#usage)
    - [Initialize module](#initialize-module)
        - [Http loader](#http-loader)
        - [Initialization config](#initialization-config)
        - [Manual initialization](#manual-initialization)
        - [Server side initialization](#server-side-initialization)
    - [How it works](#how-it-works)
        - [excluding-routes](#excluding-routes)
        - [ngx-translate integration](#ngx-translate-integration)
    - [Pipe](#pipe)
    - [Service](#service)
    - [AOT](#aot)
- [API](#api)
    - [LocalizeRouterModule](#localizeroutermodule)
    - [LocalizeRouterConfig](#localizerouterconfig)
    - [LocalizeRouterService](#localizerouterservice)
    - [LocalizeParser](#localizeparser)
- [License](#license)

## Installation

```
npm install --save localize-router
```

## Usage

In order to use `localize-router` you must initialize it with following information:
* Available languages/locales
* Prefix for route segment translations
* Routes to be translated

### Initialize module
Module can be initialized either using static file or manually by passing necessary values.

#### Http loader

In order to use Http loader for config files, you must include `localize-router-http-loader` package and use its `LocalizeRouterHttpLoader`. 

```ts
import {BrowserModule} from "@angular/platform-browser";
import {NgModule} from '@angular/core';
import {HttpClientModule, HttpClient} from '@angular/common/http';
import {TranslateModule} from '@ngx-translate/core';
import {LocalizeRouterModule} from 'localize-router';
import {LocalizeRouterHttpLoader} from 'localize-router-http-loader';
import {RouterModule} from '@angular/router';

import {routes} from './app.routes';

@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    TranslateModule.forRoot(),
    LocalizeRouterModule.forRoot(routes, {
      parser: {
        provide: LocalizeParser,
        useFactory: (translate, location, settings, http) =>
            new LocalizeRouterHttpLoader(translate, location, settings, http),
        deps: [TranslateService, Location, LocalizeRouterSettings, HttpClient]
      }
    }),
    RouterModule.forRoot(routes)
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

More details are available on [localize-router-http-loader](https://github.com/Greentube/localize-router-http-loader).

If you are using child modules or routes you need to initialize them with `forChild` command:
```ts
@NgModule({
  imports: [
    TranslateModule,
    LocalizeRouterModule.forChild(routes),
    RouterModule.forChild(routes)
  ],
  declarations: [ChildComponent]
})
export class ChildModule { }
```

#### Initialization config
Apart from providing routes which are mandatory, and parser loader you can provide additional configuration for more granular setting of `localize router`. More information at [LocalizeRouterConfig](#localizerouterconfig). 


#### Manual initialization
   With manual initialization you need to provide information directly:
   ```ts
   LocalizeRouterModule.forRoot(routes, {
       parser: {
           provide: LocalizeParser,
           useFactory: (translate, location, settings) =>
               new ManualParserLoader(translate, location, settings, ['en','de',...], 'YOUR_PREFIX'),
           deps: [TranslateService, Location, LocalizeRouterSettings]
       }
   })
   ```

#### Server side initialization
In order to use server side initialization in isomorphic/universal projects you need to create loader similar to this:
```ts
export class LocalizeUniversalLoader extends LocalizeParser {
  /**
   * Gets config from the server
   * @param routes
   */
  public load(routes: Routes): Promise<any> {
    return new Promise((resolve: any) => {
      let data: any = JSON.parse(fs.readFileSync(`assets/locales.json`, 'utf8'));
      this.locales = data.locales;
      this.prefix = data.prefix;
      this.init(routes).then(resolve);
    });
  }
}

export function localizeLoaderFactory(translate: TranslateService, location: Location, settings: LocalizeRouterSettings) {
  return new LocalizeUniversalLoader(translate, location, settings);
}
```

Don't forget to create similar loader for `ngx-translate` as well:
```ts
export class TranslateUniversalLoader implements TranslateLoader {
  /**
   * Gets the translations from the server
   * @param lang
   * @returns {any}
   */
  public getTranslation(lang: string): Observable<any> {
    return Observable.create(observer => {
      observer.next(JSON.parse(fs.readFileSync(`src/assets/locales/${lang}.json`, 'utf8')));
      observer.complete();
    });
  }
}
export function translateLoaderFactory() {
  return new TranslateUniversalLoader();
}
```

Since node server expects to know which routes are allowed you can feed it like this:
```ts
let fs = require('fs');
let data: any = JSON.parse(fs.readFileSync(`src/assets/locales.json`, 'utf8'));

app.get('/', ngApp);
data.locales.forEach(route => {
  app.get(`/${route}`, ngApp);
  app.get(`/${route}/*`, ngApp);
});
```

Working example can be found [here](https://github.com/meeroslav/universal-localize-example).

### How it works

`Localize router` intercepts Router initialization and translates each `path` and `redirectTo` path of Routes.
The translation process is done with [ngx-translate](https://github.com/ngx-translate/core). In order to separate 
router translations from normal application translations we use `prefix`. Default value for prefix is `ROUTES.`.
```
'home' -> 'ROUTES.home'
```

Upon every route change `Localize router` kicks in to check if there was a change to language. Translated routes are prepended with two letter language code:
```
http://yourpath/home -> http://yourpath/en/home
```

If no language is provided in the url path, application uses: 
* cached language in LocalStorage (browser only) or
* current language of the browser (browser only) or 
* first locale in the config

Make sure you therefore place most common language (e.g. 'en') as a first string in the array of locales.

> Note that `localize-router` does not redirect routes like `my/route` to translated ones e.g. `en/my/route`. All routes are prepended by currently selected language so route without language is unknown to Router.

#### Excluding routes

Sometimes you might have a need to have certain routes excluded from the localization process e.g. login page, registration page etc. This is possible by setting flag `skipRouteLocalization` on route's data object.

```ts
let routes = [
  // this route gets localized
  { path: 'home', component: HomeComponent },
  // this route will not be localized
  { path: 'login', component: LoginComponent, data: { skipRouteLocalization: true } }
];
```

Note that this flag should only be set on root routes. By excluding root route, all its sub routes are automatically excluded.
Setting this flag on sub route has no effect as parent route would already have or have not language prefix.

#### ngx-translate integration

`LocalizeRouter` depends on `ngx-translate` core service and automatically initializes it with selected locales.
Following code is run on `LocalizeParser` init:
```ts
this.translate.setDefaultLang(cachedLanguage || languageOfBrowser || firstLanguageFromConfig);
// ...
this.translate.use(languageFromUrl || cachedLanguage || languageOfBrowser || firstLanguageFromConfig);
```

Both `languageOfBrowser` and `languageFromUrl` are cross-checked with locales from config.

### Pipe

`LocalizeRouterPipe` is used to translate `routerLink` directive's content. Pipe can be appended to partial strings in the routerLink's definition or to entire array element:
```html
<a [routerLink]="['user', userId, 'profile'] | localize">{{'USER_PROFILE' | translate}}</a>
<a [routerLink]="['about' | localize]">{{'ABOUT' | translate}}</a>
```

Root routes work the same way with addition that in case of root links, link is prepended by language.
Example for german language and link to 'about':
```
'/about' | localize -> '/de/über'
```

### Service

Routes can be manually translated using `LocalizeRouterService`. This is important if you want to use `router.navigate` for dynamical routes.

```ts
class MyComponent {
    constructor(private localize: LocalizeRouterService) { }

    myMethod() {
        let translatedPath: any = this.localize.translateRoute('about/me');
       
        // do something with translated path
        // e.g. this.router.navigate([translatedPath]);
    }
}
```

### AOT

In order to use Ahead-Of-Time compilation any custom loaders must be exported as functions.
This is the implementation currently in the solution:

```ts
export function localizeLoaderFactory(translate: TranslateService, location: Location, http: Http) {
  return new StaticParserLoader(translate, location, http);
}
```

## API
### LocalizeRouterModule
#### Methods:
- `forRoot(routes: Routes, config: LocalizeRouterConfig = {}): ModuleWithProviders`: Main initializer for localize router. Can provide custom configuration for more granular settings.
- `forChild(routes: Routes): ModuleWithProviders`: Child module initializer for providing child routes.
### LocalizeRouterConfig
#### Properties
- `parser`: Provider for loading of LocalizeParser. Default value is `StaticParserLoader`.
- `useCachedLang`: boolean. Flag whether default language should be cached. Default value is `true`.
- `alwaysSetPrefix`: boolean. Flag whether language should always prefix the url. Default value is `true`.  
  When value is `false`, prefix will not be used for for default language (this includes the situation when there is only one language).
- `cacheMechanism`: CacheMechanism.LocalStorage || CacheMechanism.Cookie. Default value is `CacheMechanism.LocalStorage`.
- `cacheName`: string. Name of cookie/local store. Default value is `LOCALIZE_DEFAULT_LANGUAGE`.
- `defaultLangFunction`: (languages: string[], cachedLang?: string, browserLang?: string) => string. Override method for custom logic for picking default language, when no language is provided via url. Default value is `undefined`.
### LocalizeRouterService
#### Properties:
- `routerEvents`: An EventEmitter to listen to language change event
```ts
localizeService.routerEvents.subscribe((language: string) => {
    // do something with language
});
```
- `parser`: Used instance of LocalizeParser
```ts
let selectedLanguage = localizeService.parser.currentLang;
```
#### Methods:
- `translateRoute(path: string | any[]): string | any[]`: Translates given path. If `path` starts with backslash then path is prepended with currently set language.
```ts
localizeService.translateRoute('/'); // -> e.g. '/en'
localizeService.translateRoute('/about'); // -> '/de/uber' (e.g. for German language)
localizeService.translateRoute('about'); // -> 'uber' (e.g. for German language)
```
- `changeLanguage(lang: string, extras?: NavigationExtras, useNavigateMethod?: boolean)`: Translates current url to given language and changes the application's language.
`extras` will be passed down to Angular Router navigation methods.
`userNavigateMethod` tells localize-router to use `navigate` rather than `navigateByUrl` method.  
For german language and route defined as `:lang/users/:user_name/profile`
```
yoursite.com/en/users/John%20Doe/profile -> yoursite.com/de/benutzer/John%20Doe/profil
```
### LocalizeParser
#### Properties:
- `locales`: Array of used language codes
- `currentLang`: Currently selected language
- `routes`: Active translated routes
- `urlPrefix`: Language prefix for current language. Empty string if `alwaysSetPrefix=false` and `currentLang` is same as default language.

#### Methods:
- `translateRoutes(language: string): Observable<any>`: Translates all the routes and sets language and current 
language across the application.
- `translateRoute(path: string): string`: Translates single path
- `getLocationLang(url?: string): string`: Extracts language from current url if matching defined locales

## License
Licensed under MIT
