import {Component, OnChanges, OnInit} from '@angular/core';
import {MessageService} from "../message.service";
import {Message} from "../../models/message.model";
import {WebsocketService} from "../websocket.service";
import {AuthentificationService} from "../authentification.service";

@Component({
  selector: 'app-message-container',
  templateUrl: './message-container.component.html'
})
export class MessageContainerComponent implements OnInit{
  messages: Message[] = [];
  messagesShowed: Message[] = [];
  messagesPerPage: number = 4;
  currentPage: number = 1;
  totalPages: number;
  sortBy: 'owner' | 'date' | 'popularity' = 'date';
  selectedOwner: number | null = null;
  selectedHashtag: string | null = null;
  uniqueOwners: any[];
  uniqueHashtags: any[];
  isSortAscending: boolean = true;
  messagesLikesByUser: { [userId: number]: number[] } = {};
  connectedUserId : number;

  constructor(
    private messageService: MessageService,
    private webSocketService: WebsocketService,
    private authentificationService: AuthentificationService) {}

  ngOnInit() {
    this.authentificationService.getIdSubject().subscribe( connectedUserId => {
      this.connectedUserId = connectedUserId;
    })
    this.messageService.getMessages();
    this.messageService.getMessagesObservable().subscribe(messages => {
      this.messages = messages;
      this.messagesShowed = this.setIndex(this.messages);
      this.totalPages = Math.ceil(this.messages.length / this.messagesPerPage);

      this.uniqueOwners = Array.from(new Set(messages.flatMap(message => message.createdBy)));
      this.uniqueHashtags = Array.from(new Set(messages.flatMap(message => message.hashtags)));
    })
    this.webSocketService.getWebSocketObservable().subscribe((webSocket) => {
      if(webSocket.type === "messageLiked") {
        const updatedMessage = this.messages.find((msg) => msg._id === webSocket.messageId);
        if (updatedMessage) {
          updatedMessage.likes = webSocket.nbLikes;
        }
      }
    })
  }

  setIndex(messages: Message[]) {
    const startIndex = (this.currentPage - 1) * this.messagesPerPage;
    console.log("page" + this.currentPage);
    this.totalPages = Math.ceil(this.messages.length / this.messagesPerPage);
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
    if (this.sortBy === criteria) {
      this.isSortAscending = !this.isSortAscending;
    } else {
      this.sortBy = criteria;
      this.isSortAscending = true;
    }
    this.filterMessages();
  }

  sortShowedMessages() {
    let messagesToSort = this.messagesShowed; // Tri des messages affichés
    if (this.sortBy === 'owner') {
      messagesToSort.sort((a, b) => (this.isSortAscending ? a.createdBy - b.createdBy : b.createdBy - a.createdBy));
    } else if (this.sortBy === 'date') {
      messagesToSort.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.hour);
        const dateB = new Date(b.date + ' ' + b.hour);
        return this.isSortAscending ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      });
    } else if (this.sortBy === 'popularity') {
      messagesToSort.sort((a, b) => (this.isSortAscending ? b.likes - a.likes : a.likes - b.likes));
    }

    this.messagesShowed = this.setIndex(messagesToSort);
    this.totalPages = Math.ceil(this.messagesShowed.length / this.messagesPerPage);
  }

  sortAllMessages() {
    if (this.sortBy === 'owner') {
      // Opérateur conditionnel ternaire : condition ? result(if) : result(else)
      this.messages.sort((a, b) => (this.isSortAscending ? a.createdBy - b.createdBy : b.createdBy - a.createdBy));
    } else if (this.sortBy === 'date') {
      this.messages.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.hour);
        const dateB = new Date(b.date + ' ' + b.hour);
        return this.isSortAscending ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      });
    } else if (this.sortBy === 'popularity') {
      this.messages.sort((a, b) => (this.isSortAscending ? b.likes - a.likes : a.likes - b.likes));
    }

    this.messagesShowed = this.setIndex(this.messages);
  }

  filterByOwner(ownerId: number) {
    this.messagesShowed = this.messages.filter(message => message.createdBy === ownerId);
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.messagesShowed.length / this.messagesPerPage);
  }

  filterByHashtag(hashtag: string) {
    this.messagesShowed = this.messages.filter(message => message.hashtags.includes(hashtag));
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.messagesShowed.length / this.messagesPerPage);
  }

  filterMessages() {
    if (this.selectedOwner !== null && this.selectedHashtag !== null) {
      this.filterByOwner(this.selectedOwner);
      this.filterByHashtag(this.selectedHashtag);
    } else if (this.selectedOwner !== null) {
      this.filterByOwner(this.selectedOwner);
    } else if (this.selectedHashtag !== null) {
      this.filterByHashtag(this.selectedHashtag);
    } else {
      // Réinitialiser les filtres pour afficher tous les messages
      this.messagesShowed = this.setIndex(this.messages);
    }

    this.currentPage = 1;

    this.totalPages = Math.ceil(this.messagesShowed.length / this.messagesPerPage);
    console.log(this.totalPages);
    if (this.sortBy) {
      this.sortShowedMessages();
    }
    if(this.selectedHashtag == null && this.selectedOwner == null) {
      this.sortAllMessages();
    }
  }

  likeMessage(messageId: number) {
    console.log("Dedans")
    console.log()
    const userId = this.connectedUserId;

    if (!this.messagesLikesByUser[userId]) {
      this.messagesLikesByUser[userId] = [];
    }

    let exist: boolean = this.messagesLikesByUser[userId].includes(messageId);
    console.log(exist)
    console.log(this.messagesLikesByUser);
    if (!exist) {
      this.messagesLikesByUser[userId].push(messageId);
      console.log("On va liker")
      console.log(this.messagesLikesByUser);
    } else {
      console.log("On va disliker")
      console.log(this.messagesLikesByUser);
      const index = this.messagesLikesByUser[userId].indexOf(messageId);
      if (index !== -1) {
        this.messagesLikesByUser[userId].splice(index, 1);
      }
      console.log(this.messagesLikesByUser);
    }

    this.webSocketService.sendMessage({
      event: "likedMessage",
      messageId: messageId,
      like : !exist
    });
    this.messageService.getMessages();
  }
}
