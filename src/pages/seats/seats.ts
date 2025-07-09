import { Component, ElementRef, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
declare var require: any;
const Seatchart = require('seatchart');
const QRCode = require('qrcode');

// --- Configuración de filas, columnas y layout de asientos ---
const seatLetters = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G',
  'H', 'J', 'K', 'L', 'M', 'N', 'O', 
  'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'
];
const rows = seatLetters.length;
const columns = 62;
const layout = [
  { active: [0, 37, 0], disabled: [4, 4], shiftLeft: 16 },
  { active: [8, 36, 8], disabled: [4, 4], shiftLeft: 1 },
  { active: [8, 36, 8], disabled: [4, 4], shiftLeft: 1 },
  { active: [8, 35, 8], disabled: [4, 4], shiftLeft: 2 },
  { active: [8, 34, 8], disabled: [4, 4], shiftLeft: 3 },
  { active: [8, 33, 8], disabled: [4, 4], shiftLeft: 4 },
  { active: [8, 32, 8], disabled: [4, 4], shiftLeft: 5 },
  { active: [9, 31, 9], disabled: [4, 4], shiftLeft: 4 },
  { active: [9, 30, 9], disabled: [4, 4], shiftLeft: 5 },
  { active: [9, 29, 9], disabled: [4, 4], shiftLeft: 6 },
  { active: [9, 28, 9], disabled: [4, 4], shiftLeft: 7 },
  { active: [9, 26, 9], disabled: [4, 4], shiftLeft: 9 },
  { active: [9, 25, 9], disabled: [4, 4], shiftLeft: 10 },
  { active: [9, 24, 9], disabled: [4, 4], shiftLeft: 11 },
  { active: [9, 23, 9], disabled: [4, 4], shiftLeft: 12 },
  { active: [10, 22, 10], disabled: [4, 4], shiftLeft: 11 },
  { active: [10, 21, 10], disabled: [4, 4], shiftLeft: 12 },
  { active: [10, 20, 10], disabled: [4, 4], shiftLeft: 13 },
  { active: [10, 19, 10], disabled: [4, 4], shiftLeft: 14 },
  { active: [10, 18, 10], disabled: [4, 4], shiftLeft: 15 },
  { active: [5, 17, 5], disabled: [4, 4], shiftLeft: 26 },
  { active: [5, 16, 5], disabled: [4, 4], shiftLeft: 27 },
];

@IonicPage()
@Component({
  selector: 'page-seats',
  templateUrl: 'seats.html',
})
export class SeatsPage {
  private sc: any;

  @ViewChild('seatContainer') seatContainer: ElementRef;

  blockedSeats: { row: number, col: number, expires: number }[] = [];
  soldSeats: { row: number, col: number }[] = [];
  blockTimes = 1 * 60 * 1000; // 2 minutos
  cart: { row: number, col: number }[] = [];

  constructor(public navCtrl: NavController, public navParams: NavParams) {}

  // --- Métodos para el layout y etiquetas ---
  generateDisabledSeatsFromLayout() {
    const disabled = [];
    layout.forEach((rowLayout, rowIndex) => {
      let col = 0;
      for (let i = 0; i < rowLayout.shiftLeft; i++) {
        disabled.push({ row: rowIndex, col: col++ });
      }
      rowLayout.active.forEach((activeSeats, i) => {
        col += activeSeats;
        const gap = rowLayout.disabled[i] || 0;
        for (let j = 0; j < gap; j++) {
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
    }
    return '';
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

  // --- Opciones de Seatchart ---
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
          seatRows: [0, 1, 2, 3, 4, 5],
          seats: [
            ...this.generateSideSeats([6], 8),
            ...this.generateSideSeats([14], 5),
            ...this.generateSideSeats([15, 16, 17, 18, 19], 6),
          ]
        }
      },
      reservedSeats: [],
      disabledSeats: [],
      seatLabel: (index) => {
        return this.seatLabelSeatsFromLayout(index);
      },
      indexerColumns: { visible: false },
      indexerRows: {
        label: (column: number) => {
          return `${seatLetters[seatLetters.length - column - 1]}`
        },
      },
      frontVisible: false,
    },
    cart: {
      currency: '$',
      submitLabel: 'Reservar',
    },
    legendVisible: false,
  };

  // --- Métodos de integración localStorage ---
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
    return this.blockedSeats.some(
      b => row === b.row && col === b.col && b.expires > Date.now()
    );
  }
  isSold(row: number, col: number): boolean {
    return this.soldSeats.some(
      s => row === s.row && s.col === col
    );
  }

  getDisabledSeats() {
    const blocks = this.blockedSeats.filter(b => b.expires > Date.now());
    return [
      ...this.generateDisabledSeatsFromLayout(),
      ...blocks.map(b => ({ row: b.row, col: b.col })),
      ...this.soldSeats.map(s => ({ row: s.row, col: s.col }))
    ];
  }

  refreshMap() {
    if (!this.seatContainer) return;
    this.options.map.disabledSeats = this.getDisabledSeats();
    this.initSeatChart(this.seatContainer.nativeElement);
  }

