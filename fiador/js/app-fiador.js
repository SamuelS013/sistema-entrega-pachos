import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue } from "firebase/database";

// Tus credenciales de Firebase configuradas para la Web
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

// Variables del DOM
const contenedorFacturas = document.getElementById('contenedor-facturas');
const overlayFactura = document.getElementById('overlay-factura');
const btnGenerarFactura = document.getElementById('btn-generar-factura');
const btnCancelar = document.getElementById('btn-cancelar');
const formularioFactura = document.getElementById('formulario-factura');

// Abrir y cerrar formulario flotante
btnGenerarFactura.addEventListener('click', () => overlayFactura.classList.remove('oculto'));
btnCancelar.addEventListener('click', () => {
  overlayFactura.classList.add('oculto');
  formularioFactura.reset();
});

// ESCUCHAR LA BASE DE DATOS EN TIEMPO REAL
// Cada vez que cambie algo en la nube, esto redibuja el historial del fiador automáticamente
onValue(ref(db, 'facturas'), (snapshot) => {
  contenedorFacturas.innerHTML = '';
  
  if (!snapshot.exists()) {
    contenedorFacturas.innerHTML = '<p class="alerta-vacio">No hay facturas registradas en el sistema.</p>';
    return;
  }

  const datos = snapshot.val();
  
  // Recorremos las facturas traídas de la nube
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

// ENVIAR UNA NUEVA FACTURA A LA NUBE
formularioFactura.addEventListener('submit', (e) => {
  e.preventDefault();

  const nuevaFactura = {
    deudor: document.getElementById('nombre-deudor').value.trim(),
    monto: parseFloat(document.getElementById('monto-factura').value),
    fecha: new Date().toLocaleDateString(),
    estado: 'pendiente'
  };

  // Validación rápida
  if (!nuevaFactura.deudor || isNaN(nuevaFactura.monto) || nuevaFactura.monto <= 0) {
    alert("Por favor, llena los campos con montos válidos.");
    return;
  }

  // Guardamos directamente en el nodo 'facturas' de Firebase
  push(ref(db, 'facturas'), nuevaFactura)
    .then(() => {
      overlayFactura.classList.add('oculto');
      formularioFactura.reset();
    })
    .catch((error) => {
      console.error("Error al guardar en Firebase: ", error);
      alert("Hubo un problema al guardar la factura en la nube.");
    });
});
