import {Component, Input, OnInit} from '@angular/core';
import {Commentaire} from "../../models/commentaire.model";

@Component({
  selector: 'app-commentaire-container',
  templateUrl: './commentaire-container.component.html'
})
export class CommentaireContainerComponent {
  @Input() commentaires: Commentaire[];
  @Input() openForm: boolean = true;
  @Input() messageId: number;
  @Input() openShareMessageForm: boolean;
  @Input() usersCorrespondences: any;
}
