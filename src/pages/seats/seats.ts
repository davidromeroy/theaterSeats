import { Component, ElementRef, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

// import * as Seatchart from 'seatchart'; // <-- Importa la librería
declare var require: any; // 👈 ayuda a TypeScript a compilar el require
const Seatchart = require('seatchart');     // 👈 require directo

/**
 * Generated class for the SeatsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */
const seatLetters = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G',
  'H', 'J', 'K', 'L', 'M', 'N', 'O', 
  'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'
]; // 22 filas

const rows = seatLetters.length; // 22
const columns = 66; // o 60, dependiendo del espacio que quieras
const layout = [
  { active: [0, 37, 0], disabled: [4, 4], shiftLeft: 16 },      //W
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

  @ViewChild('seatContainer') seatContainer: ElementRef;

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

  generateDisabledSeatsFromLayout() {
    const disabled = [];

    layout.forEach((rowLayout, rowIndex) => {
      let col = 0;

      // Desactivamos los asientos iniciales definidos por shiftLeft
      for (let i = 0; i < rowLayout.shiftLeft; i++) {
        disabled.push({ row: rowIndex, col: col++ });
      }

      // Alternamos bloques de activos y deshabilitados
      rowLayout.active.forEach((activeSeats, i) => {
        col += activeSeats;

        const gap = rowLayout.disabled[i] || 0;
        for (let j = 0; j < gap; j++) {
          disabled.push({ row: rowIndex, col: col++ });
        }
      });

      // Desactivar lo que sobre al final
      while (col < columns) {
        disabled.push({ row: rowIndex, col: col++ });
      }
    });

    console.log(disabled);
    return disabled;
  }

  seatLabelSeatsFromLayout(index: any){
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
          // seatColumns: [10],
          // // seatRows: [0, 1, 2, 3, 4, 5],
          // seats: [{ row: 7, col: 20 }],      //Example
        },
        plateaC: {
          label: 'Platea C',
          price: 20,
          cssClass: 'plateaC',
          seatRows: [0, 1, 2, 3, 4, 5],
          seats: [
            // ...this.generateCentralBlockSeats(),
            ...this.generateSideSeats([6], 8),
            ...this.generateSideSeats([14], 5),
            ...this.generateSideSeats([15, 16, 17, 18, 19], 6),
          ]
        }
      },
      selectedSeats: [
        { row: 0, col: 44 }, 
        { row: 3, col: 34 } //W= row:0, A= row:22
      ],   //EXAMPLE
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
        label: (column: number) => {
          return `${seatLetters[seatLetters.length - column - 1]}`
        },  //True por default, indices del 1 al 50 en este caso (this.columns)
      },
      frontVisible: false, //True por default
    },
    
    /**
     * Cart options.
     */
    cart:{
      // visible: false,        // True por default
      currency: '$',
      submitLabel: 'Reservar',  // Checkout por default
    },
    legendVisible: false,    // True por default
  };

  ionViewDidEnter() {
    const element = this.seatContainer.nativeElement;
    // const Seatchart = (window as any).Seatchart;
    const sc = new Seatchart(element, this.options);
    // Esperamos a que se renderice todo antes de mover el carrito
    const mapContainer = element.querySelector('.sc-map').querySelector('.sc-map-inner-container');
    const stageDiv = document.createElement('div');
    stageDiv.className = 'stage';
    stageDiv.textContent = 'Escenario';
    mapContainer.appendChild(stageDiv);
  
    
    setTimeout(() => {
      const originalCart = element.querySelector('.sc-right-container');
      const customCartContainer = document.getElementById('floatingCart');
      if (originalCart && customCartContainer) {
        customCartContainer.appendChild(originalCart); 
        // customCartContainer.appendChild(document.querySelector('.sc-cart-title'));
        customCartContainer.appendChild(document.querySelector('.sc-cart-header'));
        customCartContainer.appendChild(document.querySelector('.sc-cart-footer'));
      }
      const cart2 = customCartContainer.querySelector('.sc-right-container');
      if (cart2) {
        cart2.remove();
      }
    }, 200);
    
    


    const total = sc.getCartTotal();
    const cart = sc.getCart();    //Obtiene la info del carrito
    // const seat = sc.getSeat({0,5});    //Obtiene la info del carrito
    // const clear = sc.clearCart(); //Limpia el carrito
    console.log('Total a pagar:', total);
    console.log('Asientos seleccionados:', cart);
    console.log(sc.store.getOptions())
    // console.log('Seat:', seat);

    sc.store.seats; // Accede directamente a la grilla de asientos
    sc.store.cart; // Acceso directo al array del carrito

    sc.addEventListener('cartchange', () => {
      const total = sc.getCartTotal();
      console.log('Nuevo total:', total);
    });

    sc.addEventListener('submit', function handleSubmit(e) {
        alert('Total: ' + e.total + '$');
    });

  } 
}