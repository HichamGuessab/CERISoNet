import {Component, Input, OnInit} from '@angular/core';
import {WebsocketService} from "../websocket.service";
import {AuthentificationService} from "../authentification.service";
import {MessageService} from "../message.service";
import {NotificationService} from "../notification.service";

@Component({
  selector: 'app-share-message',
  templateUrl: './share-message.component.html'
})
export class ShareMessageComponent implements OnInit{
  messageText: string = '';
  @Input() messageId;
  connectedUserId : number;
  hashtags: string[] = [];
  hashtag: string = "";
  image: string = "https://www.ncenet.com/wp-content/uploads/2020/04/No-image-found.jpg";
  imageTitle: string = "";
  isConnected: boolean;

  constructor(
    private websocketService: WebsocketService,
    private authentificationService: AuthentificationService,
    private messageService: MessageService,
    private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.authentificationService.getIdSubject().subscribe((connectedUserId) => {
      this.connectedUserId = connectedUserId;
    })
    this.authentificationService.getIsConnectedObservable().subscribe((isConnected) => {
      this.isConnected = isConnected;
    })
  }

  addHashtag() {
    if(this.hashtag != "") {
      this.hashtag = "#"+this.hashtag;
      if(this.hashtags.length == 0) {
        this.hashtags = [this.hashtag];
      } else {
        this.hashtags.push(this.hashtag);
      }
      console.log(this.hashtags)
      this.hashtag = "";
    }
    else {
      this.notificationService.publish("Veuillez renseigner un hashtag pour l'ajouter.")
    }
  }

  isValidImageUrl(url: string) {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif"];
    return imageExtensions.some((ext) => url.toLowerCase().endsWith(ext)
    );
  }

  submitMessage() {
    if(this.isConnected) {
      if(this.messageText === "") {
        this.notificationService.publish("Veuillez écrire le texte de votre message.")
      } else {
        console.log(this.image);
        if(this.isValidImageUrl(this.image)) {
          console.log("JE SUBMIT222")
          const newMessageData = {
            body: this.messageText,
            createdBy: this.connectedUserId,
            images: {
              url: this.image,
              title: this.imageTitle
            },
            likes: 0,
            hashtags: this.hashtags,
            comments: [],
            shared: this.messageId,
          };
          this.websocketService.sendMessage({
            event: "shareMessage",
            message: newMessageData
          });
          this.messageService.getMessagesFilteredAndSorted();
          this.notificationService.publish("Post partagé avec succès !");
        } else {
          this.notificationService.publish("L'url de votre image est introuvable.")
        }
      }
    } else {
      this.notificationService.publish("Impossible de publier, vous n'êtes pas connecté.")
    }
  }
}
