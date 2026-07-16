import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { PageLoader } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import InvoiceTemplate from '../components/invoice/InvoiceTemplate';
import { toastError } from '../services/toastService';

const InvoiceGenerated = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(location.state?.payment || null);
  const [loading, setLoading] = useState(!location.state?.payment);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const statePayment = location.state?.payment;
    const statePaymentId = statePayment?._id || statePayment?.id;

    if (statePayment && statePaymentId === id) {
      setPayment(statePayment);
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const fetchInvoice = async () => {
      try {
        const response = await api.get(`/payments/invoice-data/${id}`);
        if (!isMounted) return;

        const foundPayment = response.data?.payment;
        if (!foundPayment) {
          setError('Invoice not found.');
          setPayment(null);
          return;
        }

        setPayment(foundPayment);
        setError('');
      } catch (fetchError) {
        console.error('Error loading invoice', fetchError);
        if (isMounted) {
          setError('Failed to load invoice.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInvoice();

    return () => {
      isMounted = false;
    };
  }, [id, location.state]);

  const handlePrint = () => {
    window.print();
  };

  const downloadInvoice = async () => {
    try {
      const response = await api.get(`/payments/invoice/${id}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const invoiceNumber = payment?.invoice?.invoiceNumber || id;
      link.setAttribute('download', `invoice_${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error('Error downloading invoice', downloadError);
      toastError('Failed to download invoice');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="invoice-generated-page space-y-6">
      <div className="no-print flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Invoice Generated</h1>
          <p className="mt-2 text-gray-500">
            Preview the generated receipt, then print it or download the PDF copy.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/dashboard/payments')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Payments
          </Button>
          <Button variant="outline" onClick={downloadInvoice}>
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-medium">{error}</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate('/dashboard/payments')}>
            Return to Payments
          </Button>
        </div>
      ) : (
        <InvoiceTemplate payment={payment} />
      )}

      <style>{`
        @page {
          size: A4;
          margin: 12mm;
        }

        @media print {
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .dashboard-sidebar,
          .dashboard-mobile-header,
          .no-print {
            display: none !important;
          }

          .dashboard-shell {
            display: block !important;
            background: #ffffff !important;
          }

          .dashboard-main {
            height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
          }

          .dashboard-content-inner {
            padding: 0 !important;
          }

          .invoice-generated-page {
            margin: 0 !important;
            padding: 0 !important;
          }

          .invoice-sheet {
            max-width: none !important;
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
          }

          .invoice-sheet,
          .invoice-sheet * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .invoice-row,
          .invoice-section {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceGenerated;
