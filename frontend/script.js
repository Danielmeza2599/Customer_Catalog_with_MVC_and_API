// script.js
// Funciones para manejar el catálogo de clientes
// Autor: Daniel Meza
// Fecha: 25/08/2025

// URL base de la API
const API_URL = 'http://localhost:3000/api'; // Adaptar si la API está en otra URL

document.addEventListener('DOMContentLoaded', function() {
    cargarClientes();
    
    // Event listeners
    document.getElementById('guardarCliente').addEventListener('click', guardarCliente);
    document.getElementById('agregarDireccion').addEventListener('click', agregarDireccion);
    
    // Inicializar modal para evitar que guarde datos al cerrarse
    const clienteModal = document.getElementById('clienteModal');
    clienteModal.addEventListener('hidden.bs.modal', function() {
        document.getElementById('clienteForm').reset();
        document.getElementById('direccionesContainer').innerHTML = '';
        document.getElementById('clienteId').value = '';
        document.getElementById('modalTitle').textContent = 'Nuevo Cliente';
    });
});

// Función para cargar clientes
async function cargarClientes() {
    try {
        const response = await fetch(`${API_URL}/clientes`);
        const clientes = await response.json();
        
        const clientesList = document.getElementById('clientesList');
        clientesList.innerHTML = '';
        
        if (clientes.length === 0) {
            clientesList.innerHTML = '<div class="col-12"><p class="text-center">No hay clientes registrados</p></div>';
            return;
        }
        
        clientes.forEach(cliente => {
            const clienteCard = `
                <div class="col-md-6 col-lg-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${cliente.nombre}</h5>
                            <h6 class="card-subtitle mb-2 text-muted">${cliente.numeroCliente}</h6>
                            <p class="card-text">
                                <strong>Teléfono:</strong> ${cliente.telefono || 'N/A'}<br>
                                <strong>Email:</strong> ${cliente.email || 'N/A'}
                            </p>
                            <div class="direcciones">
                                <strong>Direcciones:</strong>
                                ${cliente.direcciones && cliente.direcciones.length > 0 ? 
                                    cliente.direcciones.map(dir => 
                                        `<div class="direccion-item">${dir.calle}, ${dir.colonia}</div>`
                                    ).join('') : 
                                    '<p>No hay direcciones registradas</p>'
                                }
                            </div>
                            <div class="mt-3">
                                <button class="btn btn-sm btn-warning btn-action" onclick="editarCliente(${cliente.id})">Editar</button>
                                <button class="btn btn-sm btn-danger btn-action" onclick="eliminarCliente(${cliente.id})">Eliminar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            clientesList.innerHTML += clienteCard;
        });
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        alert('Error al cargar clientes');
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

// Función para guardar cliente (crear o actualizar)
async function guardarCliente() {
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
    
    // Recoger direcciones
    const direcciones = [];
    const direccionItems = document.querySelectorAll('.direccion-item');
    
    direccionItems.forEach(item => {
        const calle = item.querySelector('.calle').value;
        const colonia = item.querySelector('.colonia').value;
        
        if (calle && colonia) {
            direcciones.push({ calle, colonia });
        }
    });
    
    // Preparar datos del cliente
    const clienteData = {
        nombre,
        telefono,
        numeroCliente,
        email,
        direcciones
    };
    
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
            const modal = bootstrap.Modal.getInstance(document.getElementById('clienteModal'));
            modal.hide();
            
            cargarClientes();
            alert(clienteId ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente');
        } else {
            alert('Error al guardar el cliente');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar el cliente');
    }
}

// Función para editar cliente
async function editarCliente(id) {
    try {
        const response = await fetch(`${API_URL}/clientes/${id}`);
        const cliente = await response.json();
        
        // Llenar el formulario con los datos del cliente
        document.getElementById('clienteId').value = cliente.id;
        document.getElementById('nombre').value = cliente.nombre;
        document.getElementById('telefono').value = cliente.telefono || '';
        document.getElementById('numeroCliente').value = cliente.numeroCliente;
        document.getElementById('email').value = cliente.email || '';
        document.getElementById('modalTitle').textContent = 'Editar Cliente';
        
        // Limpiar y llenar direcciones
        const direccionesContainer = document.getElementById('direccionesContainer');
        direccionesContainer.innerHTML = '';
        
        if (cliente.direcciones && cliente.direcciones.length > 0) {
            cliente.direcciones.forEach(direccion => {
                agregarDireccion();
                const lastItem = direccionesContainer.lastElementChild;
                lastItem.querySelector('.calle').value = direccion.calle;
                lastItem.querySelector('.colonia').value = direccion.colonia;
            });
        }
        
        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('clienteModal'));
        modal.show();
    } catch (error) {
        console.error('Error al cargar cliente para editar:', error);
        alert('Error al cargar datos del cliente');
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
            alert('Error al eliminar el cliente');
        }
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        alert('Error al eliminar el cliente');
    }
}