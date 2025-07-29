import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform, LoadingController } from 'ionic-angular';
import { File } from '@ionic-native/file';
import { FileOpener } from '@ionic-native/file-opener';
import * as jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@IonicPage()
@Component({
  selector: 'page-qr',
  templateUrl: 'qr.html',
})
export class QrPage {

  qrBoletos: any[] = [];
  usuarioNombre: string = 'Bolivar Rodriguez Vargas';

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private file: File,
    private fileOpener: FileOpener,
    private platform: Platform,
    private loadingCtrl: LoadingController // <--- aquí
  ) {
    this.qrBoletos = this.navParams.get('qrDataArray') || [];
    this.qrBoletos = this.qrBoletos.map(boleto => ({
      ...boleto,
      claseHeader: this.getHeaderClass(boleto.platea)
    }));
  }

  async descargarQr() {
    const loading = this.loadingCtrl.create({
      content: 'Generando PDF, por favor espera...',
      spinner: 'crescent'
    });
    loading.present();

    try {
      const doc = new jsPDF('p', 'pt', 'a4');
      const marginTop = 30;
      let y = marginTop;
      const images: string[] = [];

      const pdfWidth = 300;
      const pdfHeight = 400;
      const pageWidth = doc.internal.pageSize.getWidth();
      const x = (pageWidth - pdfWidth) / 2;

      if (this.qrBoletos.length > 1) {
        for (let i = 0; i < this.qrBoletos.length; i++) {
          const cardId = 'ticketCard' + i;
          const ticketCard = document.getElementById(cardId);
          if (!ticketCard) continue;
          const cardRect = ticketCard.getBoundingClientRect();
          const canvas = await html2canvas(ticketCard, {
            scale: 1,
            width: cardRect.width,
            height: cardRect.height,
            backgroundColor: "#fff"
          });
          images.push(canvas.toDataURL('image/png'));
        }
        images.forEach((imgData, idx) => {
          if (!imgData) return;
          if (idx > 0) {
            y += pdfHeight + 24;
            if (y + pdfHeight > 600) {
              doc.addPage();
              y = marginTop;
            }
          }
          doc.addImage(imgData, 'PNG', x, y, pdfWidth, pdfHeight);
        });
      } else {
        const ticketCard = document.getElementById('ticketCardSingle');
        if (ticketCard) {
          const cardRect = ticketCard.getBoundingClientRect();
          const canvas = await html2canvas(ticketCard, {
            scale: 2,
            width: cardRect.width,
            height: cardRect.height,
            backgroundColor: "#fff"
          });
          const imgData = canvas.toDataURL('image/png');
          doc.addImage(imgData, 'PNG', x, y, pdfWidth, pdfHeight);
        }
      }

      const fileName = this.qrBoletos.length > 1 ? 'mis_boletos_qr.pdf' : 'mi_boleto_qr.pdf';

      if (this.platform.is('cordova')) {
        try {
          const pdfOutput = doc.output('blob');
          const path = this.platform.is('android')
            ? (this.file as any).externalDataDirectory
            : (this.file as any).documentsDirectory;
          await (this.file as any).writeFile(path, fileName, pdfOutput, { replace: true });
           await (this.fileOpener as any).open(path + fileName, 'application/pdf');
        } catch (err) {
          alert('No se pudo guardar el PDF: ' + err);
        }
      } else {
        doc.save(fileName);
      }
    } catch (err) {
      alert('Error generando el PDF: ' + err);
    } finally {
      loading.dismiss();
    }
  }

  getHeaderClass(platea: string): string {
    switch (platea) {
      case 'A': return 'header-plateaA';
      case 'B': return 'header-plateaB';
      case 'C': return 'header-plateaC';
      default:  return 'header-default';
    }
  }

  goToHome() {
    this.navCtrl.pop();
  }
}
