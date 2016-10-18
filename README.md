# localize-router
> An implementation of routes localization for Angular 2.

Based on and extension of [ng2-translate](https://github.com/ocombe/ng2-translate).

Content: 
* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

## Installation

* soon
```
npm install --save-dev localize-router
```

## Usage

In order to use `localize-router` you must initialize it with following information:
* Available languages/locales
* Prefix for route segment translations
* Routes to be translated

### Initialize module

Module can be initialized either using static file on manually by passing necessary values

Static file initialization:
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

### Use pipe

### Use service

## API

## License

Licensed under MIT