import React, { memo } from 'react';

const fieldLabelClass = 'w-[18.5mm] shrink-0 whitespace-nowrap text-[7.8px] font-medium leading-[1.15] tracking-normal text-[#555555]';
const fieldValueBaseClass = 'min-w-0 flex-1 whitespace-normal break-words text-[8px] font-semibold leading-[1.18] tabular-nums';

const InfoBlock = ({ label, value, accent = false, align = 'left', largeValue = false }) => (
  <div className={`flex min-w-0 items-start gap-[1.1mm] ${align === 'right' ? 'justify-end' : ''}`}>
    <div className={fieldLabelClass}>{label}</div>
    <div className="shrink-0 text-[9px] font-medium leading-[1.15] text-[#555555]">:</div>
    <div
      className={[
        fieldValueBaseClass,
        largeValue ? 'text-[9px] font-bold leading-[1.08] text-[#111111]' : (accent ? 'text-[#F58220]' : 'text-[#111111]'),
        align === 'right' ? 'text-right' : 'text-left'
      ].join(' ')}
      title={value}
    >
      {value || '-'}
    </div>
  </div>
);

const StudentInfo = memo(({ payment }) => {
  const isApplication = payment?.paymentType === 'APPLICATION';
  const student = payment?.studentId || payment?.student || {};
  const application = payment?.applicationId || payment?.application || {};
  const invoiceNumber = payment?.invoice?.invoiceNumber || payment?._id || payment?.id || '-';
  const receiptDate = payment?.receiptDate || payment?.paymentDate || payment?.invoice?.generatedDate || payment?.createdAt;
  const paymentMode = String(payment?.paymentMethod || payment?.paymentMode || payment?.mode || '-').toUpperCase();
  const classValue = isApplication
    ? application.applyingClass || '-'
    : student.currentClass
      ? `${student.currentClass}${student.section ? ` - ${student.section}` : ''}`
      : '-';

  return (
    <section className="border-b border-[#ECECEC] py-[1.5mm]">
      <div className="grid grid-cols-2 gap-x-[4mm] gap-y-[1.2mm]">
        {isApplication ? (
          <>
            <InfoBlock label="Application No" value={application.applicationId || '-'} accent />
            <InfoBlock label="Receipt No" value={invoiceNumber} align="right" />
            <InfoBlock label="Applicant Name" value={application.studentName || '-'} largeValue />
            <InfoBlock label="Applying Class" value={application.applyingClass || '-'} align="right" />
            <InfoBlock label="Date" value={receiptDate || '-'} />
            <InfoBlock label="Payment Mode" value={paymentMode} align="right" />
          </>
        ) : (
          <>
            <InfoBlock label="Ad. No" value={student.admissionNumber || '-'} />
            <InfoBlock label="Receipt No" value={invoiceNumber} align="right" />
            <InfoBlock label="S. Name" value={student.studentName || '-'} largeValue />
            <InfoBlock label="Date" value={receiptDate || '-'} align="right" />
            <InfoBlock label="Class & Sec" value={classValue} />
            <InfoBlock label="Payment Mode" value={paymentMode} align="right" />
          </>
        )}
      </div>
    </section>
  );
});

StudentInfo.displayName = 'StudentInfo';

export default StudentInfo;
