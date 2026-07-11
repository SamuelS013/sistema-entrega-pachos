import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue } from "firebase/database";

// Tus credenciales de Firebase vinculadas al proyecto central
const firebaseConfig = {
  apiKey: "AIzaSyDnCB67oiJyud6HcdKnYpgqrTlkbG95oBM",
  authDomain: "sistema-entrega-pachos.firebaseapp.com",
  databaseURL: "https://sistema-entrega-pachos-default-rtdb.firebaseio.com",
  projectId: "sistema-entrega-pachos",
  storageBucket: "sistema-entrega-pachos.firebasestorage.app",
  messagingSenderId: "876518154698",
  appId: "1:876518154698:web:58eb635b6f650704362f33"
};

// Inicializamos la conexión a la Nube
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Variables del DOM - Con IDs corregidos para coincidir con tu HTML
const contenedorFacturas = document.getElementById('contenedor-facturas');
const overlayFactura = document.getElementById('overlay-factura');
const btnGenerarFactura = document.getElementById('btn-factura') || document.getElementById('btn-generar-factura');
const btnCancelar = document.getElementById('btn-cancelar');
const formularioFactura = document.getElementById('formulario-factura');

// Abrir formulario flotante con verificación segura
if (btnGenerarFactura) {
  btnGenerarFactura.addEventListener('click', () => {
    if (overlayFactura) overlayFactura.classList.remove('oculto');
  });
}

// Cerrar formulario flotante
if (btnCancelar) {
  btnCancelar.addEventListener('click', () => {
    if (overlayFactura) overlayFactura.classList.add('oculto');
    if (formularioFactura) formularioFactura.reset();
  });
}

// ESCUCHAR LA BASE DE DATOS EN TIEMPO REAL
if (contenedorFacturas) {
  onValue(ref(db, 'facturas'), (snapshot) => {
    contenedorFacturas.innerHTML = '';
    
    if (!snapshot.exists()) {
      contenedorFacturas.innerHTML = '<p class="alerta-vacio">No hay facturas registradas en el sistema.</p>';
      return;
    }

    const datos = snapshot.val();
    
    Object.keys(datos).forEach(id => {
      const factura = datos[id];
      
      const div = document.createElement('div');
      div.className = 'tarjeta-factura';
      div.innerHTML = `
        <div class="factura-cabecera">
          <span><strong>ID:</strong> ${id.substring(1, 8).toUpperCase()}</span>
          <span>${factura.fecha}</span>
        </div>
        <div style="margin-bottom: 5px;"><strong>Deudor:</strong> ${factura.deudor}</div>
        <div class="factura-monto">$${parseFloat(factura.monto).toFixed(2)}</div>
      `;
      contenedorFacturas.appendChild(div);
    });
  });
}

// ENVIAR UNA NUEVA FACTURA A LA NUBE
if (formularioFactura) {
  formularioFactura.addEventListener('submit', (e) => {
    e.preventDefault();

    const inputDeudor = document.getElementById('nombre-deudor');
    const inputMonto = document.getElementById('monto-factura');

    if (!inputDeudor || !inputMonto) return;

    const nuevaFactura = {
      deudor: inputDeudor.value.trim(),
      monto: parseFloat(inputMonto.value),
      fecha: new Date().toLocaleDateString(),
      estado: 'pendiente'
    };

    if (!nuevaFactura.deudor || isNaN(nuevaFactura.monto) || nuevaFactura.monto <= 0) {
      alert("Por favor, llena los campos con montos válidos.");
      return;
    }

    push(ref(db, 'facturas'), nuevaFactura)
      .then(() => {
        if (overlayFactura) overlayFactura.classList.add('oculto');
        formularioFactura.reset();
      })
      .catch((error) => {
        console.error("Error al guardar en Firebase: ", error);
        alert("Hubo un problema al guardar la factura en la nube.");
      });
  });
}
