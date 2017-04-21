import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersComponent } from './users/users.component';
import { UserComponent } from './user/user.component';
import { ProfileComponent } from './profile/profile.component';
import { TranslateModule } from '@ngx-translate/core';
import { UsersRoutingModule } from './users-routing.module';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    UsersRoutingModule
  ],
  declarations: [UsersComponent, UserComponent, ProfileComponent]
})
export class UsersModule { }
