import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {NotificationService} from "./notification.service";
import {MessageService} from "./message.service";
import {Commentaire} from "../models/commentaire.model";
import {isEmpty} from "rxjs";
import {CryptoService} from "./crypto.service";

@Injectable({
  providedIn: 'root'
})
export class CommentService {

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private messageService: MessageService,
    private cryptoService: CryptoService) {}

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
            this.messageService.getMessagesFilteredAndSorted();
          },
          error: err => {
            this.notificationService.publish(err.message);
          }
        }
      );
    }
  }

  deleteComment(messageId: number, commentaire: Commentaire, connectedUserId: number) {
    if(commentaire.text.length == 0) {
      commentaire.text = "*^$²^s²df;²:pojn84g²1d5"
    }
    if(commentaire.commentedBy == null) {
      commentaire.commentedBy = 0;
    }

    // Pour éviter que ça m'affiche le texte crypté lorsque je supprime un commentaire.
    let monCommentaire = commentaire.text;
    monCommentaire = this.cryptoService.encrypt(commentaire.text);

    if (commentaire.commentedBy != connectedUserId) {
      this.notificationService.publish("Impossible de supprimer le commentaire.")
    }
    else {
      // console.log(messageId);
      // console.log(commentaire.commentedBy);
      // console.log(commentaire.text);
      // console.log(commentaire.date);
      // console.log(connectedUserId);
      this.http.delete<{message: string}>(`/messages/${messageId}/${commentaire.commentedBy}/text/${monCommentaire}/date/${commentaire.date}/${commentaire.hour}/deleteComment`)
        .subscribe({
          next: res => {
            console.log("Reussi : " + res);
            this.notificationService.publish(res.message)
            console.log("COUCOU2")
            this.messageService.getMessagesFilteredAndSorted();
          },
          error: err => {
            console.log("Erreur :" + err);
            this.notificationService.publish(err.message)
          }
        })
    }
  }

}
