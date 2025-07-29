import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable()
export class AsientosProvider {
  private apiUrl = 'http://localhost:8080/wordpress/wp-json/delportal/v1';

  constructor(private http: HttpClient) {
  }

  getEstadoAsientos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/estado`);
  }

  // Actualizar estado de un asiento
  actualizarAsiento(
    seat: { row: number, col: number },
    asiento: string,
    platea: string,
    estado: string,
    fechas: any,
    userid: number,
    canjeada: number = 0
  ): Observable<any> {
    const body = {
      row: seat.row,
      col: seat.col,
      estado: estado,
      userid: userid,
      fecha_reserva: fechas.fecha_reserva || null,
      fecha_fin_reserva: fechas.fecha_fin_reserva || null,
      fecha_canje: fechas.fecha_canje || null,
      fecha_validacion: fechas.fecha_validacion || null,
      platea: platea || null,
      asiento: asiento || null,
      canjeada: typeof canjeada !== 'undefined' ? canjeada : 0
    };
    return this.http.post(`${this.apiUrl}/actualizar`, body);
  }

}
