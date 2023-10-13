import {Component, Input} from '@angular/core';
import {Commentaire} from "../../models/commentaire.model";

@Component({
  selector: 'app-commentaire',
  templateUrl: './commentaire.component.html'
})
export class CommentaireComponent {
    @Input() commentaire: Commentaire;
}
