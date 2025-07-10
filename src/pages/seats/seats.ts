import { Component, ElementRef, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Platform } from 'ionic-angular';
// import { map } from 'rxjs/operator/map';

// import * as Seatchart from 'seatchart'; // <-- Importa la librería
declare var require: any; // 👈 ayuda a TypeScript a compilar el require
const Seatchart = require('seatchart');     // 👈 require directo
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
  { active: [9, 25, 9], disabled: [4, 4], shiftLeft: 10 },       //K
  { active: [9, 24, 9], disabled: [4, 4], shiftLeft: 11 },       //J
  { active: [9, 23, 9], disabled: [4, 4], shiftLeft: 12 },       //H
  { active: [10, 22, 10], disabled: [4, 4], shiftLeft: 11 },     //G
  { active: [10, 21, 10], disabled: [4, 4], shiftLeft: 12 },     //F
  { active: [10, 20, 10], disabled: [4, 4], shiftLeft: 13 },     //E
  { active: [10, 19, 10], disabled: [4, 4], shiftLeft: 14 },     //D
  { active: [10, 18, 10], disabled: [4, 4], shiftLeft: 15 },     //C
  { active: [5, 17, 5], disabled: [4, 4], shiftLeft: 26 },     //B
  { active: [5, 16, 5], disabled: [4, 4], shiftLeft: 27 },     //A
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
  dineroDisponible = 30;

  constructor(public navCtrl: NavController, public navParams: NavParams, private platform: Platform) {
  }

  generateDisabledSeatsFromLayout() {
    const disabled = [];

    layout.forEach((rowLayout, rowIndex) => {
      let col = 0;

      // Desactivamos los asientos iniciales definidos por shiftLeft
      for (let i = 0; i < rowLayout.shiftLeft - 1; i++) {
        disabled.push({ row: rowIndex, col: col++ });
      }

      if (rowLayout.active[0] == 0) disabled.push({ row: rowIndex, col: rowLayout.shiftLeft - 1 });
      if (rowLayout.active[2] == 0) disabled.push({ row: rowIndex, col: rowLayout.shiftLeft + rowLayout.active[1] + 8 + -1 });

      // Alternamos bloques de activos y deshabilitados
      rowLayout.active.forEach((activeSeats, i) => {
        col += activeSeats + 1;

        const gap = rowLayout.disabled[i] || 0;
        for (let j = 0; j < gap - 1; j++) {
          disabled.push({ row: rowIndex, col: col++ });
        }
      });

      // Desactivar lo que sobre al final
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
      const labelNumber = 2 * (leftBlock - offset); // pares descendentes
      return `${rowLetter}${labelNumber}`;
    } else if (col >= centerStart && col <= centerEnd) {
      const offset = col - centerStart;
      return `${rowLetter}${101 + offset}`; // centro, desde 101
    } else if (col >= rightStart && col <= rightEnd) {
      const offset = col - rightStart;
      const labelNumber = 2 * offset + 1; // impares ascendentes
      return `${rowLetter}${labelNumber}`;
    } else {
      return rowLetter
    }

    // return '';
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

      // Primeros `count` asientos del lado izquierdo
      for (let i = 0; i < Math.min(count, leftCount); i++) {
        const col = shift + i;
        seats.push({ row, col });
      }

      // Últimos `count` asientos del lado derecho
      for (let i = 0; i < Math.min(count, rightCount); i++) {
        const col = shift + leftCount + 8 + centerCount + (rightCount - count) + i;   //+8 por los 2 pasillos
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

  options = {
    /**
     * Map options.
     */
    map: {
      rows,
      columns,
      seatTypes: {
        default: {
          label: 'Platea B',
          price: 30,
          cssClass: 'plateaB'
        },
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
          // seatRows: [0, 1, 2, 3, 4, 5],
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
      // selectedSeats: [
      //   { row: 0, col: 44 }, 
      //   { row: 3, col: 34 } //W= row:0, A= row:22
      // ],   //EXAMPLE
      reservedSeats: [
        { row: 12, col: 30 },
        { row: 5, col: 10 },
      ],   // EXAMPLE
      disabledSeats: this.generateDisabledSeatsFromLayout(),
      // columnSpacers: [0],
      // rowSpacers: [0],   // Posicion donde se pondrá un espacio entre filas. Index 4 forma un espacio entre la columna 4 y 5.
      seatLabel: (index) => {
        return this.seatLabelSeatsFromLayout(index);
      },
      indexerColumns: {
        visible: false,  //True por default, indices del 1 al 50 en este caso (this.columns)
      },
      indexerRows: {
        visible: false,
        label: (column: number) => {
          return `${seatLetters[seatLetters.length - column - 1]}`
        },  //True por default, indices del 1 al 50 en este caso (this.columns)
      },
      frontVisible: false, //True por default
    },

    /**
     * Cart options.
     */
    cart: {
      // visible: false,        // True por default
      currency: '$',
      submitLabel: 'Reservar',  // Checkout por default
    },
    legendVisible: false,    // True por default
  };

  // Función auxiliar para detectar platea por posición
  getPlateaForSeat = (row: number, col: number): string => {
    // Platea A: bloque central de filas medias
    const plateaA = this.generateCentralBlockSeats([14, 15, 16, 17, 18, 19]);

    // Platea C:
    const plateaC = [
      ...this.generateSideSeats([0, 1, 2, 3, 4, 5, 6], 8),       // laterales superiores
      ...this.generateSideSeats([14], 5),                       // laterales en fila 14
      ...this.generateSideSeats([15, 16, 17, 18, 19], 6),       // laterales en filas 15–19
      ...this.generateCentralBlockSeats([0, 1, 2, 3, 4, 5, 6])  //  centro en filas altas W–R
    ];

    const inA = plateaA.some(s => s.row === row && s.col === col);
    if (inA) return 'Platea A';

    const inC = plateaC.some(s => s.row === row && s.col === col);
    if (inC) return 'Platea C';

    return 'Platea B'; // por defecto
  };

  goToQr() {
    this.navCtrl.push('QrPage');
  }

  private insertStage(container: HTMLElement) {
    const mapContainer = container.querySelector('.sc-map').querySelector('.sc-map-inner-container');
    if (!mapContainer) return;

    const stageDiv = document.createElement('div');
    stageDiv.className = 'stage';
    stageDiv.textContent = 'Escenario';
    mapContainer.appendChild(stageDiv);
  }

  private relocateCart(container: HTMLElement, sc: any) {
    // Esperamos a que se renderice todo antes de mover el carrito
    // setTimeout(() => {
    //   const cartContainer = document.getElementById('floatingCart');
    //   if (!cartContainer) return;

    //   const originalHeader = container.querySelector('.sc-cart-header');
    //   const originalFooter = container.querySelector('.sc-cart-footer');
    //   const originalContainer = container.querySelector('.sc-right-container');

    //   // Reubica el carrito flotante tras el render
    //   if (originalHeader && originalFooter) {
    //     const existingHeader = cartContainer.querySelector('.sc-cart-header');
    //     const existingFooter = cartContainer.querySelector('.sc-cart-footer');
    //     if (existingHeader) existingHeader.remove();
    //     if (existingFooter) existingFooter.remove();
    //     cartContainer.appendChild(originalHeader);
    //     cartContainer.appendChild(originalFooter);
    //   }

    //   if (originalContainer) originalContainer.remove();

    //   // Añade contador personalizado
    //   const existing = cartContainer.querySelector('.cart-count');
    //   if (existing) existing.remove();

    //   //Scroll al centro inferior
    //   const scrollX = (container.scrollWidth - container.clientWidth) / 2;
    //   const scrollY = container.scrollHeight;

    //   container.scrollTo({ left: scrollX, top: scrollY, behavior: 'smooth' }); //'auto'

    //   // const countP = document.createElement('p');
    //   // countP.classList.add('cart-count');
    //   // countP.textContent = `Tickets: ${sc.getCart().length}`;
    //   // originalHeader.appendChild(countP);
    // }, 100);
    requestAnimationFrame(() => {
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
    });
  }

  private setupCartListener(sc: any) {
    sc.addEventListener('cartchange', () => {
      const total = sc.getCartTotal();
      const count = sc.getCart().length;

      console.log('Nuevo total:', total);
      console.log('Asientos seleccionados:', count);

      const countP = document.querySelector('.cart-count');
      if (countP) countP.textContent = `Tickets: ${count}`;
    });
  }

  private setupSubmitHandler(sc: any) {
    sc.addEventListener('submit', async (e) => {
      const cart = sc.getCart();

      const qrDataPromises = cart.map(async (seat) => {
        const seatIndex = seat.index;
        const row = seatIndex.row;
        const col = seatIndex.col;
        const label = sc.store.options.map.seatLabel(seatIndex);
        const platea = this.getPlateaForSeat(row, col);
        const qrText = `🎭 Platea: ${platea}\n🪑 Asiento: ${label}`;
        const qrImage = await QRCode.toDataURL(qrText);
        return { label, platea, qrText, qrImage };
      });

      // Navega a la página QR con todos los datos
      const qrDataArray = await Promise.all(qrDataPromises);
      this.navCtrl.push('QrPage', { qrDataArray });

      alert('Total: ' + e.total + '$');
    });
  }

  private initSeatChart(container: HTMLElement) {
    this.sc = new Seatchart(container, this.options);

    // 1. Inserta el escenario (STAGE)
    this.insertStage(container);

    // 2. Reubica el carrito flotante
    //this.relocateCart(container, this.sc);

    // 3. Configura el evento de carrito
    this.setupCartListener(this.sc);

    // 4. Configura la lógica de submit
    this.setupSubmitHandler(this.sc);
  }

  allowedPlatea() {
    // Base de asientos deshabilitados según layout (pasillos, espacios)
    const baseDisabledSeats = this.generateDisabledSeatsFromLayout();
    // Definición de asientos por platea
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

    // Completar Platea B con asientos que no están en A ni en C ni están deshabilitados
    for (let row = 0; row < this.options.map.rows; row++) {
      for (let col = 0; col < this.options.map.columns; col++) {
        const index = { row, col };

        // Si está deshabilitado por layout, ignoramos
        let isDisabledByLayout = baseDisabledSeats.some(d => d.row === row && d.col === col);
        if (isDisabledByLayout) continue;

        // Si no está en A ni C, pertenece a B
        const inA = plateaSeats['Platea A'].some(s => s.row === row && s.col === col);
        const inC = plateaSeats['Platea C'].some(s => s.row === row && s.col === col);

        if (!inA && !inC) {
          plateaSeats['Platea B'].push(index);
        }
      }
    }

    // Asignar plateas permitidas según dinero disponible
    const allowedPlatea = [];
    if (this.dineroDisponible >= 20) allowedPlatea.push('Platea C');
    if (this.dineroDisponible >= 30) allowedPlatea.push('Platea B');
    if (this.dineroDisponible >= 40) allowedPlatea.push('Platea A');

    // Construir lista final de asientos deshabilitados (layout) y reservados (por presupuesto)
    const finalDisabledSeats = baseDisabledSeats.slice();  // layout deshabilitados
    const reservedSeats = [];

    for (const platea in plateaSeats) {
      if (allowedPlatea.indexOf(platea) === -1) {
        // Asientos bloqueados por falta de presupuesto van a reservedSeats para que se vean bloqueados, no desaparezcan
        reservedSeats.push(...plateaSeats[platea]);
      }
    }

    // Actualizar la configuración de opciones
    this.options.map.disabledSeats = finalDisabledSeats;
    this.options.map.reservedSeats = reservedSeats;
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
    // const container = this.seatContainer.nativeElement;
    // this.loading = false;
    //this.initSeatChart(container);
    //this.allowedPlatea();     // TODO: Revisar porque se ejecuta despues de haber hecho submit y porque deshabilita los indices

    this.platform.ready().then(() => {
      requestAnimationFrame(() => {
        const container = this.seatContainer.nativeElement;

        const seatChart = this.initSeatChart(container); // retorna el chart
        this.allowedPlatea();

        this.loading = false; //  ocultar skeleton

        // ahora que todo es visible, mueve el carrito
        this.relocateCart(container, seatChart);
      });
    });

  }
}