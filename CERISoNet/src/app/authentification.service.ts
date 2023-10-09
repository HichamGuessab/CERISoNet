import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {BehaviorSubject, Observable} from "rxjs";
import {NotificationService} from "./notification.service";

@Injectable({
  providedIn: 'root'
})
export class AuthentificationService {
  connectedSubject = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService) {
    const isConnected = sessionStorage.getItem('isConnected');
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
    // On indique absolument que l'objet possède un objet message de type string pour pouvoir l'utiliser.
    this.http.get<{ message: string }>('/logout').subscribe(  {
      next: response => {
        this.connectedSubject.next(false);
        console.log("false: " + this.connectedSubject.getValue());
        console.log('Réponse du serveur : ', response);
        this.notificationService.publish(response.message)
        sessionStorage.removeItem('isConnected');
      },
      error: (error: any) => {
        console.error('Erreur lors de la déconnexion : ', error.error.message);
        this.notificationService.publish(error.error.message)
      }
    })
  }
}
