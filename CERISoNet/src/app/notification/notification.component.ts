import {Component, OnInit} from '@angular/core';
import {NotificationService} from "../notification.service";
import {AuthentificationService} from "../authentification.service";

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html'
})
export class NotificationComponent implements OnInit {
  notificationMessage: string = '';
  lastConnexion = localStorage.getItem('lastConnexion');
  isConnected: boolean;

  constructor(private notificationService: NotificationService,
              private authentificationService: AuthentificationService) {}

  ngOnInit() {
    // IsConnected
    this.authentificationService.getIsConnectedObservable().subscribe((isConnected) => {
      this.isConnected = isConnected;
    })

    // Last Connexion
    this.authentificationService.getlastConnexionObservable().subscribe((lastConnexion) => {
      this.lastConnexion = lastConnexion;
    });

    // Notifications
    this.notificationService.getObservable().subscribe((message) => {
      this.notificationMessage = message;
      setTimeout(() => {
        this.notificationMessage = ''; // Effacer la notification après 10 secondes
      }, 10000);
    });
  }

}
