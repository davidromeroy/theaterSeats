# 🎭 Seatchart Teatro

Este proyecto es una implementación personalizada del plugin [Seatchart](https://seatchart.js.org/) para representar un **mapa de asientos en forma de teatro**. Está construido con **Ionic 3** y permite seleccionar asientos con distintos tipos y precios, simulando la experiencia de compra de entradas para un teatro real.

---

## 🎯 Objetivo

Adaptar el layout clásico de Seatchart (tipo avión) a una disposición tipo teatro, con asientos en forma de **V**, mostrando plateas A, B y C, y con lógica de selección, carrito y cálculo de precios.

---

## 📐 Características principales

- Distribución personalizada de asientos en forma de V (más filas arriba, menos abajo).
- Etiquetado automático tipo `W101`, `C105`, `A116`, etc.
- Tipos de asiento:
  - 🎟️ Platea A (VIP)
  - 🎟️ Platea B
  - 🎟️ Platea C (económica)
- Precios configurables por tipo.
- Carrito dinámico con total en dólares (`$`).
- Eventos de selección y submit configurados.
- Diseño responsivo con escalado (`transform: scale`) para pantallas más pequeñas.

---

## 🚀 Instalación

1. Clona el repositorio:

```bash
git clone https://github.com/davidromeroy/theaterSeats.git
cd theaterSeats
```
2. Instala dependencias:
```bash
npm install
```

3. Corre la app:
```bash
ionic serve
```
Asegúrate de tener Node.js 14+ y Ionic CLI 3 instalado.


## 🧩 Estructura principal

- `src/pages/seats/seats.ts` – Lógica de distribución y eventos.
- `src/pages/seats/seats.html` – Contenedor del mapa.
- `src/pages/seats/seats.scss` – Estilos personalizados de Seatchart.
- `seatchart` se importa como CDN o con `require`.

---

## 🛠️ Personalización rápida

- **Fila de asientos**: modificar `seatLetters` en `seats.ts`.
- **Precio o tipo**: modificar `seatTypes` en `options.map`.
- **Distribución de asientos en V**: ajustar `generateDisabledSeats()`.
- **Moneda**: se muestra en `$` en `cartTotal`, pero se puede cambiar a puntos u otra moneda.

---

## 🤝 Contribuir

1. Crea tu rama con nombre descriptivo:

```bash
git checkout -b fix-alineacion-asientos
```

2. Haz tus cambios y commitea:
```bash
git commit -am "Fix: alineación de Platea B"
```
3. Push y crea un pull request:
```bash
git push origin fix-alineacion-asientos
```

