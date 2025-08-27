// script.js
// Funciones para manejar el catálogo de clientes
// Autor: Daniel Meza
// Fecha: 25/08/2025

// script.js - VERSIÓN COMPLETA Y CORREGIDA
const API_URL = 'http://localhost:3000/api';

// Event listener principal
document.addEventListener('DOMContentLoaded', function() {
    cargarClientes();
    
    // Event listeners
    document.getElementById('guardarCliente').addEventListener('click', guardarCliente);
    document.getElementById('agregarDireccion').addEventListener('click', agregarDireccion);
    
    // Prevenir envío del formulario al presionar Enter
    document.getElementById('clienteForm').addEventListener('submit', function(event) {
        event.preventDefault();
        guardarCliente();
    });
});

// Inicializar modal
const clienteModal = document.getElementById('clienteModal');
clienteModal.addEventListener('hidden.bs.modal', function() {
    document.getElementById('clienteForm').reset();
    document.getElementById('direccionesContainer').innerHTML = '';
    document.getElementById('clienteId').value = '';
    document.getElementById('modalTitle').textContent = 'Nuevo Cliente';
});

// Función para cargar clientes
async function cargarClientes() {
    try {
        console.log('Cargando clientes desde:', API_URL + '/clientes');
        const response = await fetch(`${API_URL}/clientes`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const clientes = await response.json();
        console.log('Clientes recibidos:', clientes);
        
        const clientesList = document.getElementById('clientesList');
        clientesList.innerHTML = '';
        
        if (!clientes || clientes.length === 0) {
            clientesList.innerHTML = '<div class="col-12"><p class="text-center">No hay clientes registrados</p></div>';
            return;
        }
        
        clientes.forEach(cliente => {
            // Manejar direcciones correctamente
            let direccionesHTML = '<p>No hay direcciones registradas</p>';
            
            if (cliente.Direcciones && cliente.Direcciones.length > 0) {
                direccionesHTML = cliente.Direcciones.map(dir => 
                    `<div class="direccion-item">${dir.Calle}, ${dir.Colonia}</div>`
                ).join('');
            }
            
            const clienteCard = `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">${cliente.Nombre || 'Sin nombre'}</h5>
                            <h6 class="card-subtitle mb-2 text-muted">${cliente.NumeroCliente || 'Sin número'}</h6>
                            <p class="card-text">
                                <strong>Teléfono:</strong> ${cliente.Telefono || 'N/A'}<br>
                                <strong>Email:</strong> ${cliente.Email || 'N/A'}
                            </p>
                            <div class="direcciones">
                                <strong>Direcciones:</strong>
                                ${direccionesHTML}
                            </div>
                            <div class="mt-3">
                                <button class="btn btn-sm btn-warning btn-action" onclick="editarCliente(${cliente.ID})">Editar</button>
                                <button class="btn btn-sm btn-danger btn-action" onclick="eliminarCliente(${cliente.ID})">Eliminar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            clientesList.innerHTML += clienteCard;
        });
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        const clientesList = document.getElementById('clientesList');
        clientesList.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">Error al cargar clientes: ${error.message}</div>
            </div>
        `;
    }
}

// Función para agregar campo de dirección
function agregarDireccion() {
    const direccionesContainer = document.getElementById('direccionesContainer');
    const direccionCount = direccionesContainer.children.length;
    
    const direccionHTML = `
        <div class="direccion-item mb-3 p-3 border rounded">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0">Dirección ${direccionCount + 1}</h6>
                <button type="button" class="btn btn-sm btn-danger" onclick="removerDireccion(this)">Eliminar</button>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <label class="form-label">Calle *</label>
                    <input type="text" class="form-control calle" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Colonia *</label>
                    <input type="text" class="form-control colonia" required>
                </div>
            </div>
        </div>
    `;
    
    direccionesContainer.innerHTML += direccionHTML;
}

// Función para remover dirección
function removerDireccion(button) {
    button.closest('.direccion-item').remove();
}

// Función para guardar cliente (crear o actualizar) - VERSIÓN CORREGIDA
async function guardarCliente(event) {
    if (event) event.preventDefault();
    
    const clienteId = document.getElementById('clienteId').value;
    const nombre = document.getElementById('nombre').value;
    const telefono = document.getElementById('telefono').value;
    const numeroCliente = document.getElementById('numeroCliente').value;
    const email = document.getElementById('email').value;
    
    // Validaciones básicas
    if (!nombre || !numeroCliente) {
        alert('Nombre y Número de Cliente son obligatorios');
        return;
    }
    
    // Recoger direcciones - CÓDIGO CORREGIDO
    const direcciones = [];
    const direccionItems = document.querySelectorAll('.direccion-item');
    
    console.log('Número de elementos .direccion-item:', direccionItems.length);
    
    direccionItems.forEach((item, index) => {
        const calleInput = item.querySelector('.calle');
        const coloniaInput = item.querySelector('.colonia');
        
        console.log(`Dirección ${index + 1}:`);
        console.log(' - Elemento .calle:', calleInput);
        console.log(' - Elemento .colonia:', coloniaInput);
        
        if (calleInput && coloniaInput) {
            const calle = calleInput.value;
            const colonia = coloniaInput.value;
            
            if (calle && colonia) {
                direcciones.push({ calle, colonia });
            }
        }
    });
    
    // Preparar datos del cliente
    const clienteData = {
        nombre,
        telefono: telefono || '',
        numeroCliente,
        email: email || '',
        direcciones
    };
    
    console.log('Datos a enviar:', clienteData);
    
    try {
        let response;
        if (clienteId) {
            // Actualizar cliente existente
            response = await fetch(`${API_URL}/clientes/${clienteId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(clienteData)
            });
        } else {
            // Crear nuevo cliente
            response = await fetch(`${API_URL}/clientes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(clienteData)
            });
        }
        
        if (response.ok) {
            // Cerrar modal y recargar lista
            const modalElement = document.getElementById('clienteModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }
            
            cargarClientes();
            alert(clienteId ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente');
        } else {
            const errorText = await response.text();
            console.error('Error del servidor:', errorText);
            alert('Error al guardar el cliente: ' + errorText);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar el cliente: ' + error.message);
    }
}

// Función para editar cliente
async function editarCliente(id) {
    try {
        const response = await fetch(`${API_URL}/clientes/${id}`);
        if (!response.ok) {
            throw new Error('Error al obtener cliente');
        }
        
        const cliente = await response.json();
        
        // Llenar el formulario con los datos del cliente
        document.getElementById('clienteId').value = cliente.ID;
        document.getElementById('nombre').value = cliente.Nombre;
        document.getElementById('telefono').value = cliente.Telefono || '';
        document.getElementById('numeroCliente').value = cliente.NumeroCliente;
        document.getElementById('email').value = cliente.Email || '';
        document.getElementById('modalTitle').textContent = 'Editar Cliente';
        
        // Limpiar y llenar direcciones
        const direccionesContainer = document.getElementById('direccionesContainer');
        direccionesContainer.innerHTML = '';
        
        if (cliente.Direcciones && cliente.Direcciones.length > 0) {
            cliente.Direcciones.forEach(direccion => {
                agregarDireccion();
                const lastItem = direccionesContainer.lastElementChild;
                if (lastItem) {
                    const calleInput = lastItem.querySelector('.calle');
                    const coloniaInput = lastItem.querySelector('.colonia');
                    if (calleInput && coloniaInput) {
                        calleInput.value = direccion.Calle;
                        coloniaInput.value = direccion.Colonia;
                    }
                }
            });
        }
        
        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('clienteModal'));
        modal.show();
    } catch (error) {
        console.error('Error al cargar cliente para editar:', error);
        alert('Error al cargar datos del cliente: ' + error.message);
    }
}

// Función para eliminar cliente
async function eliminarCliente(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/clientes/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            cargarClientes();
            alert('Cliente eliminado correctamente');
        } else {
            const errorData = await response.json();
            alert('Error al eliminar el cliente: ' + (errorData.error || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        alert('Error al eliminar el cliente: ' + error.message);
    }
}

// Función para debug
async function debugAPI() {
    try {
        const response = await fetch(`${API_URL}/clientes`);
        const data = await response.json();
        console.log('DEBUG - Respuesta API:', data);
        return data;
    } catch (error) {
        console.error('DEBUG - Error API:', error);
    }
}