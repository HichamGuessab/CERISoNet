import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Message} from "../../models/message.model";
import {AuthentificationService} from "../authentification.service";

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html'
})
export class MessageComponent {
  @Input() message: Message;
  openForm: boolean = false;
  liked: boolean = true;
  @Input() isConnected: boolean;

  @Output() likeMessageEvent = new EventEmitter();

  likeMessage() {
    if(this.isConnected) {
      if(this.liked) {
        this.message.likes++;
      } else {
        this.message.likes--;
      }
      this.liked = !this.liked;
    }
    this.likeMessageEvent.emit();
  }
}
