import {Component, OnInit} from '@angular/core';
import {WebsocketService} from "../websocket.service";

@Component({
  selector: 'app-users-connected',
  templateUrl: './users-connected.component.html'
})
export class UsersConnectedComponent implements OnInit {
  messages: string[] = [];
  loading: boolean = true;

  constructor(private socketService: WebsocketService) {}

  ngOnInit(): void {
    this.socketService.getWebSocketObservable().subscribe((webSocket) => {
      if (webSocket.type === 'usersConnected') {
        // Sockter les identifiants actuel
        const currentUsers: Set<string> = new Set(webSocket.data.message);

        // Conserver seulement les utilisateurs qui existent dans currentUsers
        this.messages = this.messages.filter(user => currentUsers.has(user));

        // Ajout des nouveaux utilisateurs qui n'existent pas dans this.messages
        for (const user of currentUsers) {
          if (!this.messages.includes(user)) {
            this.messages.push(user);
          }
        }
        this.loading = false;
      }
    });
  }
}
