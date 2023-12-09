import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {BehaviorSubject, filter, Observable} from "rxjs";
import {Message} from "../models/message.model";

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  messagesSubject = new BehaviorSubject<Message[]>([])
  defaultMessage: Message = new Message();

  owner$ = new BehaviorSubject<number>(null);
  hashtag$ = new BehaviorSubject<string>(null);
  sorting$ = new BehaviorSubject<string>(null);
  sortingOrder$ = new BehaviorSubject<string>(null);

  usersCorrespondancesSubject = new BehaviorSubject<any>(null);

  constructor(private httpClient: HttpClient) {}

  getMessagesFilteredAndSorted() {
    this.httpClient.get<Message[]>(`/messages/${this.owner$.getValue()}/${this.hashtag$.getValue()?.substring(1)}/${this.sorting$.getValue()}/${this.sortingOrder$.getValue()}`).subscribe({
      next : response => {
        let messages: Message[] = [];
        for (let message of response) {
          messages.push(this.initialisation(message))
        }
        this.messagesSubject.next(messages);
      }
    })
  }

  getUsersCorrespondances() {
    this.httpClient.get<any>('usersCorrespondences').subscribe({
      next : response => {
        let usersCorrespondences: any = [];
        for (let userCorrespondence of response) {
          usersCorrespondences.push(userCorrespondence);
        }
        this.usersCorrespondancesSubject.next(usersCorrespondences);
      }
    })
  }

  initialisation(message: Message) {
    return { ...this.defaultMessage, ...message };
  }

  getMessagesObservable(): Observable<Message[]> {
    return this.messagesSubject.asObservable();
  }

  getUsersCorrespondancesObservable() {
    return this.usersCorrespondancesSubject.asObservable();
  }
}
