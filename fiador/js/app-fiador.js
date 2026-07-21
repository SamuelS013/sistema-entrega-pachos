import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, remove } from "firebase/database";

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

// 🟢 NUEVOS ELEMENTOS
const montoTotalAdeudado = document.getElementById('monto-total-adeudado');
const btnEliminarFacturasPagadas = document.getElementById('btn-eliminar-facturas-pagadas');
const btnEliminarPagos = document.getElementById('btn-eliminar-pagos');

let idFacturaActual = "";

// ==========================================
// 🟢 NUEVA FUNCIÓN: Eliminar todas las facturas pagadas
// ==========================================
if (btnEliminarFacturasPagadas) {
    btnEliminarFacturasPagadas.addEventListener('click', () => {
        const facturasRef = ref(db, 'facturas');
        
        onValue(facturasRef, (snapshot) => {
            if (!snapshot.exists()) {
                alert('No hay facturas para eliminar.');
                return;
            }
            
            const datos = snapshot.val();
            const idsPagadas = Object.keys(datos).filter(id => datos[id].estado === 'pagada');
            
            if (idsPagadas.length === 0) {
                alert('No hay facturas pagadas para eliminar.');
                return;
            }
            
            const confirmacion = confirm(
                '⚠️ ¿Estás seguro de que deseas eliminar TODAS las facturas pagadas?\n\n' +
                'Se eliminarán ' + idsPagadas.length + ' factura(s) pagada(s).\n' +
                'Las facturas pendientes NO serán afectadas.\n\n' +
                'Esta acción no se puede deshacer.'
            );
            
            if (!confirmacion) return;
            
            let eliminadas = 0;
            idsPagadas.forEach(id => {
                remove(ref(db, 'facturas/' + id))
                    .then(() => {
                        eliminadas++;
                        if (eliminadas === idsPagadas.length) {
                            alert('✅ Se eliminaron ' + eliminadas + ' factura(s) pagada(s) exitosamente.');
                        }
                    })
                    .catch((error) => {
                        console.error('Error al eliminar factura:', error);
                        alert('❌ Error al eliminar algunas facturas. Revisa la consola.');
                    });
            });
        }, { onlyOnce: true });
    });
}

// ==========================================
// 🟢 NUEVA FUNCIÓN: Eliminar todos los pagos
// ==========================================
if (btnEliminarPagos) {
    btnEliminarPagos.addEventListener('click', () => {
        const pagosRef = ref(db, 'pagos');
        
        onValue(pagosRef, (snapshot) => {
            if (!snapshot.exists()) {
                alert('No hay pagos para eliminar.');
                return;
            }
            
            const datos = snapshot.val();
            const idsPagos = Object.keys(datos);
            
            const confirmacion = confirm(
                '⚠️ ¿Estás seguro de que deseas eliminar TODOS los pagos registrados?\n\n' +
                'Se eliminarán ' + idsPagos.length + ' registro(s) de pago.\n\n' +
                '⚠️ IMPORTANTE: Esto NO afecta el saldo de las facturas.\n' +
                'Solo elimina el historial de pagos.\n\n' +
                'Esta acción no se puede deshacer.'
            );
            
            if (!confirmacion) return;
            
            let eliminados = 0;
            idsPagos.forEach(id => {
                remove(ref(db, 'pagos/' + id))
                    .then(() => {
                        eliminados++;
                        if (eliminados === idsPagos.length) {
                            alert('✅ Se eliminaron ' + eliminados + ' registro(s) de pago exitosamente.');
                        }
                    })
                    .catch((error) => {
                        console.error('Error al eliminar pago:', error);
                        alert('❌ Error al eliminar algunos pagos. Revisa la consola.');
                    });
            });
        }, { onlyOnce: true });
    });
}

// ==========================================
// Función para calcular el monto total sumando cada fila
// ==========================================
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

// Escuchar cambios en los inputs de productos de manera dinámica
listaProductosInputs.addEventListener('input', calcularTotalFactura);

