import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent {
  user: Observable<string>;

  constructor(private route: ActivatedRoute) {
    this.user = route.params.map((p: any) => p.id);
  }

}
