import {Component, OnInit} from '@angular/core';
import {AuthentificationService} from "./authentification.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'CERISoNet';

  isConnected: boolean;

  constructor(private authentificationService: AuthentificationService) {}

  ngOnInit() {
    this.authentificationService.getIsConnectedObservable().subscribe( isConnected => {
      this.isConnected = isConnected;
    })
  }


}
