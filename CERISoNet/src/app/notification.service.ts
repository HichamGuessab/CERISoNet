import { Injectable } from '@angular/core';
import {Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new Subject<string>();

  publish(message: string) {
    this.notificationSubject.next(message);
  }

  getObservable() {
    return this.notificationSubject.asObservable();
  }
}
