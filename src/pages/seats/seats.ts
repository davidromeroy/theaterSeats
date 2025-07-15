import { Component, ElementRef, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Platform } from 'ionic-angular';
import { AlertController } from 'ionic-angular';


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
  
   userAmount = 50;

   initialUserAmount: number; // Valor original del usuario para cálculos internos

  // isReservado: boolean = false;// Nuevo

  blockedSeats: { row: number, col: number, expires: number, sesionId: string }[] = [];
  soldSeats: { row: number, col: number }[] = [];
  blockTimes = 1 * 60 * 1000; // 2 minutos
  cart: { row: number, col: number }[] = [];
  zoomLevel: number;

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

  // Funciones para general los asientos desde el Layout
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
        default: {
          label: 'Platea B',
          price: 30,
          cssClass: 'bloqueado'
        },
        plateaA: {
          label: 'Platea A',
          price: 40,
          cssClass: 'bloqueado',
          seats: this.generateCentralBlockSeats([14, 15, 16, 17, 18, 19]),
        },
        plateaC: {
          label: 'Platea C',
          price: 20,
          cssClass: 'bloqueado',
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

  // Elimina bloqueos de mi sesión que ya no están seleccionados
  this.blockedSeats = this.blockedSeats.filter(blocked => {
    if (blocked.sesionId === miSesion) {
      // Solo conserva los aún seleccionados
      return selectedSeats.some(sel => sel.row === blocked.row && sel.col === blocked.col && blocked.expires > Date.now());
    }
    return blocked.expires > Date.now();
  });

  // Añade nuevos bloqueos
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
        expires: Date.now() + this.blockTimes,
        sesionId: miSesion
      });
    }
  });

  // Actualiza tu carrito
  this.cart = selectedSeats.map(seat => ({ row: seat.row, col: seat.col }));

  // Solo actualiza el almacenamiento, NO reinicies el mapa aquí
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
  // Espera a que todo el DOM se haya renderizado por Seatchart
  requestAnimationFrame(() => {
    const cartContainer = document.getElementById('floatingCart');
    if (!cartContainer) return;

    const originalHeader = container.querySelector('.sc-cart-header');
    const originalFooter = container.querySelector('.sc-cart-footer');
    const originalContainer = container.querySelector('.sc-right-container');

    // Si no existe el header o el footer, no sigas (evita errores)
    if (!originalHeader || !originalFooter) return;

    // Remueve headers/footers anteriores del carrito flotante si existen
    const existingHeader = cartContainer.querySelector('.sc-cart-header');
    const existingFooter = cartContainer.querySelector('.sc-cart-footer');
    if (existingHeader) existingHeader.remove();
    if (existingFooter) existingFooter.remove();

    // Agrega el header y footer al contenedor flotante
    cartContainer.appendChild(originalHeader);
    cartContainer.appendChild(originalFooter);

    // Remueve cualquier contador anterior
    const existingCount = cartContainer.querySelector('.cart-count');
    if (existingCount) existingCount.remove();

    // Crea el contador de tickets
    const countP = document.createElement('p');
    countP.classList.add('cart-count');
    countP.textContent = `${sc.getCart().length} tickets`;

    // Intenta insertarlo al principio del header, si existe
    if (originalHeader.firstChild) {
      originalHeader.insertBefore(countP, originalHeader.firstChild);
    } else {
      originalHeader.appendChild(countP);
    }

    // Elimina el contenedor derecho original si existe
    if (originalContainer) originalContainer.remove();

    // Centra el scroll del mapa (opcional)
    const scrollX = (container.scrollWidth - container.clientWidth) / 2;
    const scrollY = container.scrollHeight;
    container.scrollTo({ left: scrollX, top: scrollY, behavior: 'auto' });

    // Opcional: aplica zoom si lo necesitas
    this.zoomLevel = this.zoomLevel || 0.5;
    this.applyZoom();
  });
}



  //Nuevos metodos: Metodo para calcular el precio del asiento
  private getSeatPrice(seat: any): number {
    const row = seat.index.row;
    const col = seat.index.col;
    const platea = this.getPlateaForSeat(row, col);

    if (platea === 'Platea A') return 40;
    if (platea === 'Platea B') return 30;
    if (platea === 'Platea C') return 20;
    return 0;
  }

    //Metodo Nuevo para asignar los colores a las plateas de acurdo a la cantidad de puntos disponibles
  private updateSeatColorsByUserAmount(amount: number): void {
    const plateas = this.options.map.seatTypes;
    plateas.plateaA.cssClass = amount >= 40 ? 'plateaA' : 'bloqueado';
    plateas.default.cssClass = amount >= 30 ? 'plateaB' : 'bloqueado';
    plateas.plateaC.cssClass = amount >= 20 ? 'plateaC' : 'bloqueado';
  }

  //Nuevo: Recalcular saldo disponible al modificar el carrito
  private actualizarEstadoUsuario(): void {
    const cart = this.sc.getCart(); // Asientos seleccionados
    const totalGastado = cart.reduce((sum, seat) => sum + this.getSeatPrice(seat), 0);
    const saldoRestante = Math.max(0, this.initialUserAmount - totalGastado);

    this.userAmount = saldoRestante;
    this.updateSeatColorsByUserAmount(saldoRestante); 
  }

  /*private setupCartListener(sc: any) {
  sc.addEventListener('cartchange', () => {
    
    const cart = sc.getCart();
    this.actualizarEstadoUsuario(); // Actualiza todo al cambiar selección

    // Valida saldo antes de guardar nada
    let mensajeSaldo = '';
    cart.forEach((item: any) => {
      const row = item.index.row;
      const col = item.index.col;
      const platea = this.getPlateaDeAsiento(row, col);
      if (
        (platea === 'A' && this.userAmount < 40) ||
        (platea === 'B' && this.userAmount < 30) ||
        (platea === 'C' && this.userAmount < 20)
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

    // Solo guarda los bloqueos y el cart en storage
    this.cart = cart.map((item: any) => ({
      row: item.index.row,
      col: item.index.col
    }));

    this.onSeatChange(this.cart); // Esto SÓLO actualiza storage y arrays, NO la UI

    // Muestra la cantidad seleccionada (esto es solo visual)
    const labels = cart.map(seat => seat.label).join(', ');
    const countP = document.querySelector('.cart-count');
    if (countP) countP.textContent = `${cart.length} tickets: \n ${labels}`;
  });
}*/

  private setupCartListener(sc: any) {
    sc.addEventListener('cartchange', () => {
      const cart = sc.getCart();

      // Actualiza estado (saldo restante y colores)
      this.actualizarEstadoUsuario();

      // Lógica unificada: acumulativa + validación por platea + mensaje claro
      let saldoTemp = this.initialUserAmount;
      let mensajeSaldo = '';
      let detallesInvalidos: string[] = [];

      for (const item of cart) {
        const row = item.index.row;
        const col = item.index.col;
        const platea = this.getPlateaDeAsiento(row, col);
        const precio = this.getSeatPrice({ index: { row, col } });

        if (saldoTemp >= precio) {
          saldoTemp -= precio; // Pasa, descuenta del saldo temporal
        } else {
          // No alcanza saldo, guarda mensaje con detalles
          detallesInvalidos.push(`Platea ${platea} ($${precio})`);
        }
      }

      // Si hay errores y hay más de un asiento seleccionado
      if (detallesInvalidos.length > 0 && cart.length > 1) {
        mensajeSaldo = `No tienes puntos suficiente para reservar más de un asiento`;
      }

      if (mensajeSaldo) {
        alert(mensajeSaldo);
        sc.clearCart();
        this.cart = [];
        return;
      }

      // Actualiza el carrito en memoria y en storage
      this.cart = cart.map((item: any) => ({
        row: item.index.row,
        col: item.index.col
      }));

      // Actualiza bloqueos
      this.onSeatChange(this.cart);

      // Actualiza contador visual
      const labels = cart.map(seat => seat.label).join(', ');
      const countP = document.querySelector('.cart-count');
      if (countP) countP.textContent = `${cart.length} tickets: \n ${labels}`;
    });

    
  }

  private setupSubmitHandler(sc: any) {
    sc.addEventListener('submit', async (e) => {
      const cart = sc.getCart();

      // Valida si el usuario tiene puntos suficientes
      const totalGastado = cart.reduce((sum, seat) => sum + this.getSeatPrice(seat), 0);
      if (totalGastado > this.initialUserAmount) {
        const alertaError = this.alertCtrl.create({
          title: 'Saldo insuficiente',
          message: 'No tienes puntos suficientes para completar la compra. Ajusta tu selección.',
          buttons: [{ text: 'Aceptar' }]
        });
        alertaError.present();
        return;
      }


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

  private initSeatChart(container: HTMLElement) {
    this.sc = new Seatchart(container, this.options);

    // 1. Inserta el escenario (STAGE)
    this.insertStage(container);

    // 2. Reubica el carrito flotante
    this.relocateCart(container, this.sc);

    // 3. Configura el evento de carrito
    this.setupCartListener(this.sc);

    // 4. Configura la lógica de submit
    this.setupSubmitHandler(this.sc);
    return this.sc;

  }
  
  zoomIn() {
    this.zoomLevel = Math.min(this.zoomLevel + 0.1, 1.0);
    console.log(this.zoomLevel)
    this.applyZoom();
  }

  zoomOut() {
    this.zoomLevel = Math.max(this.zoomLevel - 0.1, 0.3);
    console.log(this.zoomLevel)
    this.applyZoom();
  }

  applyZoom() {
    const mapInner = document.querySelector('.sc-map-inner-container') as HTMLElement;
    if (mapInner) {
      mapInner.style.transform = `scale(${this.zoomLevel})`;
      mapInner.style.transformOrigin = 'center bottom';
    }
  }

  ionViewDidEnter() {

    this.platform.ready().then(() => {
      // requestAnimationFrame(() => {

      // Asigna saldo inicial dinámicamente
        this.initialUserAmount = this.userAmount; //Nuevo

        this.updateSeatColorsByUserAmount(this.userAmount);// Nuevo: Usa el valor de la variable para aplicar colores
        
        const container = this.seatContainer.nativeElement;
        this.initSeatChart(container); // retorna el chart

        this.loading = false; //  ocultar skeleton
      // });
    });

  }

}
