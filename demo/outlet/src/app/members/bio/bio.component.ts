import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MembersService, Member } from '../shared';

@Component({
  selector: 'app-bio',
  templateUrl: './bio.component.html'
})
export class BioComponent implements OnInit {
  currentMember: Member;

  constructor(
    private route: ActivatedRoute,
    private service: MembersService
  ) { }

  ngOnInit() {
    this.route.params.subscribe((params: {id: string}) => {
      if (params && params.id) {
        this.service.getMemberByHandle(params.id).subscribe(speaker =>
          this.currentMember = speaker);
      }
    });
  }
}
