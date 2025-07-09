import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { HomePage } from '../home/home';

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
  qrDataArray: any[] = [];
  qrBoletos: any[] = [];

  constructor(public navCtrl: NavController, public navParams: NavParams) {
      this.qrDataArray = this.navParams.get('qrDataArray') || [];
      if (this.qrBoletos.length == 0){
        this.qrBoletos = this.qrDataArray;
      } else {
        this.qrBoletos = [
          ...this.qrBoletos,
          this.qrDataArray
        ]
      }
  }

  goToHome() {
    this.navCtrl.pop;
  }
  // ionViewDidLoad() {
  //   console.log('ionViewDidLoad QrPage');
  // }

}
