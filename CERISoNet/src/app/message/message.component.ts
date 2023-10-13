import {Component, OnInit} from '@angular/core';
import {MessageService} from "../message.service";

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html'
})
export class MessageComponent implements OnInit{
  messages: any[] = [];

  constructor(private messageService: MessageService) {}

  ngOnInit() {
    this.messageService.getMessages().subscribe((messages) => {
      this.messages = messages;
    })
  }
}
