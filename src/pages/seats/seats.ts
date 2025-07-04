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
  'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'
]; // 23 filas

const rows = seatLetters.length; // 23
const columns = 50; // o 60, dependiendo del espacio que quieras
const maxSeatsPerRow = 16 + (rows - 1); // W = 16 + 22 = 38

@IonicPage()
@Component({
  selector: 'page-seats',
  templateUrl: 'seats.html',
})
export class SeatsPage {

  @ViewChild('seatContainer') seatContainer: ElementRef;

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

  generateDisabledSeats() {
    const disabled = [];

    for (let row = 0; row < rows; row++) {
      const seatsInRow = 16 + (rows - 1 - row); // más asientos en las filas de arriba
      const margin = Math.floor((columns - seatsInRow) / 2);

      for (let col = 0; col < columns; col++) {
        if (col < margin || col >= columns - margin) {
          disabled.push({ row, col });
        }
      }
    }

    return disabled;
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
          // seats: [{ row: 7, col: 20 }],      //Example
          seatRows: [15, 16, 17, 18, 19, 20],
          // seatColumns: [2],
          //TODO: La Fila I no existe
        },
        plateaC: {
          label: 'Platea C',
          price: 30,
          cssClass: 'plateaC',
          seatRows: [0, 1, 2, 3, 4, 5],
        }
      },
      selectedSeats: [
        { row: 0, col: 5 }, 
        { row: 0, col: 6 }
      ],  
      reservedSeats: [
        { row: 0, col: 3 },
        { row: 0, col: 4 },
      ],
      disabledSeats: this.generateDisabledSeats(),
      // disabledSeats: [
      //     { row: 0, col: 0 },
      //     { row: 0, col: 9 },
      //   ],

      // columnSpacers: [0],
      // rowSpacers: [0],   // Posicion donde se pondrá un espacio entre filas. Index 4 forma un espacio entre la columna 4 y 5.
      seatLabel: (index) => {
        const rowLetter = seatLetters[rows - 1 - index.row]; // invertido
        const visibleSeats = 16 + (rows - 1 - index.row);
        const margin = Math.floor((columns - visibleSeats) / 2);
        const seatNumber = 101 + (index.col - margin);
        return `${rowLetter}${seatNumber}`;
      },
      indexerColumns: {
        visible: false,  //True por default, indices del 1 al 50 en este caso (this.columns)
      },
      indexerRows: {
        label: (column: number) => {
          return `${seatLetters[seatLetters.length - column - 1]}`
        },  //True por default, indices del 1 al 50 en este caso (this.columns)
      }
      // frontVisible: false, //True por default
    },
    
    /**
     * Cart options.
     */
    cart:{
      // visible: false,        // True por default
      currency: '$',
      submitLabel: 'Reservar',  // Checkout por default
    },
    // legendVisible: false,    // True por default
  };

  ionViewDidEnter() {
    const element = this.seatContainer.nativeElement;
    
    // const Seatchart = (window as any).Seatchart;

    const sc = new Seatchart(element, this.options);

    const total = sc.getCartTotal();
    const cart = sc.getCart();    //Obtiene la info del carrito
    // const seat = sc.getSeat({0,5});    //Obtiene la info del carrito
    // const clear = sc.clearCart(); //Limpia el carrito
    console.log('Total a pagar:', total);
    console.log('Asientos seleccionados:', cart);
    console.log(sc.store.getOptions())
    // console.log('Seat:', seat);
    sc.store.getOptions(); // Devuelve las opciones de configuración
    sc.store.seats; // Accede directamente a la grilla de asientos
    sc.store.cart; // Acceso directo al array del carrito

    sc.addEventListener('cartchange', () => {
      const total = sc.getCartTotal();
      console.log('Nuevo total:', total);
    });

    sc.addEventListener('submit', function handleSubmit(e) {
        alert('Total: ' + e.total + '$');
    });

    sc.addEventListener('seatchange', ({ current, previous }) => {
      console.log('Cambio en asiento:', previous.label, '→', current.label);
    });


  } 
}