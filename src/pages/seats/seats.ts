import { Component, ElementRef, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Platform } from 'ionic-angular';
import { AlertController } from 'ionic-angular';
// import { map } from 'rxjs/operator/map';

declare var require: any;
const Seatchart = require('seatchart');
const QRCode = require('qrcode');

const seatLetters = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G',
  'H', 'J', 'K', 'L', 'M', 'N', 'O',
  'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'
]; // 22 filas

const rows = seatLetters.length; // 22
const columns = 64; // o 60, dependiendo del espacio que quieras

const layout = [
  { active: [0, 37, 0], disabled: [4, 4], shiftLeft: 17 },      //W
  { active: [8, 36, 8], disabled: [4, 4], shiftLeft: 1 },       //V
  { active: [8, 36, 8], disabled: [4, 4], shiftLeft: 1 },       //U
  { active: [8, 35, 8], disabled: [4, 4], shiftLeft: 2 },       //T
  { active: [8, 34, 8], disabled: [4, 4], shiftLeft: 3 },       //S
  { active: [8, 33, 8], disabled: [4, 4], shiftLeft: 4 },       //R
  { active: [8, 32, 8], disabled: [4, 4], shiftLeft: 5 },       //Q
  { active: [9, 31, 9], disabled: [4, 4], shiftLeft: 4 },       //P
  { active: [9, 30, 9], disabled: [4, 4], shiftLeft: 5 },       //O
  { active: [9, 29, 9], disabled: [4, 4], shiftLeft: 6 },       //N
  { active: [9, 28, 9], disabled: [4, 4], shiftLeft: 7 },       //M
  { active: [9, 26, 9], disabled: [4, 4], shiftLeft: 9 },       //L
  { active: [9, 25, 9], disabled: [4, 4], shiftLeft: 10 },      //K
  { active: [9, 24, 9], disabled: [4, 4], shiftLeft: 11 },      //J
  { active: [9, 23, 9], disabled: [4, 4], shiftLeft: 12 },      //H
  { active: [10, 22, 10], disabled: [4, 4], shiftLeft: 11 },    //G
  { active: [10, 21, 10], disabled: [4, 4], shiftLeft: 12 },    //F
  { active: [10, 20, 10], disabled: [4, 4], shiftLeft: 13 },    //E
  { active: [10, 19, 10], disabled: [4, 4], shiftLeft: 14 },    //D
  { active: [10, 18, 10], disabled: [4, 4], shiftLeft: 15 },    //C
  { active: [5, 17, 5], disabled: [4, 4], shiftLeft: 26 },      //B
  { active: [5, 16, 5], disabled: [4, 4], shiftLeft: 27 },      //A
];

@IonicPage()
@Component({
  selector: 'page-seats',
  templateUrl: 'seats.html',
})
export class SeatsPage {
  private sc: any;
  loading = true;

  @ViewChild('seatContainer') seatContainer: ElementRef;
  dineroDisponible = 60; // Cambia esto para probar otras plateas

