import {Component, OnInit} from '@angular/core';
import {MessageService} from "../message.service";
import {Message} from "../../models/message.model";

@Component({
  selector: 'app-message-container',
  templateUrl: './message-container.component.html'
})
export class MessageContainerComponent implements OnInit{
  messages: Message[] = [];
  messagesShowed: Message[] = [];
  defaultMessage: Message = new Message();
  messagesPerPage: number = 4;
  currentPage: number = 1;
  totalMessages: number;
  totalPages: number;
  sortBy: 'owner' | 'date' | 'popularity' = 'date';

  constructor(private messageService: MessageService) {}

  ngOnInit() {
    this.messageService.getMessages().subscribe((messages) => {
      this.totalMessages = messages.length
      for (let message of messages) {
        this.messages.push(this.initialisation(message))
      }
      this.messagesShowed = this.setIndex(this.messages);
      this.totalPages = Math.ceil(this.messages.length / this.messagesPerPage);
    })
  }

  initialisation(message: Message) {
    return { ...this.defaultMessage, ...message };
  }

  setIndex(messages: Message[]) {
    const startIndex = (this.currentPage - 1) * this.messagesPerPage;
    return messages.slice(startIndex, startIndex + this.messagesPerPage);
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.messagesShowed = this.setIndex(this.messages);
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.messagesShowed = this.setIndex(this.messages);
    }
  }

  hasNextPage() {
    return this.currentPage < this.totalPages;
  }

  changeSortBy(criteria: 'owner' | 'date' | 'popularity') {
    this.sortBy = criteria;
    this.sortMessages();
  }

  sortMessages() {
    if (this.sortBy === 'owner') {
      this.messages.sort((a, b) => a.createdBy - b.createdBy);
    } else if (this.sortBy === 'date') {
      this.messages.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.hour);
        const dateB = new Date(b.date + ' ' + b.hour);
        return dateA.getTime() - dateB.getTime();
      });
    } else if (this.sortBy === 'popularity') {
      this.messages.sort((a, b) => b.likes - a.likes);
    }

    this.messagesShowed = this.setIndex(this.messages);
  }
}
