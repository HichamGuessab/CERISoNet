import {Component, OnInit} from '@angular/core';
import {AuthentificationService} from "../authentification.service";

@Component({
    selector : 'app-login',
    templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  identifiant: string = '';
  mot_de_passe: string = '';
  isConnected: boolean = false;

  constructor(
    private authentificationService: AuthentificationService
  ) {
  }

  ngOnInit() {
    // Écoute de l'observable de connexion
    this.authentificationService.getConnectedObservable().subscribe((connected) => {
      this.isConnected = connected;
      console.log(this.isConnected);
    });
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
}
