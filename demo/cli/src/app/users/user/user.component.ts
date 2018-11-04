import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRoute, Params } from '@angular/router';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent {
  user: Observable<string>;

  constructor(private route: ActivatedRoute) {
    this.user = this.route.params
      .pipe(map((p: Params) => p.id as string));
  }
}
