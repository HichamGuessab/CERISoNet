import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {NotificationService} from "./notification.service";
import {MessageService} from "./message.service";

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private messageService: MessageService) {}

  postComment(messageId: string, commentText: string, id: number) {
    if (id == null || id == 0 || commentText == "") {
      this.notificationService.publish("Impossible de poster un commentaire.")
    }
    else {
      this.http.post<{message: string}>(`/messages/${messageId}/comment`, {
        commentedBy: id,
        text: commentText
      }).subscribe({
          next: response => {
            this.notificationService.publish(response.message);
            this.messageService.getMessages();
          },
          error: err => {
            this.notificationService.publish(err.message);
          }
        }
      );
    }
  }
}
