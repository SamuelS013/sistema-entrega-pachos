import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push, onValue } from "firebase/database";

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

// Nodos del DOM
const contenedorFacturas = document.getElementById('contenedor-facturas');
const overlayFactura = document.getElementById('overlay-factura');
const btnGenerarFactura = document.getElementById('btn-generar-factura');
const btnCancelar = document.getElementById('btn-cancelar');
const formularioFactura = document.getElementById('formulario-factura');
const btnAgregarProducto = document.getElementById('btn-agregar-producto');
const listaProductosInputs = document.getElementById('lista-productos-inputs');
const lblMontoTotal = document.getElementById('monto-total-automatico');

const lblIdFactura = document.getElementById('factura-id-automatico');
const lblFechaFactura = document.getElementById('factura-fecha-automatica');

let idFacturaActual = "";

// Función para calcular el monto total sumando cada fila
function calcularTotalFactura() {
    let total = 0;
    const filas = listaProductosInputs.querySelectorAll('.fila-producto');
    filas.forEach(fila => {
        const cantidad = parseFloat(fila.querySelector('.prod-cantidad').value) || 0;
        const precio = parseFloat(fila.querySelector('.prod-precio').value) || 0;
        total += cantidad * precio;
    });
    lblMontoTotal.textContent = total.toFixed(2);
    return total;
}

// Escuchar cambios en los inputs de productos para actualizar el total al instante
listaProductosInputs.addEventListener('input', calcularTotalFactura);

// Botón añadir producto dinámico
if (btnAgregarProducto) {
    btnAgregarProducto.addEventListener('click', () => {
        const nuevaFila = document.createElement('div');
        nuevaFila.className = 'fila-producto';
        nuevaFila.style.display = 'flex';
        nuevaFila.style.gap = '10px';
        nuevaFila.style.margin-bottom = '10px';
        nuevaFila.innerHTML = `
            <input type="text" placeholder="Producto" class="prod-nombre" required style="flex: 2;">
            <input type="number" placeholder="Cant." class="prod-cantidad" min="1" value="1" required style="flex: 0.5;">
            <input type="number" placeholder="Precio U." class="prod-precio" min="0" step="0.01" required style="flex: 1;">
        `;
        listaProductosInputs.appendChild(nuevaFila);
    });
}

// Abrir formulario y setear ID de 4 dígitos y fecha al instante
if (btnGenerarFactura) {
    btnGenerarFactura.addEventListener('click', () => {
        // Genera un número aleatorio entre 1000 y 9999
        idFacturaActual = Math.floor(1000 + Math.random() * 9000).toString();
        const fechaHoy = new Date().toLocaleDateString();
        
        if (lblIdFactura) lblIdFactura.textContent = idFacturaActual;
        if (lblFechaFactura) lblFechaFactura.textContent = fechaHoy;
        
        lblMontoTotal.textContent = "0.00";
        if (overlayFactura) overlayFactura.classList.remove('oculto');
    });
}

if (btnCancelar) {
    btnCancelar.addEventListener('click', () => {
        if (overlayFactura) overlayFactura.classList.add('oculto');
        if (formularioFactura) {
            formularioFactura.reset();
            // Dejar solo la fila inicial de productos al limpiar
            listaProductosInputs.innerHTML = `
                <div class="fila-producto" style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <input type="text" placeholder="Producto" class="prod-nombre" required style="flex: 2;">
                    <input type="number" placeholder="Cant." class="prod-cantidad" min="1" value="1" required style="flex: 0.5;">
                    <input type="number" placeholder="Precio U." class="prod-precio" min="0" step="0.01" required style="flex: 1;">
                </div>
            `;
        }
    });
}

// Renderizar historial de facturas en tiempo real
if (contenedorFacturas) {
    onValue(ref(db, 'facturas'), (snapshot) => {
        contenedorFacturas.innerHTML = '';
        if (!snapshot.exists()) {
            contenedorFacturas.innerHTML = '<p class="alerta-vacio">No hay facturas registradas.</p>';
            return;
        }
        
        const datos = snapshot.val();
        Object.keys(datos).forEach(id => {
            const factura = datos[id];
            const div = document.createElement('div');
            div.className = 'tarjeta-factura';
            div.innerHTML = `
                <div class="factura-cabecera">
                    <span><strong>ID:</strong> ${factura.codigoCorto || id}</span>
                    <span>${factura.fecha}</span>
                </div>
                <div style="margin-bottom: 5px;"><strong>Deudor:</strong> ${factura.deudor}</div>
                <div class="factura-monto">$${parseFloat(factura.monto).toFixed(2)}</div>
            `;
            contenedorFacturas.appendChild(div);
        });
    });
}

// Guardar la factura usando el ID corto como llave principal en Firebase
if (formularioFactura) {
    formularioFactura.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputDeudor = document.getElementById('nombre-deudor');
        const montoFinal = calcularTotalFactura();
        
        if (!inputDeudor || montoFinal <= 0) {
            alert("Asegúrate de tener un deudor válido y productos con precio.");
            return;
        }
        
        const nuevaFactura = {
            codigoCorto: idFacturaActual,
            deudor: inputDeudor.value.trim(),
            monto: montoFinal,
            fecha: new Date().toLocaleDateString(),
            estado: 'pendiente'
        };
        
        // Guardamos directamente con la llave del código de 4 dígitos para ubicarlo fácil
        set(ref(db, `facturas/${idFacturaActual}`), nuevaFactura)
            .then(() => {
                if (overlayFactura) overlayFactura.classList.add('oculto');
                formularioFactura.reset();
                listaProductosInputs.innerHTML = `
                    <div class="fila-producto" style="display: flex; gap: 10px; margin-bottom: 10px;">
                        <input type="text" placeholder="Producto" class="prod-nombre" required style="flex: 2;">
                        <input type="number" placeholder="Cant." class="prod-cantidad" min="1" value="1" required style="flex: 0.5;">
                        <input type="number" placeholder="Precio U." class="prod-precio" min="0" step="0.01" required style="flex: 1;">
                    </div>
                `;
                alert(`Factura #${idFacturaActual} guardada exitosamente.`);
            })
            .catch((error) => {
                console.error(error);
                alert("Error al subir la factura.");
            });
    });
}
