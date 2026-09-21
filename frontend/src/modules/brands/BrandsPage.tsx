import React from 'react';
import { useBrands } from '../../hooks/useCategoriesBrands';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const BrandsPage: React.FC = () => {
  const { brands, isLoading, create, update, delete: deleteBrand } = useBrands();
  const [showModal, setShowModal] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<any>(null);
  const [deleteTarget, setDeleteTarget] = React.useState('');
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const handleSubmit = async (data: any) => {
    try {
      if (editingItem) {
        await update({ id: editingItem.id, data });
        toast.success('Marca actualizada');
      } else {
        await create(data);
        toast.success('Marca creada');
      }
      setShowModal(false);
      setEditingItem(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error');
    }
  };

  const columns = [
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripcion' },
    { key: 'actions', label: '' },
  ];

  const renderRow = (item: any, index: number) => (
    <tr key={item.id || index} className="hover:bg-gray-800/50 transition-colors">
      <td className="py-3 px-4 text-sm font-medium text-white">{item.name}</td>
      <td className="py-3 px-4 text-sm text-gray-400">{item.description || '-'}</td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1">
          <button onClick={() => { setEditingItem(item); setShowModal(true); }} className="p-1.5 hover:bg-gray-800 rounded"><Edit2 size={14} className="text-gray-400" /></button>
          <button onClick={() => { setDeleteTarget(item.id); setShowDeleteDialog(true); }} className="p-1.5 hover:bg-red-900/30 rounded"><Trash2 size={14} className="text-red-400" /></button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-white">Marcas</h2><p className="text-gray-400 text-sm">Gestiona las marcas</p></div>
        <Button onClick={() => { setEditingItem(null); setShowModal(true); }}><Plus size={16} className="mr-2" />Nueva Marca</Button>
      </div>
      <div className="card">
        <Table headers={columns} data={brands} renderRow={renderRow} loading={isLoading} emptyMessage="No hay marcas" />
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingItem(null); }} title={editingItem ? 'Editar Marca' : 'Nueva Marca'}>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit({ name: (e.target as any).name.value, description: (e.target as any).description.value }); }} className="space-y-4">
          <input name="name" defaultValue={editingItem?.name} className="input-field w-full" placeholder="Nombre" required />
          <textarea name="description" defaultValue={editingItem?.description} className="input-field w-full min-h-[80px]" placeholder="Descripcion" />
          <div className="flex gap-3 justify-end"><Button type="button" variant="secondary" onClick={() => { setShowModal(false); setEditingItem(null); }}>Cancelar</Button><Button type="submit">Guardar</Button></div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} onConfirm={() => { deleteBrand(deleteTarget); setShowDeleteDialog(false); }} title="Eliminar Marca" message="Esta seguro?" confirmLabel="Eliminar" />
    </div>
  );
};
