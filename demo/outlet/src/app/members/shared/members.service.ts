import { Injectable } from '@angular/core';
import { Member } from './';
import { Observable } from 'rxjs/Observable';
import { HttpClient } from '@angular/common/http';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/observable/of';

@Injectable()
export class MembersService {

  private usernames = ['meeroslav', 'BioPhoton', 'michaelbromley', 'mjurisic', 'jack13'];
  private gitHubUrl = 'http://api.github.com/users';
  private members$;

  constructor(private http: HttpClient) {
    const observables = this.usernames.map((username: string) => this.getMemberByHandle(username));

    this.members$ = Observable.forkJoin(...observables);
    this.members$.subscribe();
  }

  getMembers() {
    return this.members$;
  }

  getMemberByHandle(username): Observable<Member> {
    if (username === 'none') {
      return Observable.of(void 0);
    }
    return this.http.get<Member>(`${this.gitHubUrl}/${username}`);
  }
}
