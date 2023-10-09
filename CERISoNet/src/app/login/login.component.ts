import {Component, ViewChild} from '@angular/core';
import {NgForm} from "@angular/forms";
import {Router} from "@angular/router";
import {AuthentificationService} from "../authentification.service";

@Component({
    selector : 'app-login',
    templateUrl: './login.component.html'
})
export class LoginComponent {
  identifiant: string = '';
  mot_de_passe: string = '';

  constructor(
    private router: Router,
    private authentificationService: AuthentificationService
  ) {
  }

  onConnexion() {
    const formData = {
      identifiant: this.identifiant,
      mot_de_passe: this.mot_de_passe
    }
    this.authentificationService.connexion(formData);
  }

  OnDeconnexion() {
    this.authentificationService.deconnexion();
  }

  isConnected() {
    return this.authentificationService.connectedSubject.getValue();
  }
}
