import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { BandeauComponent } from './bandeau/bandeau.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'bandeau', component: BandeauComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
