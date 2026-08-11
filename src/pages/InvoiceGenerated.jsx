import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { PageLoader } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Copy, Download, Printer, Trash2 } from 'lucide-react';
import WhatsAppIcon from '../components/ui/WhatsAppIcon';
import InvoiceTemplate from '../components/invoice/InvoiceTemplate';
import { toastError, toastInfo, toastSuccess } from '../services/toastService';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { useQueryInvalidator } from '../hooks/useSchoolQueries';
import { getStoredUser } from '../utils/auth';

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
      height: auto !important;
      overflow: visible !important;
      background: #ffffff !important;
    }

    .dashboard-shell > div {
      display: block !important;
      height: auto !important;
      overflow: visible !important;
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

    .receipt-document {
      display: block !important;
      gap: 0 !important;
      width: 100% !important;
    }

    .receipt-page-wrapper {
      display: block !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
      break-after: page !important;
      page-break-after: always !important;
      margin: 0 !important;
      width: 100% !important;
    }

    .receipt-page-wrapper:last-child {
      break-after: auto !important;
      page-break-after: auto !important;
    }

    .receipt-print-shell {
      display: block !important;
      width: 95mm !important;
      max-width: 95mm !important;
      margin: 0 auto !important;
      padding: 0 !important;
      background: transparent !important;
    }

    .receipt-page {
      display: flex !important;
      flex-direction: column !important;
      width: 95mm !important;
      height: 138mm !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      box-shadow: none !important;
      overflow: visible !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
      page-break-after: auto !important;
    }

    .receipt-page,
    .receipt-page * {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`;

// Triggers a browser download for an in-memory PDF blob.
const triggerPdfDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const InvoiceGenerated = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { invalidatePayments, invalidatePaymentInvoice } = useQueryInvalidator();
  const currentUser = getStoredUser();
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const [payment, setPayment] = useState(location.state?.payment || null);
  const [loading, setLoading] = useState(!location.state?.payment);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copiedNo, setCopiedNo] = useState(false);
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

  const handleWhatsAppShare = async () => {
    if (sharing) return;

    setSharing(true);
    try {
      const response = await api.post(`/payments/${id}/whatsapp`, {}, { skipToast: true });
      const data = response.data;

      if (!data?.waLink || !data?.pdfUrl) {
        toastError('Failed to prepare the WhatsApp bill. Please try again.');
        return;
      }

      let pdfBlob;
      let pdfFile;

      try {
        const pdfResponse = await api.get(`/payments/invoice/${id}`, {
          responseType: 'blob',
          params: { bill: 'first' }
        });
        pdfBlob = new Blob([pdfResponse.data], { type: 'application/pdf' });

        const receiptNumber = String(data.bill?.receiptNumber || id || 'receipt')
          .replace(/[^a-zA-Z0-9._-]/g, '_');
        pdfFile = new File([pdfBlob], `Fee-Receipt-${receiptNumber}.pdf`, { type: 'application/pdf' });
      } catch (pdfError) {
        console.error('Error fetching receipt PDF', pdfError);
        toastError('Failed to load the receipt PDF. Please try again.');
        return;
      }

      let canShareFiles = false;
      if (typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
        try {
          canShareFiles = navigator.canShare({ files: [pdfFile] });
        } catch {
          canShareFiles = false;
        }
      }

      if (canShareFiles) {
        try {
          await navigator.share({
            title: 'Fee Payment Receipt',
            text: data.message || 'Fee payment receipt',
            files: [pdfFile]
          });
          toastSuccess('Receipt PDF shared successfully.');
          return;
        } catch (shareError) {
          if (shareError?.name === 'AbortError') {
            toastInfo('Sharing was cancelled.');
            return;
          }
          console.error('Error sharing receipt PDF', shareError);
          toastError('Sharing the receipt PDF failed. Please try again.');
          return;
        }
      }

      // Fallback: this browser cannot attach files to the native share sheet.
      window.open(data.waLink, '_blank', 'noopener,noreferrer');
      triggerPdfDownload(pdfBlob, pdfFile.name);
      toastInfo(
        'PDF sharing is not supported in this browser. WhatsApp has been opened with the message and the PDF has been downloaded - please attach it manually.',
        { duration: 8000 }
      );
    } catch (shareError) {
      console.error('Error sharing bill on WhatsApp', shareError);
      const message = shareError?.response?.data?.error || 'Failed to prepare the WhatsApp bill. Please try again.';
      toastError(message);
    } finally {
      setSharing(false);
    }
  };

  const getParentNumber = () => {
    const student = payment?.studentId || payment?.student || payment?.applicationId || payment?.application || {};
    return (student?.whatsappNumber || student?.fatherPhone || student?.motherPhone || student?.guardianPhone || '').trim();
  };

  const handleCopyNumber = async () => {
    const number = getParentNumber();
    if (!number) {
      toastError('Parent WhatsApp number is not available.');
      return;
    }
    try {
      await navigator.clipboard.writeText(number);
      setCopiedNo(true);
      toastSuccess(`Parent WhatsApp number copied: ${number}`);
      setTimeout(() => setCopiedNo(false), 2000);
    } catch (copyError) {
      console.error('Error copying number', copyError);
      toastError('Failed to copy the number.');
    }
  };

  const handleDelete = async () => {
    const accepted = await confirm({
      title: 'Delete Payment',
      description: 'Are you sure you want to delete this payment?',
      confirmText: 'Delete',
      tone: 'danger'
    });

    if (!accepted) {
      return;
    }

    setDeleting(true);
    try {
      await api.delete(`/payments/${id}`);
      invalidatePayments();
      invalidatePaymentInvoice(id);
      toastSuccess('Payment deleted successfully.');
      navigate('/dashboard/payments', { replace: true });
    } catch (deleteError) {
      console.error('Error deleting payment', deleteError);
      toastError('Error deleting payment');
    } finally {
      setDeleting(false);
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
          {isSuperAdmin && (
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleDelete}
              loading={deleting}
              loadingText="Deleting..."
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          )}
          <Button variant="outline" onClick={downloadInvoice} loading={downloading} loadingText="Downloading...">
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
          <Button
            variant="outline"
            onClick={handleCopyNumber}
            disabled={!getParentNumber()}
            className="text-sky-700 hover:bg-sky-50"
          >
            <Copy className="mr-2 h-4 w-4" /> {copiedNo ? 'Copied!' : 'Copy No'}
          </Button>
          <Button
            variant="outline"
            onClick={handleWhatsAppShare}
            loading={sharing}
            loadingText="Preparing PDF..."
            className="text-emerald-700 hover:bg-emerald-50"
          >
            <WhatsAppIcon className="mr-2 h-4 w-4" /> WhatsApp PDF
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