  blockedSeats: { row: number, col: number, expires: number, sesionId: string }[] = [];
  soldSeats: { row: number, col: number }[] = [];
  blockTimes = 2 * 60 * 1000; // 2 minutos
  cart: { row: number, col: number }[] = [];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    private platform: Platform
  ) { }

  getSession() {
    let sendId = sessionStorage.getItem('sendId');
    if (!sendId) {
      sendId = Math.random().toString(36).substr(2, 9) + Date.now();
      sessionStorage.setItem('sendId', sendId);
    }
    return sendId;
  }

  generateDisabledSeatsFromLayout() {
    const disabled = [];
    layout.forEach((rowLayout, rowIndex) => {
      let col = 0;
      for (let i = 0; i < rowLayout.shiftLeft - 1; i++) {
        disabled.push({ row: rowIndex, col: col++ });
      }
      if (rowLayout.active[0] == 0) disabled.push({ row: rowIndex, col: rowLayout.shiftLeft - 1 });
      if (rowLayout.active[2] == 0) disabled.push({ row: rowIndex, col: rowLayout.shiftLeft + rowLayout.active[1] + 8 - 1 });
      rowLayout.active.forEach((activeSeats, i) => {
        col += activeSeats + 1;
        const gap = rowLayout.disabled[i] || 0;
        for (let j = 0; j < gap - 1; j++) {
          disabled.push({ row: rowIndex, col: col++ });
        }
      });
      while (col < columns) {
        disabled.push({ row: rowIndex, col: col++ });
      }
    });
    return disabled;
  }

  seatLabelSeatsFromLayout(index: any) {
    const rowLetter = seatLetters[seatLetters.length - 1 - index.row];
    const layoutRow = layout[index.row];
    if (!layoutRow) return '';
    const [leftBlock, centerBlock, rightBlock] = layoutRow.active;
    const [gap1, gap2] = layoutRow.disabled;
    const shift = layoutRow.shiftLeft;
    const col = index.col;
    const leftStart = shift;
    const leftEnd = leftStart + leftBlock - 1;
    const centerStart = leftEnd + 1 + gap1;
    const centerEnd = centerStart + centerBlock - 1;
    const rightStart = centerEnd + 1 + gap2;
    const rightEnd = rightStart + rightBlock - 1;
    if (col >= leftStart && col <= leftEnd) {
      const offset = col - leftStart;
      const labelNumber = 2 * (leftBlock - offset);
      return `${rowLetter}${labelNumber}`;
    } else if (col >= centerStart && col <= centerEnd) {
      const offset = col - centerStart;
      return `${rowLetter}${101 + offset}`;
    } else if (col >= rightStart && col <= rightEnd) {
      const offset = col - rightStart;
      const labelNumber = 2 * offset + 1;
      return `${rowLetter}${labelNumber}`;
    } else {
      return rowLetter
    }
  }

  generateCentralBlockSeats(seatRows) {
    const seats = [];
    seatRows.forEach(row => {
      const rowLayout = layout[row];
      const shift = rowLayout.shiftLeft;
      const left = rowLayout.active[0];
      const pasillo = rowLayout.disabled[0];
      const center = rowLayout.active[1];
      for (let i = 0; i < center; i++) {
        const col = shift + left + pasillo + i;
        seats.push({ row, col });
      }
    });
    return seats;
  }

  generateSideSeats(seatRows, count) {
    const seats = [];
    seatRows.forEach(row => {
      const rowLayout = layout[row];
      const shift = rowLayout.shiftLeft;
      const [leftCount, centerCount, rightCount] = rowLayout.active;
      for (let i = 0; i < Math.min(count, leftCount); i++) {
        const col = shift + i;
        seats.push({ row, col });
      }
      for (let i = 0; i < Math.min(count, rightCount); i++) {
        const col = shift + leftCount + 8 + centerCount + (rightCount - count) + i;
        seats.push({ row, col });
      }
    });
    return seats;
  }

  generateIndexSeats() {
    const indexSeats = [];
    layout.forEach((rowLayout, rowIndex) => {
      const shift = rowLayout.shiftLeft;
      const [leftCount, centerCount, rightCount] = rowLayout.active;
      const colIndex = shift - 1;
      indexSeats.push({ row: rowIndex, col: colIndex });
      const colIndex2 = shift + leftCount + 4 - 1;
      indexSeats.push({ row: rowIndex, col: colIndex2 });
      const colIndex3 = shift + leftCount + 4 + centerCount + 4 - 1;
      indexSeats.push({ row: rowIndex, col: colIndex3 });
    });
    return indexSeats;
  }

  // Plateas según el color (para la lógica de saldo)
  getPlateaDeAsiento(row: number, col: number) {
    const centralA = this.generateCentralBlockSeats([14, 15, 16, 17, 18, 19]);
    const plateaC = [
      ...this.generateCentralBlockSeats([0, 1, 2, 3, 4, 5]),
      ...this.generateSideSeats([0, 1, 2, 3, 4, 5, 6], 8),
      ...this.generateSideSeats([14], 5),
      ...this.generateSideSeats([15, 16, 17, 18, 19], 6),
    ];
    if (centralA.some(s => s.row === row && s.col === col)) return 'A';
    if (plateaC.some(s => s.row === row && s.col === col)) return 'C';
    return 'B';
  }

  options = {
    map: {
      rows,
      columns,
      seatTypes: {
        default: { label: 'Platea B', price: 30, cssClass: 'plateaB' },
        plateaA: {
          label: 'Platea A',
          price: 40,
          cssClass: 'plateaA',
          seats: this.generateCentralBlockSeats([14, 15, 16, 17, 18, 19]),
        },
        plateaC: {
          label: 'Platea C',
          price: 20,
          cssClass: 'plateaC',
          seats: [
            ...this.generateCentralBlockSeats([0, 1, 2, 3, 4, 5]),
            ...this.generateSideSeats([0, 1, 2, 3, 4, 5, 6], 8),
            ...this.generateSideSeats([14], 5),
            ...this.generateSideSeats([15, 16, 17, 18, 19], 6),
          ]
        },
        index: {
          label: 'Index',
          price: 0,
          cssClass: 'index',
          seats: this.generateIndexSeats(),
        }
      },
      reservedSeats: [],
      disabledSeats: [],
      seatLabel: (index) => {
        return this.seatLabelSeatsFromLayout(index);
      },
      indexerColumns: { visible: false },
      indexerRows: { visible: false },
      frontVisible: false,
    },
    cart: { currency: '$', submitLabel: 'Reservar' },
    legendVisible: false,
  };

  saveSeatsToStorage() {
    localStorage.setItem('blockedSeats', JSON.stringify(this.blockedSeats));
    localStorage.setItem('soldSeats', JSON.stringify(this.soldSeats));
  }
  loadSeatsFromStorage() {
    this.blockedSeats = JSON.parse(localStorage.getItem('blockedSeats') || '[]');
    this.soldSeats = JSON.parse(localStorage.getItem('soldSeats') || '[]');
    this.refreshMap();
  }
  clearExpiredBlocks() {
    const before = this.blockedSeats.length;
    this.blockedSeats = this.blockedSeats.filter(b => b.expires > Date.now());
    if (this.blockedSeats.length !== before) {
      this.saveSeatsToStorage();
      this.refreshMap();
    }
  }
  isblocked(row: number, col: number): boolean {
    const miSesion = this.getSession();
    return this.blockedSeats.some(
      b => row === b.row && col === b.col && b.expires > Date.now() && b.sesionId !== miSesion
    );
  }
  isSold(row: number, col: number): boolean {
    return this.soldSeats.some(
      s => row === s.row && s.col === col
    );
  }

  // Solo disables de layout + vendidos
  getDisabledSeats() {
    return [
      ...this.generateDisabledSeatsFromLayout(),
      ...this.soldSeats.map(s => ({ row: s.row, col: s.col }))
    ];
  }
  // Solo reserved seats: temporalmente bloqueados por otra sesión
  getReservedSeats() {
    const miSesion = this.getSession();
    return this.blockedSeats
      .filter(b => b.expires > Date.now() && b.sesionId !== miSesion)
      .map(b => ({ row: b.row, col: b.col }));
  }

  refreshMap() {
    if (!this.seatContainer) return;
    this.options.map.disabledSeats = this.getDisabledSeats();
    this.options.map.reservedSeats = this.getReservedSeats();
    this.initSeatChart(this.seatContainer.nativeElement);
  }

  onSeatChange(selectedSeats: { row: number, col: number }[]) {
    const miSesion = this.getSession();
    this.blockedSeats = this.blockedSeats.filter(blocked => {
      if (blocked.sesionId === miSesion) {
        return selectedSeats.some(sel => sel.row === blocked.row && sel.col === blocked.col && blocked.expires > Date.now());
      }
      return blocked.expires > Date.now();
    });
    selectedSeats.forEach(seat => {
      const platea = this.getPlateaDeAsiento(seat.row, seat.col);
      let precio = 30;
      if (platea === 'A') precio = 40;
      if (platea === 'C') precio = 20;
      if (
        (platea === 'A' && this.dineroDisponible < 40) ||
        (platea === 'B' && this.dineroDisponible < 30) ||
        (platea === 'C' && this.dineroDisponible < 20)
      ) {
        // No permitir selección por presupuesto (puedes mostrar alerta)
        return;
      }
      const alreadyBlocked = this.blockedSeats.some(
        b => b.row === seat.row && b.col === seat.col && b.expires > Date.now()
      );
      const alreadySold = this.soldSeats.some(
        s => s.row === seat.row && s.col === seat.col
      );
      if (!alreadyBlocked && !alreadySold) {
        this.blockedSeats.push({
          row: seat.row,
          col: seat.col,
          expires: Date.now() + this.blockTimes,
          sesionId: miSesion
        });
      }
    });
    this.cart = selectedSeats.map(seat => ({ row: seat.row, col: seat.col }));
    this.saveSeatsToStorage();
  }

  private insertStage(container: HTMLElement) {
    const outer = container.querySelector('.sc-map');
    if (!outer) return;
    const mapContainer = outer.querySelector('.sc-map-inner-container');
    if (!mapContainer) return;
    const stageDiv = document.createElement('div');
    stageDiv.className = 'stage';
    stageDiv.textContent = 'Escenario';
    mapContainer.appendChild(stageDiv);
  }

  private relocateCart(container: HTMLElement, sc: any) {
    setTimeout(() => {
      const cartContainer = document.getElementById('floatingCart');
      if (!cartContainer) return;
      const originalHeader = container.querySelector('.sc-cart-header');
      const originalFooter = container.querySelector('.sc-cart-footer');
      const originalContainer = container.querySelector('.sc-right-container');
      if (originalHeader && originalFooter) {
        const existingHeader = cartContainer.querySelector('.sc-cart-header');
        const existingFooter = cartContainer.querySelector('.sc-cart-footer');
        if (existingHeader) existingHeader.remove();
        if (existingFooter) existingFooter.remove();
        cartContainer.appendChild(originalHeader);
        cartContainer.appendChild(originalFooter);

        let countP = cartContainer.querySelector('.cart-count');
        if (!countP) {
          countP = document.createElement('p');
          countP.classList.add('cart-count');
          countP.textContent = `${sc.getCart().length} tickets`;
          if (originalHeader) {
            originalHeader.insertBefore(countP, originalHeader.firstChild);
          }
        }
      }
      if (originalContainer) originalContainer.remove();
      const scrollX = (container.scrollWidth - container.clientWidth) / 2;
      const scrollY = container.scrollHeight;
      container.scrollTo({ left: scrollX, top: scrollY, behavior: 'smooth' });
    }, 200);
  }

  private setupCartListener(sc: any) {
    sc.addEventListener('cartchange', () => {
      const count = sc.getCart().length;
      const cart = sc.getCart();
      const labels = cart.map(seat => seat.label).join(', ');

      let mensajeSaldo = '';
      cart.forEach((item: any) => {
        const row = item.index.row;
        const col = item.index.col;
        const platea = this.getPlateaDeAsiento(row, col);
        if (
          (platea === 'A' && this.dineroDisponible < 40) ||
          (platea === 'B' && this.dineroDisponible < 30) ||
          (platea === 'C' && this.dineroDisponible < 20)
        ) {
          mensajeSaldo = `No tienes saldo suficiente para Platea ${platea}.`;
        }
      });
      if (mensajeSaldo) {
        alert(mensajeSaldo);
        sc.clearCart();
        this.cart = [];
        return;
      }
      this.cart = cart.map((item: any) => ({
        row: item.index.row,
        col: item.index.col
      }));
      this.onSeatChange(this.cart);
      const countP = document.querySelector('.cart-count');
      if (countP) countP.textContent = `${count} tickets: \n ${labels}`;
    });
  }

  private setupSubmitHandler(sc: any) {
    sc.addEventListener('submit', async (e) => {
      const cart = sc.getCart();
      if (!cart || cart.length === 0) {
        alert('No hay asientos seleccionados.');
        return;
      }
      const qrDataPromises = cart.map(async (seat) => {
        const seatIndex = seat.index;
        const row = seatIndex.row;
        const col = seatIndex.col;
        const label = sc.store.options.map.seatLabel(seatIndex);
        const platea = this.getPlateaDeAsiento(row, col);
        const qrText = `🎭 Platea: ${platea}\n🪑 Asiento: ${label}`;
        const qrImage = await QRCode.toDataURL(qrText);
        return { label, platea, qrText, qrImage };
      });
      const qrDataArray = await Promise.all(qrDataPromises);
      this.reserveConfirm(qrDataArray);
      
    });
  }

  private initSeatChart(container: HTMLElement) {
    this.sc = new Seatchart(container, this.options);
    this.insertStage(container);
    this.relocateCart(container, this.sc);
    this.setupCartListener(this.sc);
    this.setupSubmitHandler(this.sc);
  }

  allowedPlatea() {
    const baseDisabledSeats = this.generateDisabledSeatsFromLayout();
    const plateaSeats = {
      'Platea A': this.generateCentralBlockSeats([14, 15, 16, 17, 18, 19]),
      'Platea C': [
        ...this.generateSideSeats([0, 1, 2, 3, 4, 5, 6], 8),
        ...this.generateSideSeats([14], 5),
        ...this.generateSideSeats([15, 16, 17, 18, 19], 6),
        ...this.generateCentralBlockSeats([0, 1, 2, 3, 4, 5])
      ],
      'Platea B': []
    };
    for (let row = 0; row < this.options.map.rows; row++) {
      for (let col = 0; col < this.options.map.columns; col++) {
        const index = { row, col };
        let isDisabledByLayout = baseDisabledSeats.some(d => d.row === row && d.col === col);
        if (isDisabledByLayout) continue;
        const inA = plateaSeats['Platea A'].some(s => s.row === row && s.col === col);
        const inC = plateaSeats['Platea C'].some(s => s.row === row && s.col === col);
        if (!inA && !inC) {
          plateaSeats['Platea B'].push(index);
        }
      }
    }
    const allowedPlatea = [];
    if (this.dineroDisponible >= 20) allowedPlatea.push('Platea C');
    if (this.dineroDisponible >= 30) allowedPlatea.push('Platea B');
    if (this.dineroDisponible >= 40) allowedPlatea.push('Platea A');
    const finalDisabledSeats = baseDisabledSeats.slice();
    const reservedSeats = [];
    for (const platea in plateaSeats) {
      if (allowedPlatea.indexOf(platea) === -1) {
        reservedSeats.push(...plateaSeats[platea]);
      }
    }
    this.options.map.disabledSeats = finalDisabledSeats;
    this.options.map.reservedSeats = reservedSeats;
  }

  reserveConfirm(qrDataArray) {
    const alert = this.alertCtrl.create({
      title: 'Confirmar reserva',
      message: '¿Deseas reservar estos asientos?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            // Cancel
          }
        },
        {
          text: 'Enviar',
          handler: () => {
            this.navCtrl.push('QrPage', { qrDataArray });
          }
        }
      ]
    });
    alert.present();
  }

  ionViewDidLoad() {
    this.loadSeatsFromStorage();
    setInterval(() => this.clearExpiredBlocks(), 1000);
    window.addEventListener('storage', () => {
      this.loadSeatsFromStorage();
    });
  }

  zoomLevel = 1;

  zoomIn() {
    this.zoomLevel = Math.min(this.zoomLevel + 0.1, 1.0);
    this.applyZoom();
  }

  zoomOut() {
    this.zoomLevel = Math.max(this.zoomLevel - 0.1, 0.3);
    this.applyZoom();
  }

  applyZoom() {
    const mapInner = document.querySelector('.sc-map-inner-container') as HTMLElement;
    if (mapInner) {
      mapInner.style.transform = `scale(${this.zoomLevel})`;
      mapInner.style.transformOrigin = 'center center';
    }
  }

  ionViewDidEnter() {
    this.platform.ready().then(() => {
      requestAnimationFrame(() => {
        const container = this.seatContainer.nativeElement;
         const seatChart = this.initSeatChart(container); // retorna el chart
        this.allowedPlatea();

        this.loading = false; //  ocultar skeleton

        // ahora que todo es visible, mueve el carrito
        this.relocateCart(container, seatChart);

        this.initSeatChart(container);
        this.allowedPlatea();
        this.refreshMap();
      });
    });
  }
}
