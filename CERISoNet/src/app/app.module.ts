import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import {FormsModule} from "@angular/forms";
import {AuthentificationService} from "./authentification.service";
import {HttpClientModule} from "@angular/common/http";
import { NotificationComponent } from './notification/notification.component';
import { HeaderComponent } from './header/header.component';
import { MessageComponent } from './message/message.component';
import { MessageContainerComponent } from './message-container/message-container.component';
import { CommentaireContainerComponent } from './commentaire-container/commentaire-container.component';
import { CommentaireComponent } from './commentaire/commentaire.component';
import { CreationCommentaireComponent } from './creation-commentaire/creation-commentaire.component';
import { UsersConnectedComponent } from './users-connected/users-connected.component';
import { ShareMessageComponent } from './share-message/share-message.component';
import {NgOptimizedImage} from "@angular/common";

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    NotificationComponent,
    HeaderComponent,
    MessageComponent,
    MessageContainerComponent,
    CommentaireContainerComponent,
    CommentaireComponent,
    CreationCommentaireComponent,
    UsersConnectedComponent,
    ShareMessageComponent
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,
        HttpClientModule,
        NgOptimizedImage
    ],
  providers: [AuthentificationService],
  bootstrap: [AppComponent]
})
export class AppModule { }
