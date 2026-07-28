import React, { memo } from 'react';

const fieldLabelClass = 'w-[13.2mm] shrink-0 whitespace-nowrap text-[8.6px] font-medium leading-none tracking-normal text-[#555555]';
const fieldValueClass = 'min-w-0 flex-1 truncate whitespace-nowrap text-[8px] font-semibold leading-none text-[#111111]';
const fieldAccentClass = 'min-w-0 flex-1 truncate whitespace-nowrap text-[8px] font-semibold leading-none text-[#F58220]';
const fieldCompactValueClass = 'min-w-0 flex-1 truncate whitespace-nowrap text-[8px] font-semibold leading-none text-[#F58220]';

const InfoBlock = ({ label, value, accent = false, align = 'left', compact = false }) => (
  <div className={`flex min-w-0 items-center gap-[0.9px] ${align === 'right' ? 'justify-end' : ''}`}>
    <div className={fieldLabelClass}>{label}</div>
    <div className="shrink-0 text-[10px] font-medium leading-none text-[#555555]">:</div>
    <div className={compact ? fieldCompactValueClass : accent ? fieldAccentClass : fieldValueClass} title={value}>
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

  return (
    <section className="border-b border-[#ECECEC] pb-2 pt-2.5">
      <div className="grid grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] gap-x-3 gap-y-1.25">
        {isApplication ? (
          <>
            <InfoBlock label="Application No" value={application.applicationId || '-'} accent />
            <InfoBlock label="Receipt No" value={invoiceNumber} align="right" />
            <InfoBlock label="Applicant Name" value={application.studentName || '-'} accent />
            <InfoBlock label="Applying Class" value={application.applyingClass || '-'} align="right" />
            <InfoBlock label="Date" value={receiptDate || '-'} />
            <InfoBlock label="Payment" value={paymentMode} align="right" />
          </>
        ) : (
          <>
            <InfoBlock label="Ad. No" value={student.admissionNumber || '-'} />
            <InfoBlock label="Receipt No" value={invoiceNumber} align="right" />
            <InfoBlock label="S. Name" value={student.studentName || '-'} accent compact />
            <InfoBlock label="Date" value={receiptDate || '-'} align="right" />
            <InfoBlock
              label="Class & Sec"
              value={
                student.currentClass
                  ? `${student.currentClass}${student.section ? ` - ${student.section}` : ''}`
                  : '-'
              }
            />
            <InfoBlock label="Payment" value={paymentMode} align="right" />
          </>
        )}
      </div>
    </section>
  );
});

StudentInfo.displayName = 'StudentInfo';

export default StudentInfo;
