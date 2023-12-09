import {Component, Input, OnInit} from '@angular/core';
import {Commentaire} from "../../models/commentaire.model";
import {CommentService} from "../comment.service";
import {AuthentificationService} from "../authentification.service";
import {Message} from "../../models/message.model";

@Component({
  selector: 'app-commentaire',
  templateUrl: './commentaire.component.html'
})
export class CommentaireComponent implements OnInit{
    @Input() messageId: number;
    @Input() commentaire: Commentaire;
    connectedUserId: number;
    @Input() usersCorrespondences: any;

    constructor(
      private commentService: CommentService,
      private authentificationService: AuthentificationService) {}

    ngOnInit(): void {
      this.authentificationService.getIdSubject().subscribe( connectedUserId => {
        this.connectedUserId = connectedUserId;
      })
    }

    deleteComment() {
      this.commentService.deleteComment(this.messageId, this.commentaire, this.connectedUserId);
    }

    getUserCorrespondence(id: number) {
      const identifiant = (this?.usersCorrespondences?.find(
          (element: { id: number; }) => element?.id == id)
      )?.identifiant;

      if (identifiant == null || identifiant == undefined) {
        return "Auteur inconnu";
      }
      return identifiant;
    }
}
