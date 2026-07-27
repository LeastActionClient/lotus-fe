import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { PageLoader } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import InvoiceTemplate from '../components/invoice/InvoiceTemplate';
import { toastError } from '../services/toastService';

const RECEIPT_PRINT_STYLES = `
  @page {
    size: A6 portrait;
    margin: 5mm;
  }

  @media print {
    html,
    body {
      background: #ffffff !important;
      margin: 0 !important;
      padding: 0 !important;
      height: auto !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .dashboard-sidebar,
    .dashboard-mobile-header,
    .no-print,
    .receipt-screen-controls {
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

    .dashboard-content-inner,
    .invoice-generated-page {
      padding: 0 !important;
      margin: 0 !important;
      background: #ffffff !important;
    }

    .receipt-preview-stage {
      padding: 0 !important;
    }

    .receipt-print-shell {
      width: 95mm !important;
      max-width: 95mm !important;
      margin: 0 auto !important;
      padding: 0 !important;
      background: transparent !important;
    }

    .receipt-page {
      width: 95mm !important;
      height: 138mm !important;
      margin: 0 !important;
      box-shadow: none !important;
      overflow: hidden !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .receipt-page,
    .receipt-page * {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`;

const InvoiceGenerated = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(location.state?.payment || null);
  const [loading, setLoading] = useState(!location.state?.payment);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const styleId = 'receipt-print-styles';
    let styleNode = document.getElementById(styleId);

    if (!styleNode) {
      styleNode = document.createElement('style');
      styleNode.id = styleId;
      styleNode.type = 'text/css';
      styleNode.appendChild(document.createTextNode(RECEIPT_PRINT_STYLES));
      document.head.appendChild(styleNode);
    }

    return () => {
      styleNode?.remove();
    };
  }, []);

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
    setDownloading(true);
    try {
      const response = await api.get(`/payments/invoice/${id}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const invoiceNumber = payment?.invoice?.invoiceNumber || id;
      const safeInvoiceNumber = String(invoiceNumber || id || 'invoice').replace(/[^a-zA-Z0-9._-]/g, '_');
      const safePaymentId = String(id || Date.now()).replace(/[^a-zA-Z0-9._-]/g, '_');
      link.setAttribute('download', `invoice_${safeInvoiceNumber}_${safePaymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error('Error downloading invoice', downloadError);
      toastError('Failed to download invoice');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="invoice-generated-page receipt-preview-stage space-y-6">
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
          <Button variant="outline" onClick={downloadInvoice} loading={downloading} loadingText="Downloading...">
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
    </div>
  );
};

export default InvoiceGenerated;
