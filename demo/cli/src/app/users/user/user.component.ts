import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent {
  user: Observable<string>;

  constructor(private route: ActivatedRoute) {
    this.user = route.params.map((p: any) => p.id);
  }
}
