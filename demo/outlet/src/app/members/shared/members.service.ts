import { Injectable } from '@angular/core';
import { Member } from './';
import { Observable, of, forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class MembersService {

  private usernames = ['meeroslav', 'BioPhoton', 'michaelbromley', 'mjurisic', 'jack13'];
  private gitHubUrl = 'http://api.github.com/users';
  private members$;

  constructor(private http: HttpClient) {
    const observables = this.usernames.map((username: string) => this.getMemberByHandle(username));

    this.members$ = forkJoin(...observables);
    this.members$.subscribe();
  }

  getMembers() {
    return this.members$;
  }

  getMemberByHandle(username): Observable<Member> {
    if (username === 'none') {
      return of(void 0);
    }
    return this.http.get<Member>(`${this.gitHubUrl}/${username}`);
  }
}
