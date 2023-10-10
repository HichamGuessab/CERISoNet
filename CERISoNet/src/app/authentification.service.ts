import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {BehaviorSubject, Observable} from "rxjs";
import {NotificationService} from "./notification.service";

@Injectable({
  providedIn: 'root'
})
export class AuthentificationService {
  isConnectedSubject = new BehaviorSubject<boolean>(false);
  lastConnexionSubject = new BehaviorSubject<string>("");
  lastConnexion: string = "";
  nowConnexion: string = "";

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService) {
    this.lastConnexion = localStorage.getItem('lastConnexion');
    this.checkConnexion();
  }

  checkConnexion() {
    this.http.get<{ isConnected: boolean }>('/checkConnexion').subscribe({
      next: response => {
        this.isConnectedSubject.next(response.isConnected);
      },
      error: error => {
        return error.message;
      }
    })
  }

  connexion(formData: any) {
    console.log("Appel à la connexion : ")
    // On indique absolument que l'objet possède un objet message de type string pour pouvoir l'utiliser.
    this.http.post<{ message: string }>('/login', formData).subscribe({
      next: response => {
        this.checkConnexion();
        this.notificationService.publish(response.message)
        this.nowConnexion = new Date().toLocaleString();
        this.lastConnexion = localStorage.getItem('lastConnexion');
        this.lastConnexionSubject.next(this.lastConnexion);
        localStorage.setItem('lastConnexion', this.nowConnexion);
        this.lastConnexion = this.nowConnexion;
      },
      error: (error: any) => {
        this.checkConnexion();
        console.error('Erreur lors de la déconnexion : ', error.error.message);
        this.notificationService.publish(error.error.message)
      }
    })
  }

  deconnexion() {
    console.log("Appel à la déconnexion : ")

    this.http.get<{ message: string }>('/logout').subscribe({
      next: response => {
        this.checkConnexion();
        this.notificationService.publish(response.message)
      },
      error: (error: any) => {
        this.checkConnexion();
        console.error('Erreur lors de la déconnexion : ', error.error.message);
        this.notificationService.publish(error.error.message)
      }
    })
  }

  getlastConnexionObservable(): Observable<string> {
    return this.lastConnexionSubject.asObservable();
  }

  getIsConnectedObservable(): Observable<boolean> {
    return this.isConnectedSubject.asObservable();
  }
}
