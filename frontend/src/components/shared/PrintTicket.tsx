import React from 'react';
import { jsPDF } from 'jspdf';
import { usePOS } from '../../hooks/usePOS';
import { useAuthStore } from '../../stores/authStore';
import { format } from 'date-fns';

export const PrintTicket: React.FC = () => {
  const { lastSale, receiptRef } = usePOS();
  const { user } = useAuthStore();

  const generatePDF = () => {
    if (!lastSale) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.setTextColor(59, 130, 246);
    doc.text('PAPELERÍA POS', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Ticket #${lastSale.saleNumber}`, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Fecha: ${format(new Date(lastSale.createdAt), 'dd/MM/yyyy HH:mm')}`, pageWidth / 2, 34, { align: 'center' });
    doc.text(`Cajero: ${user?.name || 'N/A'}`, pageWidth / 2, 40, { align: 'center' });

    let yPos = 50;
    doc.setDrawColor(200);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;

    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text('Artículo', 20, yPos);
    doc.text('Cant.', pageWidth - 40, yPos, { align: 'right' });
    doc.text('Precio', pageWidth - 20, yPos, { align: 'right' });
    yPos += 15;

    lastSale.items.forEach((item) => {
      doc.text(item.productName.substring(0, 25), 20, yPos);
      doc.text(String(item.quantity), pageWidth - 40, yPos, { align: 'right' });
      doc.text(`$${item.unitPrice.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
      yPos += 12;
    });

    yPos += 5;
    doc.setDrawColor(200);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 15;

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('Subtotal:', pageWidth - 60, yPos);
    doc.text(`$${lastSale.subtotal.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
    yPos += 10;
    if (Number(lastSale.tax || 0) > 0) {
      doc.text(`Impuesto:`, pageWidth - 60, yPos);
      doc.text(`$${Number(lastSale.tax).toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
      yPos += 10;
    }
    doc.setFont('bold');
    doc.text('Total:', pageWidth - 60, yPos);
    doc.text(`$${lastSale.total.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
    yPos += 15;

    doc.text(`Método de pago: ${lastSale.paymentMethod}`, 20, yPos);
    if (lastSale.change > 0) {
      yPos += 10;
      doc.text(`Cambio: $${lastSale.change.toFixed(2)}`, 20, yPos);
    }
    yPos += 15;
    doc.setFontSize(7);
    doc.setTextColor(128, 128, 128);
    doc.text('¡Gracias por su compra!', pageWidth / 2, yPos + 10, { align: 'center' });

    doc.save(`ticket-${lastSale.saleNumber}.pdf`);
  };

  if (!lastSale) return null;

  return (
    <div className="hidden print:block" ref={receiptRef}>
      <div className="bg-white text-black p-8 max-w-sm mx-auto">
        <h1 className="text-xl font-bold text-center">PAPELERÍA POS</h1>
        <p className="text-xs text-center text-gray-500">Ticket #{lastSale.saleNumber}</p>
        <p className="text-xs text-center text-gray-500">{format(new Date(lastSale.createdAt), 'dd/MM/yyyy HH:mm')}</p>
        <table className="w-full text-sm mt-4">
          <thead>
            <tr className="border-b">
              <th className="text-left">Producto</th>
              <th className="text-right">Cant.</th>
              <th className="text-right">Precio</th>
            </tr>
          </thead>
          <tbody>
            {lastSale.items.map((item) => (
              <tr key={item.id} className="border-b">
                <td>{item.productName}</td>
                <td className="text-right">{item.quantity}</td>
                <td className="text-right">${item.unitPrice.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 text-right">
          <p>Subtotal: ${lastSale.subtotal.toFixed(2)}</p>
          {Number(lastSale.tax || 0) > 0 && <p>Impuesto: ${Number(lastSale.tax).toFixed(2)}</p>}
          <p className="font-bold">Total: ${lastSale.total.toFixed(2)}</p>
          <p>Método: {lastSale.paymentMethod}</p>
        </div>
      </div>
      <button onClick={generatePDF} className="print:hidden btn-primary mt-4">
        Imprimir Ticket
      </button>
    </div>
  );
};