// Botón añadir producto dinámico
if (btnAgregarProducto) {
  btnAgregarProducto.addEventListener('click', () => {
    const nuevaFila = document.createElement('div');
    nuevaFila.className = 'fila-producto';
    nuevaFila.style.display = 'flex';
    nuevaFila.style.gap = '10px';
    nuevaFila.style.marginBottom = '10px';
    nuevaFila.innerHTML = `
      <input type="text" placeholder="Producto" class="prod-nombre" required style="flex: 2;">
      <input type="number" placeholder="Cant." class="prod-cantidad" min="1" value="1" required style="flex: 0.5;">
      <input type="number" placeholder="Precio U." class="prod-precio" min="0" step="0.01" required style="flex: 1;">
    `;
    listaProductosInputs.appendChild(nuevaFila);
  });
}

// Abrir formulario y asignar ID de 4 dígitos y fecha
if (btnGenerarFactura) {
  btnGenerarFactura.addEventListener('click', () => {
    idFacturaActual = Math.floor(1000 + Math.random() * 9000).toString();
    const fechaHoy = new Date().toLocaleDateString();
    
    if (lblIdFactura) lblIdFactura.textContent = idFacturaActual;
    if (lblFechaFactura) lblFechaFactura.textContent = fechaHoy;
    lblMontoTotal.textContent = "0.00";
    
    if (overlayFactura) overlayFactura.classList.remove('oculto');
  });
}

// Cancelar/Cerrar Ventana
if (btnCancelar) {
  btnCancelar.addEventListener('click', () => {
    if (overlayFactura) overlayFactura.classList.add('oculto');
    resetearFormulario();
  });
}

function resetearFormulario() {
  if (formularioFactura) formularioFactura.reset();
  listaProductosInputs.innerHTML = `
    <div class="fila-producto" style="display: flex; gap: 10px; margin-bottom: 10px;">
      <input type="text" placeholder="Producto" class="prod-nombre" required style="flex: 2;">
      <input type="number" placeholder="Cant." class="prod-cantidad" min="1" value="1" required style="flex: 0.5;">
      <input type="number" placeholder="Precio U." class="prod-precio" min="0" step="0.01" required style="flex: 1;">
    </div>
  `;
  lblMontoTotal.textContent = "0.00";
}

// ==========================================
// Renderizar historial de facturas en tiempo real
// 🟢 MODIFICADO: Orden PILA + Cálculo total adeudado
// ==========================================
if (contenedorFacturas) {
  onValue(ref(db, 'facturas'), (snapshot) => {
    contenedorFacturas.innerHTML = '';
    let totalAdeudado = 0;

    if (!snapshot.exists()) {
      contenedorFacturas.innerHTML = '<p class="alerta-vacio">No hay facturas registradas en el historial.</p>';
      if (montoTotalAdeudado) montoTotalAdeudado.textContent = '$0.00';
      return;
    }
    
    const datos = snapshot.val();
    
    // 🟢 ORDENAR: Más recientes primero (PILA)
    const keys = Object.keys(datos);
    keys.sort((a, b) => {
      const fechaA = datos[a].fecha || '';
      const fechaB = datos[b].fecha || '';
      if (fechaA && fechaB) {
        const partesA = fechaA.split('/');
        const partesB = fechaB.split('/');
        const tsA = new Date(partesA[2], partesA[1] - 1, partesA[0]).getTime();
        const tsB = new Date(partesB[2], partesB[1] - 1, partesB[0]).getTime();
        return tsB - tsA;
      }
      return parseInt(b) - parseInt(a);
    });

    keys.forEach(id => {
      const factura = datos[id];
      const div = document.createElement('div');
      div.className = 'tarjeta-factura';
      
      const saldoRestante = parseFloat(factura.saldoRestante ?? factura.monto);
      
      // 🟢 Calcular total adeudado (solo pendientes)
      if (factura.estado === 'pendiente') {
        totalAdeudado += saldoRestante;
      }
      
      const botonAnular = factura.estado !== 'pagada' 
        ? '<button class="btn-anular-historial" data-id="' + id + '">Anular Factura</button>' 
        : '';

      div.innerHTML = `
        <div class="factura-cabecera">
          <span><strong>ID:</strong> ${factura.codigoCorto || id}</span>
          <span>${factura.fecha}</span>
        </div>
        <div style="margin-bottom: 5px;"><strong>Deudor:</strong> ${factura.deudor}</div>
        <div class="factura-monto">$${parseFloat(factura.monto).toFixed(2)}</div>
        <div style="font-size: 12px; margin-top: 5px;"><strong>Estado:</strong> ${factura.estado.toUpperCase()} | <strong>Restante:</strong> $${saldoRestante.toFixed(2)}</div>
        ${botonAnular}
      `;
      contenedorFacturas.appendChild(div);
    });

    // 🟢 Actualizar el total adeudado
    if (montoTotalAdeudado) {
      montoTotalAdeudado.textContent = '$' + totalAdeudado.toFixed(2);
    }

    // Asignar eventos a los botones de anular agregados dinámicamente
    document.querySelectorAll('.btn-anular-historial').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idAnular = e.target.getAttribute('data-id');
        if (confirm('¿Estás seguro de que deseas anular la factura #' + idAnular + '?')) {
          remove(ref(db, 'facturas/' + idAnular))
            .then(() => alert('Factura anulada exitosamente.'))
            .catch(() => alert('Error al anular la factura.'));
        }
      });
    });
  });
}

