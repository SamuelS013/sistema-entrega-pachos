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

// Inicializamos la conexión
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Variables del DOM - Con IDs corregidos para coincidir con tu HTML
const montoGranTotal = document.getElementById('monto-gran-total');
const contenedorPendientes = document.getElementById('contenedor-facturas-pendientes');
const overlayPago = document.getElementById('overlay-pago');
const btnRegistrarPago = document.getElementById('btn-pago') || document.getElementById('btn-registrar-pago');
const btnCancelarPago = document.getElementById('btn-cancelar-pago') || document.getElementById('btn-cancelar');
const formularioPago = document.getElementById('formulario-pago');

// Abrir formulario de pagos de forma segura
if (btnRegistrarPago) {
  btnRegistrarPago.addEventListener('click', () => {
    if (overlayPago) overlayPago.classList.remove('oculto');
  });
}

// Cerrar formulario de pagos
if (btnCancelarPago) {
  btnCancelarPago.addEventListener('click', () => {
    if (overlayPago) overlayPago.classList.add('oculto');
    if (formularioPago) formularioPago.reset();
  });
}

// ESCUCHAR EN TIEMPO REAL LAS FACTURAS Y ACTUALIZAR SALDOS
if (montoGranTotal && contenedorPendientes) {
  onValue(ref(db, 'facturas'), (snapshot) => {
    contenedorPendientes.innerHTML = '';
    let totalAcumulado = 0;

    if (!snapshot.exists()) {
      montoGranTotal.textContent = "$0.00";
      contenedorPendientes.innerHTML = '<p class="alerta-vacio">No tienes facturas pendientes. ¡Estás al día!</p>';
      return;
    }

    const datos = snapshot.val();

    Object.keys(datos).forEach(id => {
      const factura = datos[id];

      if (factura.estado === 'pendiente') {
        totalAcumulado += parseFloat(factura.monto);

        const div = document.createElement('div');
        div.className = 'tarjeta-factura';
        div.innerHTML = `
          <div class="factura-cabecera">
            <span><strong>ID Factura:</strong> ${id.substring(1, 8).toUpperCase()}</span>
            <span>${factura.fecha}</span>
          </div>
          <div style="margin-bottom: 5px;"><strong>Concepto:</strong> Entrega de productos</div>
          <div class="factura-monto" style="color: #1A1A1A;">$${parseFloat(factura.monto).toFixed(2)}</div>
        `;
        contenedorPendientes.appendChild(div);
      }
    });

    montoGranTotal.textContent = `$${totalAcumulado.toFixed(2)}`;
  });
}

// ENVIAR UN REGISTRO DE PAGO A LA NUBE
if (formularioPago) {
  formularioPago.addEventListener('submit', (e) => {
    e.preventDefault();

    const inputMontoPago = document.getElementById('monto-pago');
    const inputReferencia = document.getElementById('referencia-pago');

    if (!inputMontoPago || !inputReferencia) return;

    const nuevoPago = {
      monto: parseFloat(inputMontoPago.value),
      referencia: inputReferencia.value.trim(),
      fecha: new Date().toLocaleDateString(),
      estado: 'comprobando'
    };

    if (isNaN(nuevoPago.monto) || nuevoPago.nuevoPago <= 0 || !nuevoPago.referencia) {
      alert("Por favor, introduce un monto válido y el número de referencia del pago.");
      return;
    }

    push(ref(db, 'pagos'), nuevoPago)
      .then(() => {
        alert("¡Pago registrado con éxito! Pendiente por aprobación del fiador.");
        if (overlayPago) overlayPago.classList.add('oculto');
        formularioPago.reset();
      })
      .catch((error) => {
        console.error("Error al registrar el pago: ", error);
        alert("No se pudo conectar con la nube para subir el pago.");
      });
  });
}
