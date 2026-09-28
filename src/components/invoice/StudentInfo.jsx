import React, { memo } from 'react';

const fieldValueBaseClass = 'min-w-0 flex-1 whitespace-normal break-words text-[10px] font-bold leading-[1.18] tabular-nums';

const InfoBlock = ({ label, value, accent = false, largeValue = false, labelWidthClass = 'w-[20mm]' }) => (
  <div className="flex min-w-0 items-start">
    <div className={`${labelWidthClass} shrink-0 whitespace-nowrap text-[9.8px] font-bold leading-[1.15] tracking-normal text-[#555555]`}>{label}</div>
    <div className="w-[4mm] shrink-0 text-center text-[11px] font-bold leading-[1.15] text-[#555555]">:</div>
    <div
      className={[
        fieldValueBaseClass,
        largeValue ? 'text-[11px] font-bold leading-[1.08] text-[#111111]' : (accent ? 'text-[#013e8b]' : 'text-[#111111]'),
        'text-left ml-[1mm]'
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
    <section className="border-b border-[#ECECEC] py-[1.5mm] break-inside-avoid">
      <div className="grid grid-cols-[54%_46%] gap-x-[2mm] gap-y-[1.2mm]">
        {isApplication ? (
          <>
            <InfoBlock label="Application No" value={application.applicationId || '-'} accent labelWidthClass="w-[24mm]" />
            <InfoBlock label="Rec.No" value={invoiceNumber} labelWidthClass="w-[14mm]" />
            <InfoBlock label="Applicant Name" value={application.studentName || '-'} largeValue labelWidthClass="w-[24mm]" />
            <InfoBlock label="Applying Class" value={application.applyingClass || '-'} labelWidthClass="w-[14mm]" />
            <InfoBlock label="Date" value={receiptDate || '-'} labelWidthClass="w-[14mm]" />
            <InfoBlock label="Pay Mode" value={paymentMode} labelWidthClass="w-[14mm]" />
          </>
        ) : (
          <>
            <InfoBlock label="Ad. No" value={student.admissionNumber || '-'} labelWidthClass="w-[18mm]" />
            <InfoBlock label="Rec.No" value={invoiceNumber} labelWidthClass="w-[14mm]" />
            <InfoBlock label="S. Name" value={student.studentName || '-'} largeValue labelWidthClass="w-[18mm]" />
            <InfoBlock label="Date" value={receiptDate || '-'} labelWidthClass="w-[14mm]" />
            <InfoBlock label="Class & Sec" value={classValue} labelWidthClass="w-[18mm]" />
            <InfoBlock label="Pay Mode" value={paymentMode} labelWidthClass="w-[14mm]" />
          </>
        )}
      </div>
    </section>
  );
});

StudentInfo.displayName = 'StudentInfo';

export default StudentInfo;
