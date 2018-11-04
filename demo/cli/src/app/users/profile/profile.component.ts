import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRoute, Params } from '@angular/router';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent {
  user: Observable<string>;

  constructor(private route: ActivatedRoute) {
    this.user = this.route.params
      .pipe(map((p: Params) => p.id as string));
  }

}
