import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

declare var jsPDF: any;
declare var html2canvas: any;


@IonicPage()
@Component({
  selector: 'page-qr',
  templateUrl: 'qr.html',
})
export class QrPage {

  qrBoletos: any[] = [];
  usuarioNombre: string = 'Bolivar Rodriguez Vargas'; // Puedes personalizar esto dinámicamente

  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.qrBoletos = this.navParams.get('qrDataArray') || [];
    this.qrBoletos = this.qrBoletos.map(boleto => ({
      ...boleto,
      claseHeader: this.getHeaderClass(boleto.platea)
    }));
  }

  descargarQr() {
  const doc = new jsPDF('p', 'pt', 'a4');
  const marginTop = 30;
  let y = marginTop;

  // Si hay varios boletos (múltiples tarjetas)
  if (this.qrBoletos.length > 1) {
    // Recorrer cada tarjeta
    const promises = this.qrBoletos.map((item, i) => {
      const cardId = 'ticketCard' + i;
      const ticketCard = document.getElementById(cardId);
      if (!ticketCard) return Promise.resolve(null);

      return html2canvas(ticketCard, { scale: 2 }).then((canvas: HTMLCanvasElement) => {
        const imgData = canvas.toDataURL('image/png');
        return imgData;
      });
    });

    Promise.all(promises).then(images => {
      images.forEach((imgData, idx) => {
        if (!imgData) return;

        const width = 380;
        const height = 420;
        if (idx > 0) {
          y += height + 24; // Espacio entre tarjetas
          if (y + height > 800) { // Salto de página
            doc.addPage();
            y = marginTop;
          }
        }
        doc.addImage(imgData, 'PNG', 110, y, width, height); // Ajusta posición y tamaño aquí si quieres
      });
      doc.save('mis_boletos_qr.pdf');
    });
  } else {
    // Solo un boleto
    const ticketCard = document.getElementById('ticketCardSingle');
    if (!ticketCard) return;
    html2canvas(ticketCard, { scale: 2 }).then((canvas: HTMLCanvasElement) => {
      const imgData = canvas.toDataURL('image/png');
      const width = 380;
      const height = 420;
      doc.addImage(imgData, 'PNG', 110, y, width, height);
      doc.save('mi_boleto_qr.pdf');
    });
  }
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