  // --- ESTE ES EL MÉTODO CLAVE DE SINCRONIZACIÓN ---
  onSeatChange(selectedSeats: { row: number, col: number }[]) {
    // Mantén solo bloqueos de asientos actualmente seleccionados y vigentes
    this.blockedSeats = this.blockedSeats.filter(blocked =>
      selectedSeats.some(sel => sel.row === blocked.row && sel.col === blocked.col && blocked.expires > Date.now())
    );
    // Agrega bloqueos para asientos seleccionados no bloqueados ni vendidos
    selectedSeats.forEach(seat => {
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
          expires: Date.now() + this.blockTimes
        });
      }
    });
    this.cart = selectedSeats.map(seat => ({ row: seat.row, col: seat.col }));
    this.saveSeatsToStorage();
    // NO recargues el mapa aquí para no perder selección.
  }

  onPay() {
    const blockedSeatsActual = JSON.parse(localStorage.getItem('blockedSeats') || '[]')
      .filter(b => b.expires > Date.now());
    const soldSeatsActual = JSON.parse(localStorage.getItem('soldSeats') || '[]');
    let errorAsientos = [];
    this.cart.forEach(seat => {
      const sold = soldSeatsActual.some(
        s => s.row === seat.row && s.col === seat.col
      );
      const blocked = blockedSeatsActual.some(
        b => b.row === seat.row && b.col === seat.col
      );
      if (sold) errorAsientos.push(`Asiento ${seat.row}-${seat.col}: YA VENDIDO`);
      else if (blocked) errorAsientos.push(`Asiento ${seat.row}-${seat.col}: YA BLOQUEADO`);
    });

    if (errorAsientos.length > 0) {
      alert('Algunos asientos ya no están disponibles:\n' + errorAsientos.join('\n'));
      // Limpia carrito de asientos no disponibles
      this.cart = this.cart.filter(seat => {
        const sold = soldSeatsActual.some(s => s.row === seat.row && s.col === seat.col);
        const blocked = blockedSeatsActual.some(b => b.row === seat.row && b.col === seat.col);
        return !sold && !blocked;
      });
      return;
    }

    // Si todos disponibles, registra la venta
    this.cart.forEach(seat => {
      this.blockedSeats = this.blockedSeats.filter(
        b => !(b.row === seat.row && b.col === seat.col)
      );
      this.soldSeats.push({ row: seat.row, col: seat.col });
    });
    this.cart = [];
    this.saveSeatsToStorage();
    this.refreshMap();
    alert('¡Pago realizado! Los asientos han sido vendidos.');
  }

  // --- Métodos de integración Seatchart (escenario, carrito, QR) ---
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
      }
      if (originalContainer) originalContainer.remove();
      const existing = cartContainer.querySelector('.cart-count');
      if (existing) existing.remove();
      const scrollX = (container.scrollWidth - container.clientWidth) / 2;
      const scrollY = container.scrollHeight;
      container.scrollTo({ left: scrollX, top: scrollY, behavior: 'smooth' });
    }, 100);
  }

  private setupCartListener(sc: any) {
    sc.addEventListener('cartchange', () => {
      // ¡Esta es la SELECCIÓN real del usuario!
      const cart = sc.getCart();
      this.cart = cart.map((item: any) => ({
        row: item.index.row,
        col: item.index.col
      }));
      this.onSeatChange(this.cart);
      const countP = document.querySelector('.cart-count');
      if (countP) countP.textContent = `Tickets: ${this.cart.length}`;
    });
    setTimeout(() => {
      const seats = document.querySelectorAll('.sc-seat');
      seats.forEach((seatEl: HTMLElement) => {
        seatEl.addEventListener('click',(e:any) => {
          const dataIndex = seatEl.getAttribute('data-index');
          if(dataIndex && seatEl.classList.contains('sc-seat-disabled')) {
            const [row,col]= dataIndex.split(',').map(Number);
            if (this.isblocked(row, col)) {
              e.stopPropagation();
              alert(`Asiento ${row}-${col} está bloqueado.`);
            }
          }
        })

      })
    
    },700)
  }

  private setupSubmitHandler(sc: any) {
    sc.addEventListener('submit', async (e) => {
      const cart = sc.getCart();
      if(!cart || cart.length === 0) {
        alert('No hay asientos seleccionados.');
        return
      }
      const qrDataPromises = cart.map(async (seat) => {
        const seatIndex = seat.index;
        const row = seatIndex.row;
        const col = seatIndex.col;
        const label = sc.store.options.map.seatLabel(seatIndex);
        const platea = "X";
        const qrText = `🎭 Platea: ${platea}\n🪑 Asiento: ${label}`;
        const qrImage = await QRCode.toDataURL(qrText);
        return { label, platea, qrText, qrImage };
      });
      const qrDataArray = await Promise.all(qrDataPromises);
      this.navCtrl.push('QrPage', { qrDataArray });
      alert('Total: ' + e.total + '$');
    });
  }

  private initSeatChart(container: HTMLElement) {
    this.sc = new Seatchart(container, this.options);
    this.insertStage(container);
    this.relocateCart(container, this.sc);
    this.setupCartListener(this.sc);
    this.setupSubmitHandler(this.sc);
  }

  // --- Inicialización y sincronización entre pestañas ---
  ionViewDidLoad() {
    this.loadSeatsFromStorage(); // Al abrir la página
    setInterval(() => this.clearExpiredBlocks(), 1000);
    window.addEventListener('storage', () => {
      this.loadSeatsFromStorage();
    });
  }

  ionViewDidEnter() {
    const container = this.seatContainer.nativeElement;
    this.initSeatChart(container);
  }
}
