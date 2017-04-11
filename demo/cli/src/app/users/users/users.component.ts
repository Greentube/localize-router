import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {

  users: string[];

  constructor() { }

  ngOnInit() {
    this.users = [
      'Ada Lovelace',
      'Niklaus Wirth',
      'Donald Knuth',
      'Bjarne Stroustrup',
      'Edsger W. Dijkstra',
      'Alan Turing',
      'Anders Hejlsberg'
    ]
  }

}
