
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';




@IonicPage()
@Component({
  selector: 'page-qr',
  templateUrl: 'qr.html',
})
export class QrPage {

  qrBoletos: any[] = [];
  usuarioNombre: string = 'Bolivar Rodriguez Vargas'; // 🔽 Puedes personalizar esto dinámicamente

  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.qrBoletos = this.navParams.get('qrDataArray') || [];
    this.qrBoletos = this.qrBoletos.map(boleto => ({
      ...boleto,
      claseHeader: this.getHeaderClass(boleto.platea)
    }));
  }

  getHeaderClass(platea: string): string {
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
    this.navCtrl.pop();
  }
  

}


