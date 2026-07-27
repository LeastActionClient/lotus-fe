import React, { memo } from 'react';

const fieldLabelClass = 'w-[15.2mm] shrink-0 text-[7.1px] font-medium leading-none tracking-normal text-[#555555]';
const fieldValueClass = 'min-w-0 flex-1 truncate text-[8.6px] font-semibold leading-none text-[#111111]';
const fieldAccentClass = 'min-w-0 flex-1 truncate text-[8.6px] font-semibold leading-none text-[#F58220]';

const InfoBlock = ({ label, value, accent = false, align = 'left' }) => (
  <div className={`flex min-w-0 items-center gap-[1.2px] ${align === 'right' ? 'justify-end' : ''}`}>
    <div className={fieldLabelClass}>{label}</div>
    <div className="shrink-0 text-[8.2px] font-medium leading-none text-[#555555]">:</div>
    <div className={accent ? fieldAccentClass : fieldValueClass} title={value}>
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
      <div className="grid grid-cols-2 gap-x-5 gap-y-1.5">
        {isApplication ? (
          <>
            <InfoBlock label="Application No" value={application.applicationId || '-'} accent />
            <InfoBlock label="Receipt No" value={invoiceNumber} align="right" />
            <InfoBlock label="Applicant Name" value={application.studentName || '-'} accent />
            <InfoBlock label="Applying Class" value={application.applyingClass || '-'} align="right" />
            <InfoBlock label="Date" value={receiptDate || '-'} />
            <InfoBlock label="Payment Mode" value={paymentMode} align="right" />
          </>
        ) : (
          <>
            <InfoBlock label="Ad. No" value={student.admissionNumber || '-'} />
            <InfoBlock label="Receipt No" value={invoiceNumber} align="right" />
            <InfoBlock label="S. Name" value={student.studentName || '-'} accent />
            <InfoBlock label="Date" value={receiptDate || '-'} align="right" />
            <InfoBlock
              label="Class & Sec"
              value={
                student.currentClass
                  ? `${student.currentClass}${student.section ? ` - ${student.section}` : ''}`
                  : '-'
              }
            />
            <InfoBlock label="Payment Mode" value={paymentMode} align="right" />
          </>
        )}
      </div>
    </section>
  );
});

StudentInfo.displayName = 'StudentInfo';

export default StudentInfo;
