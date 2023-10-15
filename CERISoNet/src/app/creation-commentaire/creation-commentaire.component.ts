import {Component, Input, OnInit} from '@angular/core';
import {CommentService} from "../comment.service";
import {AuthentificationService} from "../authentification.service";

@Component({
  selector: 'app-creation-commentaire',
  templateUrl: './creation-commentaire.component.html'
})
export class CreationCommentaireComponent implements OnInit{
  commentText: string = '';
  @Input() messageId;
  connectedUserId : number;

  constructor(
    private commentService: CommentService,
    private authentificationService: AuthentificationService) {}

  ngOnInit(): void {
    this.authentificationService.getIdSubject().subscribe( (id) => {
        this.connectedUserId = id;
    })
  }

  submitComment() {
    this.commentService.postComment(this.messageId, this.commentText, this.connectedUserId);
  }
}
