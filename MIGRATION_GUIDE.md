# Migration guide from localize-router 0.x.x to 1.x.x

The 1.0.0 release is introducing a few breaking changes.
This guide is provided to make the transition as painless as possible.

Steps to migrate your code are:
- update the npm packages
- update the module import

Here is a detailed list of the changes that you need to make:

1. Update in your package.json `localize-router` to the latest 1.x version ([check the current release here](https://github.com/Greentube/localize-router/releases)).

2. Run `npm update` to update your packages. 

In some cases your local `node_modules` might get in broken state in which case you can try running `npm cache clean` or in worst cases deleting entire node_modules folder and running `npm install` again.

3. The module initialization `forRoot` method has changed a bit. Instead of loader, it expects an object of parameters. 

    ```ts
    import { Http } from '@angular/http';
    import { TranslateService } from '@ngx-translate/core';
    import { Location } from '@angular/common';
    import { LocalizeRouterModule, LocalizeParser, StaticParserLoader } from 'localize-router';

    LocalizeRouterModule.forRoot(routes, {
      provide: LocalizeParser, 
      useFactory: (translate, location, http) => 
        new StaticParserLoader(translate, location, http, 'your/path/to/config.json'), 
      deps: [TranslateService, Location, Http]
    })
    ```

    Is now:

    ```ts
    import { Http } from '@angular/http';
    import { TranslateService } from '@ngx-translate/core';
    import { Location } from '@angular/common';
    import { LocalizeRouterModule, LocalizeParser, StaticParserLoader, LocalizeRouterSettings } from 'localize-router';

    LocalizeRouterModule.forRoot(routes, {
      parser: { 
        provide: LocalizeParser, 
        useFactory: (translate, location, settings, http) => 
          new StaticParserLoader(translate, location, settings, http, 'your/path/to/config.json'), 
        deps: [TranslateService, Location, LocalizeRouterSettings, Http] 
      }
    })
    ```

    You can now also provide additional settings regarding url prefixes and default language cache mechanisms:

    ```ts
    LocalizeRouterModule.forRoot(routes, {
      parser: { 
        provide: LocalizeParser, 
        useFactory: (translate, location, settings, http) => 
          new StaticParserLoader(translate, location, settings, http, 'your/path/to/config.json'), 
        deps: [TranslateService, Location, LocalizeRouterSettings, Http] 
      },
      useCachedLang: { provide: USE_CACHED_LANG, useValue: booleanValue },
      alwaysSetPrefix: { provide: ALWAYS_SET_PREFIX, useValue: booleanValue },
      cacheName: { provide: CACHE_NAME, useValue: stringValue },
      cacheMechanism: { provide: CACHE_MECHANISM, useValue: typeOfCacheMechanism },
      defaultLangFunction: { provide: DEFAULT_LANG_FUNCTION, useValue: typeOfDefaultLanguageFunction },
    })
    ```

   Check [documentation](https://github.com/Greentube/localize-router/blob/master/README.md#localizerouterconfig) for more details on how to set settings.
