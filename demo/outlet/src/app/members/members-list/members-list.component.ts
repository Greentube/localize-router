import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MembersService, Member } from '../shared';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-members-list',
  templateUrl: './members-list.component.html'
})
export class MembersListComponent implements OnInit {
  members$: Observable<Member[]>;
  selectedMember: string;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private service: MembersService
  ) { }

  ngOnInit() {
    this.members$ = this.service.getMembers();
    this.route.parent.children
      .find(r => r.outlet === 'bio')
      .params
      .subscribe((params: any) => {
        if (params.id) {
          this.selectedMember = params.id;
        }
      });
  }

  showBio(id: string) {
    this.selectedMember = id;
    this.router.navigate(['/members', {outlets: {'bio': [id]}}]);
  }
}
