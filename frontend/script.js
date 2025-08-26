// script.js
// Funciones para manejar el catálogo de clientes
// Autor: Daniel Meza
// Fecha: 25/08/2025

// script.js - VERSIÓN CORREGIDA
const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function() {
    cargarClientes();
    
    // Event listeners
    document.getElementById('guardarCliente').addEventListener('click', guardarCliente);
    document.getElementById('agregarDireccion').addEventListener('click', agregarDireccion);
    
    // Inicializar modal
    const clienteModal = document.getElementById('clienteModal');
    clienteModal.addEventListener('hidden.bs.modal', function() {
        document.getElementById('clienteForm').reset();
        document.getElementById('direccionesContainer').innerHTML = '';
        document.getElementById('clienteId').value = '';
        document.getElementById('modalTitle').textContent = 'Nuevo Cliente';
    });
});

// Función para cargar clientes - CORREGIDA
async function cargarClientes() {
    try {
        const response = await fetch(`${API_URL}/clientes`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const clientes = await response.json();
        console.log('Clientes recibidos:', clientes); // Para debug
        
        const clientesList = document.getElementById('clientesList');
        clientesList.innerHTML = '';
        
        if (clientes.length === 0) {
            clientesList.innerHTML = '<div class="col-12"><p class="text-center">No hay clientes registrados</p></div>';
            return;
        }
        
        clientes.forEach(cliente => {
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
                                ${cliente.Direcciones && cliente.Direcciones.length > 0 ? 
                                    cliente.Direcciones.map(dir => 
                                        `<div class="direccion-item">${dir.Calle}, ${dir.Colonia}</div>`
                                    ).join('') : 
                                    '<p>No hay direcciones registradas</p>'
                                }
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
        alert('Error al cargar clientes. Revisa la consola para más detalles.');
    }
}