import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket'
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  backendUrl = "wss://pedago.univ-avignon.fr:3201"
  socket$: WebSocketSubject<any> = webSocket(this.backendUrl);

  constructor() {
    // this.socket$.subscribe({
    // next: (message) => {
    //   console.log('Message reçu du serveur WebSocket :', message);
    // },
    // error: (error) => {
    //   console.error('Erreur de connexion WebSocket :', error);
    // },
    // complete: () => {
    //     console.log('Connexion WebSocket fermée.');
    //   }
    // });
  }

  getWebSocketObservable() : Observable<any> {
    return this.socket$;
  }
}
