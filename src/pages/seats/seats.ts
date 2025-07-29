import { Component, ElementRef, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Platform } from 'ionic-angular';
import { AlertController } from 'ionic-angular';
import { AsientosProvider } from '../../providers/asientos/asientos';



declare var require: any;
const Seatchart = require('seatchart');
const QRCode = require('qrcode');
const hammerjs = require('hammerjs')

const seatLetters = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G',
  'H', 'J', 'K', 'L', 'M', 'N', 'O',
  'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'
]; // 22 filas

const rows = seatLetters.length; // 22
const columns = 64; // o 60, dependiendo del espacio que quieras
const now = new Date();

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
  // Devuelve la fecha en formato YYYY-MM-DD HH:mm:ss para Guayaquil (GMT-5)
  private getGuayaquilDateString(date: Date): string {
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    // Offset de Guayaquil: -5 horas
    const guayaquilTime = new Date(utc - (5 * 60 * 60000));
    const yyyy = guayaquilTime.getFullYear();
    const mm = ('0' + (guayaquilTime.getMonth() + 1)).slice(-2);
    const dd = ('0' + guayaquilTime.getDate()).slice(-2);
    const hh = ('0' + guayaquilTime.getHours()).slice(-2);
    const min = ('0' + guayaquilTime.getMinutes()).slice(-2);
    const ss = ('0' + guayaquilTime.getSeconds()).slice(-2);
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  }
  private sc: any;
  loading = true;
  timer: any = null;
  timeLeft: number;
  timerActivo: boolean = false;
  @ViewChild('seatContainer') seatContainer: ElementRef;

   userAmount = 100;

  initialUserAmount: number; // Valor original del usuario para cálculos internos

  plateaActiva: string = 'A'; // Nueva variable para asientos disponibles

  blockedSeats: { row: number, col: number, expires: number, userId: number }[] = [];
  soldSeats: { row: number, col: number }[] = [];
  plateas: { [key: string]: { row: number, col: number }[] } = {};


  cart: { row: number, col: number }[] = [];
  zoomLevel: number;
  globalScale: number = 1;
  originalMapWidth: number;
  originalMapHeight: number;
  translateX = 0;
  translateY = 0;
  startX = 0;
  startY = 0;

  // nuevo
  panX: number;
  panY: number;

  private hammer: any;
  presionado: boolean = false;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    private platform: Platform,
    private asientosProvider: AsientosProvider
  ) { }

  toggleIcon(value: boolean) {
    //this.presionado = !this.presionado;
    this.presionado = value;
    this.initializeZoomToFit(value);
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

  generateSideSeats(seatRows, count, offset = 0, side = 'both') {
    const seats = [];

    seatRows.forEach(row => {
      const rowLayout = layout[row];
      const shift = rowLayout.shiftLeft;
      const [leftCount, centerCount, rightCount] = rowLayout.active;

      if (side === 'left' || side === 'both') {
        for (let i = offset; i < Math.min(offset + count, leftCount); i++) {
          const col = shift + i;
          seats.push({ row, col });
        }
      }

      if (side === 'right' || side === 'both') {
        for (let i = offset; i < Math.min(offset + count, rightCount); i++) {
          // El cálculo de columna para el lado derecho ajustado
          const col = shift + leftCount + 8 + centerCount + i;
          seats.push({ row, col });
        }
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

  getPlateas(platea) {
    // Platea A: bloque central de filas medias
    const plateaA = this.generateCentralBlockSeats([14, 15, 16, 17, 18, 19]);

    //Platea B:
    const plateaB = [
      ...this.generateCentralBlockSeats([6, 7, 8, 9, 10, 11, 12, 13, 20, 21]),
      ...this.generateSideSeats([7, 8, 9, 10, 11, 12, 13], 9, 0, 'both'),
      ...this.generateSideSeats([14], 4, 5, 'left'),                       // laterales en fila 14
      ...this.generateSideSeats([14], 4, 0, 'right'),                       // laterales en fila 14
      ...this.generateSideSeats([15, 16, 17, 18, 19], 4, 6, 'left'),
      ...this.generateSideSeats([15, 16, 17, 18, 19], 4, 0, 'right'),
      ...this.generateSideSeats([20, 21], 5, 0, 'both'),]

    // Platea C:
    const plateaC = [
      ...this.generateSideSeats([0, 1, 2, 3, 4, 5], 8, 0, 'both'),       // laterales superiores
      ...this.generateSideSeats([6], 8, 0, 'both'),                       // laterales en fila 6
      ...this.generateSideSeats([14], 5, 0, 'left'),                       // laterales en fila 14
      ...this.generateSideSeats([14], 5, 4, 'right'),                       // laterales en fila 14
      ...this.generateSideSeats([15, 16, 17, 18, 19], 6, 4, 'right'),       // laterales en filas 15–19
      ...this.generateSideSeats([15, 16, 17, 18, 19], 6, 0, 'left'),       // laterales en filas 15–19
      ...this.generateCentralBlockSeats([0, 1, 2, 3, 4, 5])  //  centro en filas altas W–R
    ];

    switch (platea) {
      case 'A':
        return plateaA;

      case 'B':
        return plateaB;

      case 'C':
        return plateaC;

      default:
        console.log("Asiento Fuera de Rango");
        break;
    }
  }

  // Plateas según el color (para la lógica de saldo)
  getPlateaDeAsiento(row: number, col: number) {
    const plateas = ['A', 'B', 'C'];

    for (const p of plateas) {
      const seats = this.getPlateas(p);
      if (seats.some(s => s.row === row && s.col === col)) return p;
    }

    return 'X';

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
          seats: this.getPlateas("A"),
        },
        plateaC: {
          label: 'Platea C',
          price: 20,
          cssClass: 'bloqueado',
          seats: this.getPlateas("C"),
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

  loadSeatsFromDB() {
    console.log('[DEBUG] Llamando getEstadoAsientos API...');
    this.asientosProvider.getEstadoAsientos().subscribe(
      data => {
        console.log('[DEBUG] Respuesta recibida del API:', data);
        this.blockedSeats = data
          .filter(seat => seat.estado === 'Reservado' && seat.fecha_fin_reserva && new Date(seat.fecha_fin_reserva) > now)
          .map(seat => ({
            row: seat.row,
            col: seat.col,
            expires: new Date(seat.fecha_fin_reserva).getTime(),
            userId: seat.userId
          }));
        console.log('[DEBUG] blockedSeats después de filtrar:', this.blockedSeats);
        this.soldSeats = data
          .filter(seat => seat.estado === 'Ocupado')
          .map(seat => ({
            row: Number(seat.row),
            col: Number(seat.col),
            label: seat.asiento
          }));
        console.log('[DEBUG] soldSeats después de filtrar:', this.soldSeats);
        this.refreshMap();
        // Oculta el skeleton solo cuando los datos del API están listos
        this.loading = false;
      },
      error => {
        console.error('[ERROR] Error en getEstadoAsientos:', error);
      }
    );
  }

  actualizarAsientoEnBD(seat: { row: number, col: number }, asiento: string, platea: string, estado: string, fechas: any, canjeada: number = 0, userId: number) {
    //const userid = this.getSession();
    console.log('[DEBUG] Enviando actualización de asiento al API:', {
      row: seat.row,
      col: seat.col,
      asiento,
      platea,
      estado,
      fechas,
      userId,
      canjeada
    });
    return this.asientosProvider.actualizarAsiento({ row: seat.row, col: seat.col }, asiento, platea, estado, fechas, userId, canjeada)
      .toPromise()
      .then(response => {
        console.log('[DEBUG] Respuesta de actualizarAsiento:', response);
        return response;
      })
      .catch(error => {
        console.error('[ERROR] Error en actualizarAsiento:', error);
        throw error;
      });
    // this.asientosProvider.actualizarAsiento(seat, estado, fechas, userid).subscribe(
    //   response => {
    //     console.log('Asiento actualizado:', response);
    //   },
    //   error => {
    //     console.error('Error al actualizar el asiento:', error);
    //   }
    // );
  }

  actualizarEstadoUsuarioPorBloqueos() {
    // 1. Encuentra todos los asientos bloqueados aún vigentes
    const cartBloqueados = this.blockedSeats
      .filter(function (b) {
        return b.expires > Date.now();
      })
      .map(function (b) {
        return { row: b.row, col: b.col };
      });

    // 2. Recalcula el saldo basado en los asientos aún vigentes
    const totalGastado = cartBloqueados.reduce((sum, seat) => sum + this.getSeatPrice({ index: seat }), 0);
    const saldoRestante = Math.max(0, this.initialUserAmount - totalGastado);
    this.userAmount = saldoRestante;

    // 3. Actualiza colores y mapa visual
    this.updateSeatColorsByUserAmount(this.userAmount);

    (this.options.map as any).selectedSeats = cartBloqueados;
    // 4. IMPORTANTE: Actualiza el cart visual sólo con los vigentes
    this.cart = cartBloqueados;
    this.refreshMap();
  }


  clearExpiredBlocks() {
    const before = this.blockedSeats.length;
    this.blockedSeats = this.blockedSeats.filter(function (b) {
      return b.expires > Date.now();
    });
    if (this.blockedSeats.length !== before) {
      this.saveSeatsToStorage();
      // Llama a la función para actualizar saldo, colores y refrescar el mapa
      this.actualizarEstadoUsuarioPorBloqueos();
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

  // Solo disables de layout + vendidos
  getDisabledSeats() {
    return [
      ...this.generateDisabledSeatsFromLayout(),
      
    ];
  }

  //Nuevo funcion para llamar a la clase temporal
  applyTemporaryClasses() {
    // Limpia temporales anteriores
    Array.from(document.querySelectorAll('.temporal')).forEach(el => el.classList.remove('temporal'));

    this.blockedSeats.forEach(seat => {
      if (seat.expires > Date.now()) {
        // Calcula el label visual
        const label = this.seatLabelSeatsFromLayout({ row: seat.row, col: seat.col });

        // Encuentra el asiento por label
        const el = Array.from(document.querySelectorAll('.sc-seat'))
          .find((e: Element) => e.textContent === label);

        if (el && el.classList.contains('sc-seat-reserved')) {
          el.classList.remove('sc-seat-reserved'); // quita gris si lo tiene
        }

        if (el && !el.classList.contains('temporal')) {
          el.classList.add('temporal'); // aplica naranja
        }
      }
    });
  }
  //

  getReservedSeats() {
    // Solo devolver los asientos vendidos confirmados
    console.log('[DEBUG] Obteniendo asientos reservados...', this.soldSeats);

    return this.soldSeats.map(s => ({ row: s.row, col: s.col }));
  }

  refreshMap() {
    if (!this.seatContainer) return;
    this.options.map.disabledSeats = this.getDisabledSeats();
    this.options.map.reservedSeats = this.getReservedSeats();

    this.initSeatChart(this.seatContainer.nativeElement);

    // Nuevo: Esperar al render completo antes de aplicar estilos
    requestAnimationFrame(() => {
      this.applyTemporaryClasses();
    });
  }

  onSeatChange(selectedSeats: { row: number, col: number }[]) {
    // Elimina bloqueos que ya no están seleccionados
    this.blockedSeats = this.blockedSeats.filter(blocked => {
      // Solo conserva los aún seleccionados
      return selectedSeats.some(sel => sel.row === blocked.row && sel.col === blocked.col && blocked.expires > Date.now());
    });

    // Añade nuevos bloqueos
    selectedSeats.forEach(seat => {
      const now = new Date();
      const fechaFinReserva = new Date(now.getTime() + this.timeLeft * 1000); // Expira en timeLeft segundos
      const platea = this.getPlateaDeAsiento(seat.row, seat.col);
      this.actualizarAsientoEnBD(
        seat,
        this.seatLabelSeatsFromLayout({ row: seat.row, col: seat.col }),
        platea,
        'Reservado',
        {
          fecha_reserva: this.getGuayaquilDateString(now),
          fecha_fin_reserva: this.getGuayaquilDateString(fechaFinReserva)
        },
        0,
        1 // Cambiar esto por el ID del usuario real
      );
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

      // Opcional: aplica zoom si lo necesitas
      this.zoomLevel = this.zoomLevel || 1.0;
      this.initializeZoomToFit(false);
      this.pinchToZoom();
    });
  }

  //Nuevos metodos: Metodo para calcular el precio del asiento
  private getSeatPrice(seat: any): number {
    const row = seat.index.row;
    const col = seat.index.col;
    const platea = this.getPlateaDeAsiento(row, col);

    if (platea === 'A') return 40;
    if (platea === 'B') return 30;
    if (platea === 'C') return 20;
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
  }

  formatTimeLeft(): string {
    let value = this.timeLeft;
    if (value < 0) value = 0;
    const min = Math.floor(value / 60);
    const sec = value % 60;
    return `${this.pad(min)}:${this.pad(sec)}`;
  }

  pad(num: number) {
    return num < 10 ? '0' + num : num;
  }
  isTimeCritical(): boolean {
    return this.timeLeft <= 30 && this.timeLeft > 0;
  }

  startTimer() {
    this.stopTimer(); // Evita dos timers simultáneos
    this.timeLeft = 60;
    this.timerActivo = true;
    this.timer = setInterval(() => {
      this.timeLeft--;
      // (Opcional) Actualiza un contador visual aquí si quieres
      if (this.timeLeft <= 0) {
        this.onTimerEnd();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.timerActivo = false;
  }

  onTimerEnd() {
    this.stopTimer();
    // Limpia todos los bloqueos y desmarca todos los asientos
    this.removeAllBlockedSeats();
    this.userAmount = this.initialUserAmount; // Regresa los puntos
    this.updateSeatColorsByUserAmount(this.userAmount);
    this.refreshMap();

    // (Opcional) Muestra un mensaje al usuario
    this.alertCtrl.create({
      title: 'Tiempo agotado',
      message: 'Se acabó el tiempo para reservar tus asientos. Puedes volver a intentar.',
      buttons: [{ text: 'Aceptar' }]
    }).present();
  }
  removeAllBlockedSeats() {
    // Elimina todos los bloqueos
    this.blockedSeats = [];
    this.saveSeatsToStorage();

    // Limpia tu cart visual
    this.cart = [];
    (this.options.map as any).selectedSeats = [];
  }

  private setupCartListener(sc: any) {
    let reconstruyendoCart = false;

    sc.addEventListener('cartchange', () => {
      const cart = sc.getCart();

      // ✅ Evita afectar el temporizador si estamos en medio de una reconstrucción visual
      if (!reconstruyendoCart) {
        if (cart.length > 0 && !this.timerActivo) this.startTimer();
        if (cart.length === 0 && this.timerActivo) this.stopTimer();
      }

      let saldoTemp = this.initialUserAmount;
      const detallesInvalidos: string[] = [];
      const asientosValidos: any[] = [];

      for (const item of cart) {
        const row = item.index.row;
        const col = item.index.col;
        const platea = this.getPlateaDeAsiento(row, col);
        const precio = this.getSeatPrice({ index: { row, col } });

        if (saldoTemp >= precio) {
          saldoTemp -= precio;
          asientosValidos.push(item);
        } else {
          detallesInvalidos.push(`Platea ${platea} ($${precio})`);
        }
      }

      if (detallesInvalidos.length > 0) {
        const alertaError = this.alertCtrl.create({
          title: 'Puntos insuficientes',
          message: `No se puede seleccionar el asiento:\n${detallesInvalidos.join('\n')}`,
          buttons: [{ text: 'Aceptar' }]
        });
        alertaError.present();

        // 🔐 Indicamos que estamos en proceso de reconstrucción visual
        reconstruyendoCart = true;

        // ✅ Limpiar y seleccionar solo válidos sin disparar stopTimer()
        sc.clearCart();
        (this.options.map as any).selectedSeats = asientosValidos.map(a => a.index);
        this.refreshMap();

        // ✅ Esperamos al siguiente frame y restablecemos la bandera
        requestAnimationFrame(() => {
          reconstruyendoCart = false;
        });
      }

      // Actualiza carrito
      this.cart = asientosValidos.map(item => ({
        row: item.index.row,
        col: item.index.col
      }));

      this.onSeatChange(this.cart);

      // Actualiza visual del contador
      requestAnimationFrame(() => {
        const labels = this.cart
          .map(seat => this.seatLabelSeatsFromLayout({ row: seat.row, col: seat.col }))
          .join(', ');
        const countP = document.querySelector('.cart-count');
        if (countP) countP.textContent = `${this.cart.length} tickets:\n${labels}`;
      });

      this.actualizarEstadoUsuario();
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
        const alertaError = this.alertCtrl.create({
          title: 'Asientos no seleccionados',
          message: 'No hay asientos seleccionados, Porfavor seleccione un asiento',
          buttons: [{ text: 'Aceptar' }]
        })
        alertaError.present();
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
            // El usuario canceló la reserva
          }
        },
        {
          text: 'Enviar',
          handler: () => {
            // 🔁 Recorrer los asientos del carrito
            this.cart.forEach(seat => {
              const now = new Date();
              // Actualizar el estado del asiento en la base de datos
              this.actualizarAsientoEnBD(
                seat,
                this.seatLabelSeatsFromLayout({ row: seat.row, col: seat.col }),
                this.getPlateaDeAsiento(seat.row, seat.col),
                'Ocupado',
                {
                  fecha_canje: this.getGuayaquilDateString(now)
                },
                0,
                1 // Cambiar esto por el ID del usuario real
              );
              // 🔍 Buscar el elemento en el DOM por ID
              const el = document.querySelector(`#seat-${seat.row}-${seat.col}`);
              if (el) {
                // 🧼 Remover clase temporal (naranja)
                el.classList.remove('temporal');

                // ✅ Aplicar clase de reservado (gris)
                el.classList.add('sc-seat-reserved');
              }
            });

            // ✅ Actualizar lista de vendidos
            this.soldSeats = [
              ...this.soldSeats,
              ...this.cart
            ];

            // ✅ Guardar los cambios en localStorage
            this.saveSeatsToStorage();

            // 🔁 Resetear carrito visual
            this.cart = [];
            (this.options.map as any).selectedSeats = [];

            // 🔄 Volver a renderizar el mapa con estado actualizado
            this.refreshMap();

            // ⏱️ Detener el temporizador
            this.stopTimer();

            // 🎟️ Navegar a la página del QR con los datos generados
            this.navCtrl.push('QrPage', { qrDataArray });
          }
        }
      ]
    });

    alert.present();
  }


  ionViewDidLoad() {
    this.loadSeatsFromDB();
    setInterval(() => this.clearExpiredBlocks(), 1000);
    // this.loadSeatsFromStorage();
    // setInterval(() => this.clearExpiredBlocks(), 1000);
    // window.addEventListener('storage', () => {
    //   this.loadSeatsFromStorage();
    // });
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

/*
  initializeZoomToFit(zoomIn: boolean = false) {
    const map = this.seatContainer.nativeElement.querySelector('.sc-map');
    const container = this.seatContainer.nativeElement;
    const containerRect = container.getBoundingClientRect();

    const scaleX = containerRect.width / map.offsetWidth;
    const scaleY = containerRect.height / map.offsetHeight;

    // Escala mínima para que el mapa completo entre en el contenedor
    let baseZoom = Math.min(scaleX, scaleY, 1);

    this.zoomLevel = zoomIn ? Math.min(baseZoom * 2.5, 2.5) : baseZoom;
    this.globalScale = this.zoomLevel; // importante para que el pinch continúe desde aquí

    // Centrado horizontal y vertical
    const scaledMapWidth = map.offsetWidth * this.zoomLevel;
    const scaledMapHeight = map.offsetHeight * this.zoomLevel;

    this.translateX = (containerRect.width - scaledMapWidth) / 2;

    // Si se hace zoom, se baja para que el escenario sea visible
    this.translateY = zoomIn ? (containerRect.height - scaledMapHeight) / 2 - 50 : (containerRect.height - scaledMapHeight) / 2;

    // Aplicar la transformación inicial
    map.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoomLevel})`;
    map.style.transformOrigin = '0 0';
  }*/

initializeZoomToFit(zoomIn: boolean = false) {
  const map = this.seatContainer.nativeElement.querySelector('.sc-map');
  const container = this.seatContainer.nativeElement;
  const containerRect = container.getBoundingClientRect();

  const scaleX = containerRect.width / map.offsetWidth;
  const scaleY = containerRect.height / map.offsetHeight;

  let baseZoom = Math.min(scaleX, scaleY, 1);

  if (this.plateaActiva === 'A') {
    // Zoom fijo más cercano para platea A
    this.zoomLevel = Math.min(baseZoom * 3, 3);
    this.globalScale = this.zoomLevel;

    const scaledMapWidth = map.offsetWidth * this.zoomLevel;
    const scaledMapHeight = map.offsetHeight * this.zoomLevel;

    this.translateX = (containerRect.width - scaledMapWidth) / 2 + 50;
    this.translateY = (containerRect.height - scaledMapHeight) / 2 - 150;
  } else {
    // Zoom adaptable con opción de acercar para platea B y C
    this.zoomLevel = zoomIn ? Math.min(baseZoom * 2.5, 2.5) : baseZoom;
    this.globalScale = this.zoomLevel;

    const scaledMapWidth = map.offsetWidth * this.zoomLevel;
    const scaledMapHeight = map.offsetHeight * this.zoomLevel;

    this.translateX = (containerRect.width - scaledMapWidth) / 2;
    this.translateY = zoomIn
      ? (containerRect.height - scaledMapHeight) / 2 - 50
      : (containerRect.height - scaledMapHeight) / 2;
  }

  map.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoomLevel})`;
  map.style.transformOrigin = '0 0';
}




  pinchToZoom() {
    const map = this.seatContainer.nativeElement.querySelector('.sc-map');
    this.hammer = new hammerjs(map);

    // Almacena tamaño original del mapa solo una vez
    if (!this.originalMapWidth) {
      this.originalMapWidth = map.offsetWidth;
      this.originalMapHeight = map.offsetHeight;
    }

    this.hammer.get('pinch').set({ enable: true });
    this.hammer.get('pan').set({ direction: hammerjs.DIRECTION_ALL })

    //   🔎 Manejar el gesto pinch
    this.hammer.on('pinch', (event) => {
      const previousZoom = this.zoomLevel;
      this.zoomLevel = Math.max(0.125, Math.min(event.scale * this.globalScale, 1.125)); // Limita el zoom entre 0.2x y 1.5x

      const containerRect = this.seatContainer.nativeElement.getBoundingClientRect();

      // Coordenadas del gesto dentro del contenedor
      const gestureX = event.center.x - containerRect.left;
      const gestureY = event.center.y - containerRect.top;

      // Corrige el desplazamiento (esto es clave)
      const offsetX = (gestureX - this.translateX) / previousZoom;
      const offsetY = (gestureY - this.translateY) / previousZoom;

      // Calcula nueva posición para mantener el gesto como centro
      this.translateX = gestureX - offsetX * this.zoomLevel;
      this.translateY = gestureY - offsetY * this.zoomLevel;

      this.clampPanToBounds();

      map.style.transform = `translate(${this.translateX}px,${this.translateY}px) scale(${this.zoomLevel})`;
      map.style.transformOrigin = '0 0';

    });

    // 🔚 PINCH END
    this.hammer.on('pinchend', () => {
      this.globalScale = this.zoomLevel;
      this.clampPanToBounds();

      map.style.transition = 'transform 0.3s ease-out';
      map.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoomLevel})`;

      setTimeout(() => {
        map.style.transition = '';
      }, 300);
    })

    // 🎯 PAN START
    this.hammer.on('panstart', () => {
      this.startX = this.translateX;
      this.startY = this.translateY;
    })

    // 🔎 PAN MOVE
    this.hammer.on('panmove', (ev) => {
      this.translateX = this.startX + ev.deltaX;
      this.translateY = this.startY + ev.deltaY;
      this.clampPanToBounds();

      map.style.transform = `translate(${this.translateX}px,${this.translateY}px) scale(${this.zoomLevel})`;
    })

    // 🔚 PAN END
    this.hammer.on('panend', () => {
      this.clampPanToBounds();
      map.style.transition = 'transform 0.3s ease-out';
      map.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoomLevel})`;

      setTimeout(() => {
        map.style.transition = '';
      }, 300);
    });
  }
  

  clampPanToBounds() {
    const containerRect = this.seatContainer.nativeElement.getBoundingClientRect();
    const scaledWidth = this.originalMapWidth * this.zoomLevel;
    const scaledHeight = this.originalMapHeight * this.zoomLevel;

    // Si el mapa es más pequeño que el contenedor, centramos
    if (scaledWidth < containerRect.width) {
      this.translateX = (containerRect.width - scaledWidth) / 2;
    } else {
      const maxTranslateX = 0;
      const minTranslateX = containerRect.width - scaledWidth;
      this.translateX = Math.max(minTranslateX, Math.min(this.translateX, maxTranslateX));
    }

    if (scaledHeight < containerRect.height) {
      this.translateY = (containerRect.height - scaledHeight) / 2;
    } else {
      const maxTranslateY = 0;
      const minTranslateY = containerRect.height - scaledHeight;
      this.translateY = Math.max(minTranslateY, Math.min(this.translateY, maxTranslateY));
    }
  }

  // Nuevo: Función que devuelve la clase según la platea activa
  get clasePlateaActiva(): string {
    switch (this.plateaActiva) {
      case 'A': return 'plateaA';
      case 'B': return 'plateaB';
      case 'C': return 'plateaC';
      default: return '';
    }
  }

  cambiarPlatea(nuevaPlatea: string) {
    this.plateaActiva = nuevaPlatea;
  }


  ionViewDidEnter() {

    this.platform.ready().then(() => {
      // requestAnimationFrame(() => {

      // Asigna saldo inicial dinámicamente
      this.initialUserAmount = this.userAmount; //Nuevo

      this.updateSeatColorsByUserAmount(this.userAmount);// Nuevo: Usa el valor de la variable para aplicar colores

      const container = this.seatContainer.nativeElement;
      this.initSeatChart(container); // retorna el chart
      // });
    });
  }

}
