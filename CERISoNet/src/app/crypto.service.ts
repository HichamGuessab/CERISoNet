import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {
  encryptionKey = 'secretKey';

  encrypt(text: String) {
    const encrypted = CryptoJS.AES.encrypt(text, this.encryptionKey).toString();
    const encryptedHex = encrypted.toString(CryptoJS.enc.Hex);
    return encryptedHex.replace(/\//g, 'SLASH_REPLACEMENT');
  }
}
