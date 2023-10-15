export class Commentaire {
  text: string;
  commentedBy: number;
  date: string;
  hour: string;

  constructor() {
    this.text = "Aucun message";
    this.commentedBy = -1;
    this.date = "";
    this.hour = "";
  }
}
