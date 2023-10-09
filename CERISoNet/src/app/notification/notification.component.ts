import {Component, OnInit} from '@angular/core';
import {NotificationService} from "../notification.service";

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html'
})
export class NotificationComponent implements OnInit {
  notificationMessage: string = '';

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    // Ecoute les notifications
    this.notificationService.getObservable().subscribe((message) => {
      this.notificationMessage = message;
      setTimeout(() => {
        this.notificationMessage = ''; // Effacer la notification après 7 secondes
      }, 7000);
    });
  }

}
