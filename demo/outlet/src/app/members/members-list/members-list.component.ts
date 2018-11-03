import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MembersService, Member } from '../shared';
import { Observable } from 'rxjs/Observable';
import { LocalizeRouterService } from 'localize-router';

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
    private service: MembersService,
    private localize: LocalizeRouterService
  ) { }

  ngOnInit() {
    this.members$ = this.service.getMembers();
    const outlet = this.route.parent.children.find(r => r.outlet === 'bio');
    if (outlet) {
     outlet.params
        .subscribe((params: any) => {
          if (params.id) {
            this.selectedMember = params.id;
          }
        });
    }
  }

  showBio(id: string) {
    this.selectedMember = id;

    const route = this.localize.translateRoute(['/members', { outlets: { 'bio' : [id] }}]) as any[];
    this.router.navigate(route);
  }
}
