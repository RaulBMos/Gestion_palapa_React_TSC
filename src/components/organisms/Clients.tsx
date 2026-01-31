import React, { useState } from 'react';
import { Client } from '@/types';
import { Mail, Phone, User, Plus, Pencil, Trash2, X } from 'lucide-react';
import { useData } from '@/hooks/useData';

interface ClientsProps {
  clients?: Client[];
  addClient?: (c: Client) => void;
  editClient?: (c: Client) => void;
  deleteClient?: (id: string) => void;
}

export const Clients: React.FC<ClientsProps> = (_props) => {
  // ✅ Obtener datos del contexto (o usar props si se proporcionan para retrocompatibilidad)
  const contextData = useData();

  const clients = _props.clients ?? contextData.clients;
  const addClient = _props.addClient ?? contextData.addClient;
  const editClient = _props.editClient ?? contextData.updateClient;
  const deleteClient = _props.deleteClient ?? contextData.deleteClient;
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newClient, setNewClient] = useState<Partial<Client>>({});
  const [error, setError] = useState<string | null>(null);

  const validateClient = (client: Partial<Client>): { isValid: boolean; emailError?: string; phoneError?: string } => {
    const emailError = client.email ? (editingId
      ? clients.some(c => c.id !== editingId && c.email.toLowerCase().trim() === client.email!.toLowerCase().trim())
        ? 'Ya existe otro cliente con este email'
        : undefined
      : clients.some(c => c.email.toLowerCase().trim() === client.email!.toLowerCase().trim())
        ? 'Ya existe un cliente con este email'
        : undefined
    ) : undefined;

    const phoneError = client.phone && client.phone.trim() ? (editingId
      ? clients.some(c => c.id !== editingId && c.phone && c.phone.trim() === client.phone!.trim())
        ? 'Ya existe otro cliente con este teléfono'
        : undefined
      : clients.some(c => c.phone && c.phone.trim() === client.phone!.trim())
        ? 'Ya existe un cliente con este teléfono'
        : undefined
    ) : undefined;

    return {
      isValid: !emailError && !phoneError,
      ...(emailError && { emailError }),
      ...(phoneError && { phoneError })
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newClient.name && newClient.email) {
      const validation = validateClient(newClient);
      if (!validation.isValid) {
        setError(validation.emailError || validation.phoneError || 'Error de validación');
        return;
      }

      const clientData: Client = {
        id: editingId || Date.now().toString(),
        name: newClient.name.trim(),
        email: newClient.email.trim().toLowerCase(),
        phone: newClient.phone ? newClient.phone.trim() : '',
        notes: newClient.notes ? newClient.notes.trim() : ''
      };

      if (editingId) {
        if (editClient) editClient(clientData);
      } else {
        if (addClient) addClient(clientData);
      }

      setShowForm(false);
      setEditingId(null);
      setNewClient({});
      setError(null);
    }
  };

  const handleEdit = (client: Client) => {
    setNewClient(client);
    setEditingId(client.id);
    setShowForm(true);
    setError(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este cliente?') && deleteClient) {
      deleteClient(id);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Directorio de Clientes</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl shadow-lg shadow-indigo-200 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clients.map(client => (
          <div key={client.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative group">
            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleEdit(client)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                title="Editar cliente"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(client.id)}
                className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors"
                title="Eliminar cliente"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-indigo-50 p-3 rounded-full">
                <User className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 text-lg">{client.name}</h3>
                <div className="space-y-1 mt-2">
                  <div className="flex items-center text-slate-500 text-sm">
                    <Mail className="w-4 h-4 mr-2" />
                    {client.email}
                  </div>
                  <div className="flex items-center text-slate-500 text-sm">
                    <Phone className="w-4 h-4 mr-2" />
                    {client.phone || 'Sin teléfono'}
                  </div>
                  {client.notes && (
                    <div className="text-slate-400 text-xs italic mt-2">
                      {client.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900">
                {editingId ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setNewClient({});
                  setError(null);
                }}
                className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                placeholder="Nombre completo"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                value={newClient.name || ''}
                onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                required
              />
              <input
                placeholder="Email"
                type="email"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                value={newClient.email || ''}
                onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                required
              />
              {(() => {
                const validation = validateClient(newClient);
                if (validation.emailError) {
                  return <p className="text-red-500 text-xs mt-1">⚠️ {validation.emailError}</p>;
                }
                return null;
              })()}
              <input
                placeholder="Teléfono"
                type="tel"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                value={newClient.phone || ''}
                onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
              />
              {(() => {
                const validation = validateClient(newClient);
                if (validation.phoneError) {
                  return <p className="text-red-500 text-xs mt-1">⚠️ {validation.phoneError}</p>;
                }
                return null;
              })()}
              <textarea
                placeholder="Notas"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl h-24"
                value={newClient.notes || ''}
                onChange={e => setNewClient({ ...newClient, notes: e.target.value })}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setNewClient({});
                    setError(null);
                  }}
                  className="flex-1 py-3 text-slate-500"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold">
                  {editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};