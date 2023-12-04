import {Component, OnInit} from '@angular/core';
import {MessageService} from "../message.service";
import {Message} from "../../models/message.model";
import {WebsocketService} from "../websocket.service";
import {AuthentificationService} from "../authentification.service";
import {NotificationService} from "../notification.service";

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
  sortBy: 'createdBy' | 'date' | 'likes' = 'date';
  selectedOwner: number | null = null;
  selectedHashtag: string | null = null;
  uniqueOwners: any[];
  uniqueHashtags: any[];
  isSortAscending: boolean = true;
  messagesLikesByUser: { [userId: number]: number[] } = {};
  connectedUserId : number;
  isConnected: boolean;

  constructor(
    private messageService: MessageService,
    private webSocketService: WebsocketService,
    private authentificationService: AuthentificationService,
    private notificationService: NotificationService) {}

  ngOnInit() {
    this.authentificationService.getIdSubject().subscribe( connectedUserId => {
      this.connectedUserId = connectedUserId;
    })

    this.authentificationService.getIsConnectedObservable().subscribe( isConnected => {
      this.isConnected = isConnected;
    })

    this.messageService.getMessagesFilteredAndSorted();

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

  changeSortBy(criteria: 'createdBy' | 'date' | 'likes') {
    if (this.sortBy === criteria) {
      this.isSortAscending = !this.isSortAscending;
    } else {
      this.sortBy = criteria;
      this.messageService.sorting$.next(criteria);
      this.isSortAscending = true;
    }
    this.filterMessages();
  }

  filterMessages() {
    // Réinitialiser les filtres pour afficher tous les messages
    this.messageService.owner$.next(this.selectedOwner);
    this.messageService.hashtag$.next(this.selectedHashtag);
    this.messageService.sortingOrder$.next(this.isSortAscending.toString())
    this.messageService.getMessagesFilteredAndSorted();
    this.messagesShowed = this.setIndex(this.messages);
  }

  likeMessage(messageId: number) {
    if(this.isConnected) {
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
    } else {
      this.notificationService.publish("Impossible de liker : vous n'êtes pas connecté.");
    }
  }
}