// ==========================================
// Escuchar y listar los Pagos Recibidos
// 🟢 MODIFICADO: Orden PILA (más recientes arriba)
// ==========================================
const historialPagos = document.getElementById('historial-pagos');
if (historialPagos) {
  onValue(ref(db, 'pagos'), (snapshot) => {
    historialPagos.innerHTML = '';
    if (!snapshot.exists()) {
      historialPagos.innerHTML = '<p class="alerta-vacio">No se han recibido notificaciones de pago.</p>';
      return;
    }
    const pagos = snapshot.val();
    
    // 🟢 ORDENAR: Más recientes primero (PILA)
    const keys = Object.keys(pagos);
    keys.sort((a, b) => {
      const fechaA = pagos[a].fecha || '';
      const fechaB = pagos[b].fecha || '';
      if (fechaA && fechaB) {
        const tsA = new Date(fechaA).getTime();
        const tsB = new Date(fechaB).getTime();
        if (!isNaN(tsA) && !isNaN(tsB)) {
          return tsB - tsA;
        }
      }
      return parseInt(b) - parseInt(a);
    });

    keys.forEach(key => {
      const p = pagos[key];
      const div = document.createElement('div');
      div.className = 'tarjeta-factura';
      div.style.borderLeft = "5px solid #FF7A00";
      div.innerHTML = `
        <div class="factura-cabecera">
          <span><strong>Factura Ref:</strong> ${p.facturaId}</span>
          <span>${p.fecha}</span>
        </div>
        <div><strong>Monto Abonado:</strong> $${parseFloat(p.monto).toFixed(2)}</div>
        <div style="font-size:12px; color:#555;"><strong>Detalle:</strong> ${p.referencia} (${p.tipoPago})</div>
      `;
      historialPagos.appendChild(div);
    });
  });
}

// ==========================================
// Guardar la factura estructurada con productos y saldo restante
// ==========================================
if (formularioFactura) {
  formularioFactura.addEventListener('submit', (e) => {
    e.preventDefault();
    const inputDeudor = document.getElementById('nombre-deudor');
    const montoFinal = calcularTotalFactura();
    
    if (!inputDeudor || inputDeudor.value.trim() === "" || montoFinal <= 0) {
      alert("Asegúrate de tener un deudor válido y productos con precio.");
      return;
    }

    const productosArr = [];
    listaProductosInputs.querySelectorAll('.fila-producto').forEach(fila => {
      productosArr.push({
        nombre: fila.querySelector('.prod-nombre').value.trim(),
        cantidad: parseInt(fila.querySelector('.prod-cantidad').value) || 1,
        precioUnitario: parseFloat(fila.querySelector('.prod-precio').value) || 0
      });
    });

    const nuevaFactura = {
      codigoCorto: idFacturaActual,
      deudor: inputDeudor.value.trim(),
      monto: montoFinal,
      saldoRestante: montoFinal,
      fecha: new Date().toLocaleDateString(),
      estado: 'pendiente',
      productos: productosArr
    };

    set(ref(db, 'facturas/' + idFacturaActual), nuevaFactura)
      .then(() => {
        if (overlayFactura) overlayFactura.classList.add('oculto');
        alert('Factura #' + idFacturaActual + ' guardada exitosamente.');
        resetearFormulario();
      })
      .catch((error) => {
        console.error(error);
        alert("Error al subir la factura.");
      });
  });
}
