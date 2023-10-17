import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Message} from "../../models/message.model";

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html'
})
export class MessageComponent {
  @Input() message: Message;
  openForm: boolean = false;

  @Output() likeMessageEvent = new EventEmitter();

  likeMessage() {
    this.likeMessageEvent.emit();
  }
}
