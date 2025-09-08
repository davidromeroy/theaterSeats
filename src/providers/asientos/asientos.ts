import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface EstadoAsiento {
  id: string;
  gamificacion_id?: string;
  userid?: string;
  ticket?: string;   // ej: "PLATEA A"
  row?: string;      // ej: "19"
  col?: string;      // ej: "45"
  asiento?: string;  // ej: "C117"
  estado?: string;   // ej: "Ocupado"
  fecha_creacion?: string;
  fecha_reserva?: string | null;
  fecha_fin_reserva?: string | null;
  fecha_ocupado?: string | null;
  fecha_canjeado?: string | null;
  canjeada?: string | number;
}

@Injectable()
export class AsientosProvider {
  
  private apiUrl = 'https://mobile.liris.com.ec/delportal/wp-json/delportal/v1/obtener_estado_asientos';

   

  constructor(private http: HttpClient) {
  }

getEstadoAsientos():Observable<EstadoAsiento[]>{
  return this.http.get<EstadoAsiento[]>(`${this.apiUrl}`);
}

  // Actualizar estado de un asiento
  /*actualizarAsiento(
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
*/
}
