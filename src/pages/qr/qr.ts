
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';


/**
 * Generated class for the QrPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-qr',
  templateUrl: 'qr.html',
})
export class QrPage {
  // qrDataArray: any[] = [];
  qrBoletos: any[] = [];

  constructor(public navCtrl: NavController, public navParams: NavParams) {
      this.qrBoletos = this.navParams.get('qrDataArray') || [];
      this.qrBoletos = this.qrBoletos.map(boleto => ({
        ...boleto,
        claseHeader: this.getHeaderClass(boleto.platea)
      }));
  }

  getHeaderClass(platea) {
  switch (platea) {
    case 'A':
      return 'header-plateaA';
    case 'B':
      return 'header-plateaB';
    case 'C':
      return 'header-plateaC';
    default:
      return 'header-default';
  }
}

  goToHome() {
    this.navCtrl.pop;
  }

  
}

