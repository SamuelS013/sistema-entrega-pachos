import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyDnCB670iJyud6HcdKnYpgqrTlkbG950BM",
    authDomain: "sistema-entrega-pachos.firebaseapp.com",
    databaseURL: "https://sistema-entrega-pachos-default-rtdb.firebaseio.com",
    projectId: "sistema-entrega-pachos",
    storageBucket: "sistema-entrega-pachos.firebasestorage.app",
    messagingSenderId: "876518154698",
    appId: "1:876518154698:web:58eb635b6f650704362f33"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Captura de elementos
const montoGranTotal = document.getElementById('monto-gran-total');
const contenedorPendientes = document.getElementById('contenedor-facturas-pendientes');
const historialPagadas = document.getElementById('historial-pagadas');
const overlayPago = document.getElementById('overlay-pago');
const btnRegistrarPago = document.getElementById('btn-registrar-pago');
const btnCancelarPago = document.getElementById('btn-cancelar-pago');
const formularioPago = document.getElementById('formulario-pago');

// Lógica de apertura/cierre de modales
if (btnRegistrarPago) {
    btnRegistrarPago.addEventListener('click', () => {
        if (overlayPago) overlayPago.classList.remove('oculto');
    });
}

if (btnCancelarPago) {
    btnCancelarPago.addEventListener('click', () => {
        if (overlayPago) overlayPago.classList.add('oculto');
        if (formularioPago) formularioPago.reset();
    });
}

// Escuchar facturas y repartir en paneles correspondientes
if (montoGranTotal && contenedorPendientes && historialPagadas) {
    onValue(ref(db, 'facturas'), (snapshot) => {
        contenedorPendientes.innerHTML = '';
        historialPagadas.innerHTML = '';
        let totalAcumulado = 0;
        let tienePendientes = false;
        let tienePagadas = false;
        
        if (!snapshot.exists()) {
            montoGranTotal.textContent = "$0.00";
            contenedorPendientes.innerHTML = '<p class="alerta-vacio">No tienes facturas pendientes. ¡Estás al día!</p>';
            historialPagadas.innerHTML = '<p class="alerta-vacio">No hay registros de facturas pagadas aún.</p>';
            return;
        }
        
        const datos = snapshot.val();
        Object.keys(datos).forEach(id => {
            const factura = datos[id];
            const div = document.createElement('div');
            div.className = 'tarjeta-factura';
            
            div.innerHTML = `
                <div class="factura-cabecera">
                    <span><strong>ID Factura:</strong> ${factura.codigoCorto || id}</span>
                    <span>${factura.fecha}</span>
                </div>
                <div style="margin-bottom: 5px;"><strong>Concepto:</strong> Entrega de productos</div>
                <div class="factura-monto">$${parseFloat(factura.monto).toFixed(2)}</div>
            `;
            
            if (factura.estado === 'pendiente') {
                totalAcumulado += parseFloat(factura.monto);
                contenedorPendientes.appendChild(div);
                tienePendientes = true;
            } else if (factura.estado === 'pagada') {
                historialPagadas.appendChild(div);
                tienePagadas = true;
            }
        });
        
        montoGranTotal.textContent = `$${totalAcumulado.toFixed(2)}`;
        
        if (!tienePendientes) {
            contenedorPendientes.innerHTML = '<p class="alerta-vacio">¡Felicidades! No tienes facturas pendientes.</p>';
        }
        if (!tienePagadas) {
            historialPagadas.innerHTML = '<p class="alerta-vacio">No hay registros de facturas pagadas aún.</p>';
        }
    });
}

// Registrar transacciones de pago
if (formularioPago) {
    formularioPago.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputIdFactura = document.getElementById('pago-id-factura');
        const inputMontoPago = document.getElementById('monto-pago');
        const inputReferencia = document.getElementById('referencia-pago');
        
        if (!inputIdFactura || !inputMontoPago || !inputReferencia) return;
        
        const nuevoPago = {
            facturaId: inputIdFactura.value.trim(),
            monto: parseFloat(inputMontoPago.value),
            referencia: inputReferencia.value.trim(),
            fecha: new Date().toLocaleDateString(),
            estado: 'comprobando'
        };
        
        if (isNaN(nuevoPago.monto) || nuevoPago.monto <= 0 || !nuevoPago.referencia || !nuevoPago.facturaId) {
            alert("Por favor, introduce datos válidos.");
            return;
        }
        
        push(ref(db, 'pagos'), nuevoPago)
            .then(() => {
                alert("¡Pago registrado con éxito! Pendiente por aprobación del fiador.");
                if (overlayPago) overlayPago.classList.add('oculto');
                formularioPago.reset();
            })
            .catch((error) => {
                console.error(error);
                alert("No se pudo subir el comprobante del pago.");
            });
    });
}
