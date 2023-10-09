import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {response} from "express";
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class AuthentificationService {
  connectedSubject = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) { }

  connexion(formData: any) {
    console.log("Appel à la connexion : ")
    this.http.post('/login', formData).subscribe({
      next: response => {
        this.connectedSubject.next(true);
        console.log('Réponse du serveur : ', response);
      },
      error: error => {
        console.error('Erreur lors de la connexion : ', error);
      }
    })
  }

  deconnexion() {
    console.log("Appel à la déconnexion : ")
    this.http.get('/logout').subscribe(  {
      next: response => {
        this.connectedSubject.next(false);
        console.log('Réponse du serveur : ', response);
      },
      error: error => {
        console.error('Erreur lors de la déconnexion : ', error);
      }
    })
  }
}
