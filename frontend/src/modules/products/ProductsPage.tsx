import React, { useState, useRef } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { useCategories, useBrands } from '../../hooks/useCategoriesBrands';
import { Table } from '../../components/ui/Table';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Search } from '../../components/ui/Search';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { Plus, Edit2, Trash2, Package, Image, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { productApi } from '../../services/api';

export const ProductsPage: React.FC = () => {
  const { products, isLoading, createProduct, updateProduct, deleteProduct } = useProducts();
  const { categories } = useCategories();
  const { brands } = useBrands();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemsPerPage = 10;

  const productList = Array.isArray(products) ? products : [];
  const categoryList = Array.isArray(categories) ? categories : [];
  const brandList = Array.isArray(brands) ? brands : [];

  const filteredProducts = productList.filter((p: any) => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || p.categoryId === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleCreate = async (formData: FormData) => {
    try {
      await createProduct(formData);
      toast.success('Producto creado');
      setShowModal(false);
      setImageFile(null);
      setImagePreview(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al crear producto');
    }
  };

  const handleUpdate = async (formData: FormData) => {
    try {
      await updateProduct({ id: editingProduct.id, data: formData });
      toast.success('Producto actualizado');
      setShowModal(false);
      setEditingProduct(null);
      setImageFile(null);
      setImagePreview(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al actualizar');
    }
  };

  const handleDeleteClick = (product: any) => {
    setProductToDelete(product.id);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    try {
      await deleteProduct(productToDelete);
      toast.success('Producto eliminado');
      setShowDeleteDialog(false);
      setProductToDelete('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al eliminar');
    }
  };

  const handleToggle = async (productId: string, currentActive: boolean) => {
    setIsToggling(productId);
    try {
      await productApi.toggle(productId);
      toast.success(currentActive ? 'Producto deshabilitado' : 'Producto habilitado');
      window.location.reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al cambiar estado');
    } finally {
      setIsToggling(null);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no debe superar 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const getImageUrl = (imagePrimary: string | null | undefined) => {
    if (!imagePrimary) return null;
    const filename = imagePrimary.split('/').pop();
    return `/images/${filename}`;
  };

  const columns = [
    { key: 'image', label: 'Imagen' },
    { key: 'name', label: 'Producto' },
    { key: 'sku', label: 'SKU' },
    { key: 'salePrice', label: 'Precio' },
    { key: 'stock', label: 'Stock' },
    { key: 'active', label: 'Estado' },
    { key: 'actions', label: '' },
  ];

  const renderRow = (product: any, index: number) => {
    const imageUrl = getImageUrl(product.imagePrimary);
    return (
      <tr key={product.id || index} className="hover:bg-gray-800/50 transition-colors">
        <td className="py-3 px-4">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-10 h-10 rounded-lg object-cover bg-gray-800"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
              <Package size={16} className="text-gray-500" />
            </div>
          )}
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
              <Package size={14} className="text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{product.name}</p>
              <p className="text-xs text-gray-500">{product.barcode || product.sku}</p>
            </div>
          </div>
        </td>
        <td className="py-3 px-4 text-sm text-gray-400">{product.sku}</td>
        <td className="py-3 px-4 text-sm text-white">${Number(product.salePrice || 0).toFixed(2)}</td>
        <td className="py-3 px-4">
          <span className={`text-sm ${product.stock <= (product.stockMin || 1) ? 'text-red-400' : 'text-gray-300'}`}>
            {product.stock}
          </span>
        </td>
        <td className="py-3 px-4">
          <button
            onClick={() => handleToggle(product.id, product.active)}
            disabled={isToggling === product.id}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {product.active ? (
              <ToggleRight size={24} className="text-green-400" />
            ) : (
              <ToggleLeft size={24} className="text-gray-500" />
            )}
            <span className={`text-xs ${product.active ? 'text-green-400' : 'text-gray-500'}`}>
              {product.active ? 'Activo' : 'Inactivo'}
            </span>
          </button>
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setEditingProduct(product); setShowModal(true); }}
              className="p-1.5 hover:bg-gray-800 rounded transition-colors"
            >
              <Edit2 size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => handleDeleteClick(product)}
              className="p-1.5 hover:bg-red-900/30 rounded transition-colors"
            >
              <Trash2 size={14} className="text-red-400" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Productos</h2>
          <p className="text-gray-400 text-sm">Gestiona el catalogo de productos</p>
        </div>
        <Button onClick={() => { setEditingProduct(null); setShowModal(true); }}>
          <Plus size={16} className="mr-2" /> Nuevo Producto
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Search value={searchQuery} onChange={setSearchQuery} placeholder="Buscar productos..." className="w-64" />
        <Select
          options={[{ value: '', label: 'Todas las categorias' }, ...categoryList.map((c: any) => ({ value: c.id, label: c.name }))]}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-48"
        />
      </div>

      <Card padding="none">
        <Table
          headers={columns}
          data={paginatedProducts}
          renderRow={renderRow}
          loading={isLoading}
          emptyMessage="No se encontraron productos"
        />
        <div className="p-4 border-t border-gray-800 flex items-center justify-between">
          <p className="text-sm text-gray-400">{filteredProducts.length} productos</p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-400">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingProduct(null); setImageFile(null); setImagePreview(null); }}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        size="lg"
      >
        <ProductForm
          product={editingProduct}
          categories={categoryList}
          brands={brandList}
          imagePreview={imagePreview}
          imageFile={imageFile}
          onImageChange={handleImageChange}
          onSubmit={editingProduct ? handleUpdate : handleCreate}
          onClose={() => { setShowModal(false); setEditingProduct(null); setImageFile(null); setImagePreview(null); }}
        />
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Eliminar Producto"
        message="Esta seguro de que desea eliminar este producto? Esta accion no se puede deshacer."
        confirmLabel="Eliminar"
      />
    </div>
  );
};

interface ProductFormProps {
  product: any;
  categories: any[];
  brands: any[];
  imagePreview: string | null;
  imageFile: File | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (data: FormData) => void;
  onClose: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({
  product,
  categories,
  brands,
  imagePreview,
  imageFile,
  onImageChange,
  onSubmit,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    description: product?.description || '',
    salePrice: product?.salePrice || '',
    purchasePrice: product?.purchasePrice || '',
    categoryId: product?.categoryId || '',
    brandId: product?.brandId || '',
    stock: product?.stock || 0,
    stockMin: product?.stockMin || 1,
    barcode: product?.barcode || '',
  });

  const [localPreview, setLocalPreview] = useState<string | null>(
    product?.imagePrimary ? `/images/${product.imagePrimary.split('/').pop()}` : null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLocalImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no debe superar 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => setLocalPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
      onImageChange(e);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) { toast.error('La categoria es obligatoria'); return; }
    if (!formData.brandId) { toast.error('La marca es obligatoria'); return; }
    const fd = new FormData();
    fd.append('name', formData.name);
    if (formData.sku) fd.append('sku', formData.sku);
    fd.append('salePrice', String(parseFloat(formData.salePrice) || 0));
    fd.append('purchasePrice', String(parseFloat(formData.purchasePrice) || 0));
    fd.append('stock', String(parseInt(String(formData.stock)) || 0));
    fd.append('stockMin', String(parseInt(String(formData.stockMin)) || 1));
    fd.append('categoryId', formData.categoryId);
    fd.append('brandId', formData.brandId);
    if (formData.description) fd.append('description', formData.description);
    if (formData.barcode) fd.append('barcode', formData.barcode);
    if (imageFile) fd.append('image', imageFile);
    onSubmit(fd);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Nombre" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} required />
        <Input label="SKU" value={formData.sku} onChange={(e) => handleChange('sku', e.target.value)} />
        <Input label="Precio de venta" type="number" step="0.01" value={formData.salePrice} onChange={(e) => handleChange('salePrice', e.target.value)} required />
        <Input label="Precio de compra" type="number" step="0.01" value={formData.purchasePrice} onChange={(e) => handleChange('purchasePrice', e.target.value)} />
        <Input label="Stock" type="number" value={formData.stock} onChange={(e) => handleChange('stock', e.target.value)} required />
        <Input label="Stock Minimo" type="number" value={formData.stockMin} onChange={(e) => handleChange('stockMin', e.target.value)} />
      </div>
      <Input label="Descripcion" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} />
      <Input label="Codigo de barras" value={formData.barcode} onChange={(e) => handleChange('barcode', e.target.value)} />
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Categoria"
          options={[{ value: '', label: 'Seleccionar...' }, ...categories.map((c: any) => ({ value: c.id, label: c.name }))]}
          value={formData.categoryId}
          onChange={(e) => handleChange('categoryId', e.target.value)}
          required
        />
        <Select
          label="Marca"
          options={[{ value: '', label: 'Seleccionar...' }, ...brands.map((b: any) => ({ value: b.id, label: b.name }))]}
          value={formData.brandId}
          onChange={(e) => handleChange('brandId', e.target.value)}
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">Imagen del Producto</label>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-lg bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-700">
            {localPreview ? (
              <img src={localPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <Image size={24} className="text-gray-500" />
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLocalImageChange} className="hidden" />
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary text-sm flex items-center gap-1"
            >
              <Image size={14} /> {localPreview ? 'Cambiar imagen' : 'Subir imagen'}
            </button>
            <p className="text-xs text-gray-500">JPG, PNG o WEBP. Max 5MB.</p>
          </div>
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          {product ? 'Actualizar' : 'Crear'} Producto
        </Button>
      </div>
    </form>
  );
};
