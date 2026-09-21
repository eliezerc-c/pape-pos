import React from 'react';
import { useCategories } from '../../hooks/useCategoriesBrands';
import { Table } from '../../components/ui/Table';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const CategoriesPage: React.FC = () => {
  const { categories, isLoading, create, update, delete: deleteCategory } = useCategories();
  const [showModal, setShowModal] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<any>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<string>('');
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const handleSubmit = async (data: any) => {
    try {
      if (editingItem) {
        await update({ id: editingItem.id, data });
        toast.success('Categoría actualizada');
      } else {
        await create(data);
        toast.success('Categoría creada');
      }
      setShowModal(false);
      setEditingItem(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error');
    }
  };

  const handleDeleteClick = (item: any) => {
    setDeleteTarget(item.id);
    setShowDeleteDialog(true);
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
          <button onClick={() => handleDeleteClick(item)} className="p-1.5 hover:bg-red-900/30 rounded"><Trash2 size={14} className="text-red-400" /></button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-white">Categorías</h2><p className="text-gray-400 text-sm">Gestiona las categorías</p></div>
        <Button onClick={() => { setEditingItem(null); setShowModal(true); }}><Plus size={16} className="mr-2" />Nueva Categoría</Button>
      </div>
      <Card padding="none">
        <Table headers={columns} data={categories} renderRow={renderRow} loading={isLoading} emptyMessage="No hay categorías" />
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingItem(null); }} title={editingItem ? 'Editar' : 'Nueva'}>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit({ name: (e.target as any).name.value, slug: (e.target as any).slug.value, description: (e.target as any).description.value }); }} className="space-y-4">
          <input name="name" defaultValue={editingItem?.name} className="input-field w-full" placeholder="Nombre" required />
          <input name="slug" defaultValue={editingItem?.slug} className="input-field w-full" placeholder="Slug" required />
          <textarea name="description" defaultValue={editingItem?.description} className="input-field w-full min-h-[80px] resize-y" placeholder="Descripción" />
          <div className="flex gap-3 justify-end"><Button type="button" variant="secondary" onClick={() => { setShowModal(false); setEditingItem(null); }}>Cancelar</Button><Button type="submit">Guardar</Button></div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} onConfirm={() => { deleteCategory(deleteTarget); setShowDeleteDialog(false); }} title="Eliminar Categoría" message="¿Estás seguro?" confirmLabel="Eliminar" />
    </div>
  );
};
