import {Component, OnInit} from '@angular/core';
import {MessageService} from "../message.service";
import {Message} from "../../models/message.model";

@Component({
  selector: 'app-message-container',
  templateUrl: './message-container.component.html'
})
export class MessageContainerComponent implements OnInit{
  messages: Message[] = [];
  defaultMessage = new Message();

  constructor(private messageService: MessageService) {}

  ngOnInit() {
    this.messageService.getMessages().subscribe((messages) => {
      for (let message of messages) {
        this.messages.push(this.initialisation(message))
      }
    })
  }

  initialisation(message: Message) {
    return { ...this.defaultMessage, ...message };
  }
}
