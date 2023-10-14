import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {BehaviorSubject, Observable} from "rxjs";
import {Message} from "../models/message.model";

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  messagesSubject = new BehaviorSubject<Message[]>([])
  defaultMessage: Message = new Message();

  constructor(private httpClient: HttpClient) { }

  getMessages(){
    console.log('Appel à getMessages');
    this.httpClient.get<Message[]>('/messages').subscribe({
      next : response => {
        let messages: Message[] = [];
        for (let message of response) {
          messages.push(this.initialisation(message))
        }
        console.log(response)
        this.messagesSubject.next(messages);
      }
    });
  }

  initialisation(message: Message) {
    return { ...this.defaultMessage, ...message };
  }

  getMessagesObservable(): Observable<Message[]> {
    return this.messagesSubject.asObservable();
  }
}
