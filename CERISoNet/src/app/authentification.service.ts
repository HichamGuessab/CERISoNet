import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {BehaviorSubject, Observable} from "rxjs";
import {NotificationService} from "./notification.service";

@Injectable({
  providedIn: 'root'
})
export class AuthentificationService {
  connectedSubject = new BehaviorSubject<boolean>(false);
  lastConnexionSubject = new BehaviorSubject<string>("");
  lastConnexion: string = "";
  nowConnexion: string = "";

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService) {
    const isConnected = sessionStorage.getItem('isConnected');
    this.lastConnexion = localStorage.getItem('lastConnexion');
    if (isConnected === 'true') {
      this.connectedSubject.next(true);
    }
  }

  getConnectedObservable(): Observable<boolean> {
    return this.connectedSubject.asObservable();
  }

  connexion(formData: any) {
    console.log("Appel à la connexion : ")
    // On indique absolument que l'objet possède un objet message de type string pour pouvoir l'utiliser.
    this.http.post<{ message: string }>('/login', formData).subscribe({
      next: response => {
        this.connectedSubject.next(true);
        this.notificationService.publish(response.message)
        sessionStorage.setItem('isConnected', 'true');
        this.nowConnexion = new Date().toLocaleString();
        this.lastConnexion = localStorage.getItem('lastConnexion');
        this.lastConnexionSubject.next(this.lastConnexion);
      },
      error: (error: any) => {
        this.connectedSubject.next(false);
        console.error('Erreur lors de la déconnexion : ', error.error.message);
        this.notificationService.publish(error.error.message)
      }
    })
  }

  deconnexion() {
    console.log("Appel à la déconnexion : ")

    this.http.get<{ message: string }>('/logout').subscribe(  {
      next: response => {
        this.connectedSubject.next(false);
        console.log("false: " + this.connectedSubject.getValue());
        console.log('Réponse du serveur : ', response);
        this.notificationService.publish(response.message)
        sessionStorage.removeItem('isConnected');
        localStorage.setItem('lastConnexion', this.nowConnexion);
        this.lastConnexion = this.nowConnexion;
      },
      error: (error: any) => {
        console.error('Erreur lors de la déconnexion : ', error.error.message);
        this.notificationService.publish(error.error.message)
      }
    })
  }

  getlastConnexionObservable(): Observable<string> {
    return this.lastConnexionSubject.asObservable();
  }
}
