import {Commentaire} from "src/models/commentaire.model";
import {Image} from "./image.model";

export class Message {
  _id: number;
  date: string;
  hour: string;
  body: string;
  createdBy: number;
  images: Image;
  likes: number;
  hashtags: string[];
  comments: Commentaire[];
  shared: number;

  constructor() {
    this._id = -1;
    this.date = '';
    this.hour = '';
    this.body = 'Aucun message.';
    this.createdBy = -1;
    this.images = new Image();
    this.likes = 0;
    this.hashtags = [];
    this.comments = [];
    this.shared = 0;
  }
}
