# localize-router
[![Build Status](https://travis-ci.org/Greentube/localize-router.svg?branch=master)](https://travis-ci.org/Greentube/localize-router)
[![npm version](https://img.shields.io/npm/v/localize-router.svg)](https://www.npmjs.com/package/localize-router)
> An implementation of routes localization for Angular 2.

Based on and extension of [ng2-translate](https://github.com/ocombe/ng2-translate).
Demo project can be found [here](https://github.com/meeroslav/localize-router-example).

# Table of contents:
- [Installation](#installation)
- [Usage](#usage)
    - [Initialize module](#initialize-module)
        - [Static initialization](#static-initialization)
        - [JSON config file](#json-config-file)
        - [Manual initialization](#manual-initialization)
    - [How it works](#how-it-works)
        - [ng2-translate integration](#ng2-translate-integration)
    - [Pipe](#pipe)
    - [Service](#service)
    - [AOT](#aot)
- [API](#api)
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

#### Static initialization
```ts
import {BrowserModule} from "@angular/platform-browser";
import {NgModule} from '@angular/core';
import {HttpModule} from '@angular/http';
import {TranslateModule} from 'ng2-translate/ng2-translate';
import {LocalizeRouterModule} from 'localize-router/localize-router';
import {RouterModule} from '@angular/router';

import {routes} from './app.routes';

@NgModule({
    imports: [
        BrowserModule,
        HttpModule,
        TranslateModule.forRoot(),
        LocalizeRouterModule.forRoot(routes),
        RouterModule.forRoot(routes)
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
```

Static file's default path is `assets/locales.json`. You can override the path by calling `StaticParserLoader` on you own:
```ts
...
LocalizeRouterModule.forRoot(routes, {
    provide: LocalizeParser,
    useFactory: (translate, http) =>
        new StaticParserLoader(translate, http, 'your/path/to/config.json'),
    deps: [TranslateService, Http]
}),
...

```

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

#### JSON config file
JSON config file has following structure:
```
{
    "locales": ["en", "de", ...],
    "prefix": "..."
}
```

```ts
interface ILocalizeRouteConfig {
    locales: Array<string>;
    prefix: string;
}
```

#### Manual initialization
With manual initialization you need to provide information directly:
```ts
...
LocalizeRouterModule.forRoot(routes, {
    provide: LocalizeParser,
    useFactory: (translate, http) =>
        new ManualParserLoader(translate, ['en','de',...], 'YOUR_PREFIX'),
    deps: [TranslateService, Http]
}),
...

```

### How it works

`Localize router` intercepts Router initialization and translates each `path` and `redirectTo` path of Routes.
The translation process is done with [ng2-translate](https://github.com/ocombe/ng2-translate). In order to separate router translations from normal application translations we use `prefix`. Default value for prefix is `ROUTES.`.
```
'home' -> 'ROUTES.home'
```

Upon every route change `Localize router` kicks in to check if there was a change to language. Translated routes are prepended with two letter language code:
```
http://yourpath/home -> http://yourpath/en/home
```

If no language is provided in the url path, application uses default path - language set in the browser or first locale in the config.
Make sure you therefore place most common language (e.g. 'en') as a first string in the array of locales.

#### ng2-translate integration

`LocalizeRouter` depends on `ng2-translate` and automatically initializes it with selected locales.
Following code is run on `LocalizeParser` init:
```ts
this.translate.setDefaultLang(languageOfBrowser || firstLanguageFromConfig);
// ...
this.translate.use(languageFromUrl || languageOfBrowser || firstLanguageFromConfig);
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
        this.localize.translateRoute('about/me').subscribe((path: string) {
            // do something with translated path
            // e.g. this.router.navigate([path]);
        });
    }
}
```

### AOT

Currently NG compiler has issues with static loader factory in `localize-router.module` so in order to have a fully functional Ahead-Of-Time compilation `localizeLoaderFactory` has to be included in the `app.module`.
Working example can be found [here](https://github.com/meeroslav/universal-localize-example).

app.module.ts
```ts

export function createTranslateLoader(http: Http) {
  return new TranslateStaticLoader(http, '/assets/locales', '.json');
}

export function localizeLoaderFactory(translate: TranslateService, http: Http) {
  return new StaticParserLoader(translate, http);
}

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' }
];

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpModule,
    TranslateModule.forRoot({
      provide: TranslateLoader,
      useFactory: createTranslateLoader,
      deps: [Http]
    }),
    RouterModule.forRoot(routes),
    LocalizeRouterModule.forRoot(routes, {
      provide: LocalizeParser,
      useFactory: localizeLoaderFactory,
      deps: [TranslateService, Http]
    })
  ],
  exports: [RouterModule],
  bootstrap: [AppComponent]
})
export class AppModule { }

```



## API
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
- `translateRoute(path: string, prependLanguage?: boolean): Observable<string>`: Translates given path. If `prependLanguage` is true or `path` starts with backslash and `prependLanguage` not set then path is prepended with currently set language.
```ts
localizeService.translateRoute('', true).subscribe((res: string) => {
    // res equals e.g. '/en'
});
localizeService.translateRoute('', false).subscribe((res: string) => {
    // res equals ''
});
localizeService.translateRoute('/').subscribe((res: string) => {
    // res equals e.g. '/en'
});
```
- `changeLanguage(lang: string)`: Translates current url to given language and changes the application's language
For german language and route defined as `:lang/users/:user_name/profile`
```
yoursite.com/en/users/Miroslav%20Jonas/profile -> yoursite.com/de/benutzer/Miroslav%20Jonas/profil
```
### LocalizeParser
#### Properties:
- `locales`: Array of used language codes
- `currentLang`: Currently selected language
- `routes`: Currently used translated routes

#### Methods:
- `translateRoutes(language: string): Promise<any>`: Translates all the routes and sets language and current language across the application.
- `translateRoute(path: string): Observable<string>`: Translates single path
- `getLocationLang(url?: string): string`: Extracts language from current url if matching defined locales

## License
Licensed under MIT
