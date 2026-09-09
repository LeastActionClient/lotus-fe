import React, { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';
import templateImg from '../assets/id_card_template.png';

export const StudentIdCard = React.forwardRef(({ student }, ref) => {
  if (!student) return null;

  const photo = student.passport_photo || student.photoUrl || '';
  const studentName = (student.studentName || 'STUDENT NAME').toUpperCase();
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false);

  useEffect(() => {
    setPhotoLoadFailed(false);
  }, [photo]);

  // Class formatting e.g. "III - STD 'A' SEC"
  const rawClass = (student.currentClass || '').toUpperCase();
  const rawSec = (student.section || 'A').toUpperCase();

  const getRomanClass = (cls) => {
    const num = parseInt(cls, 10);
    const romanMap = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X' };
    return romanMap[num] || cls;
  };

  const formattedClass = getRomanClass(rawClass);
  const classDisplay = `${formattedClass} - STD '${rawSec}' SEC`;

  const formatAddress = (addr) => {
    if (!addr) return '#15 & 44, Eda Street, Saidapet, Vellore-12.';
    // Inject spaces after commas if missing, so browser can wrap properly
    // This fixes the issue where "STREET,SAIDAPET,VELLORE" wraps as one huge block
    return addr.replace(/,/g, ', ').replace(/ +/g, ' ').trim();
  };

  const getPhoneNumbers = () => {
    let text = [];
    if (student.fatherPhone) {
      text.push(`F: ${student.fatherPhone}`);
    }
    if (student.motherPhone) {
      text.push(`M: ${student.motherPhone}`);
    }
    
    if (text.length === 0) {
      if (student.whatsappNumber) text.push(`Ph: ${student.whatsappNumber}`);
      else if (student.phone) text.push(`Ph: ${student.phone}`);
      else return 'Ph: 63790 41414';
    }
    
    return text.join(' | ');
  };

  const studentAddress = formatAddress(student.address);
  const studentPhone = getPhoneNumbers();

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&display=swap');
        `}
      </style>

      <div
        ref={ref}
        className="id-card-container relative overflow-hidden text-gray-900 shadow-2xl border border-gray-200 select-none shrink-0"
        style={{
          width: '54mm',
          height: '85.6mm',
          borderRadius: '3mm',
          boxSizing: 'border-box',
          backgroundColor: '#FFFFFF',
          fontFamily: "Arial, sans-serif"
        }}
      >
        {/* Background Clean Template Graphic Image */}
        <img
          src={templateImg}
          alt="ID Card Template"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
        />

        {/* Student Passport Photo inside Template Circle Frame */}
        <div
          className="absolute z-10 overflow-hidden flex items-center justify-center"
          style={{
            top: '24.4mm',
            left: '10.5mm',
            width: '33mm',
            height: '33mm',
            borderRadius: '50%',
            border: '0.7mm solid #ae8041',
            boxSizing: 'border-box',
            backgroundColor: photo && !photoLoadFailed ? '#ef2f2a' : '#f3f4f6'
          }}
        >
          {photo && !photoLoadFailed ? (
            <>
              <div
                className="absolute inset-0"
                style={{
                  inset: '-2px',
                  backgroundImage: `url(${getImageUrl(photo)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center center',
                  backgroundRepeat: 'no-repeat'
                }}
              />
              <img
                src={getImageUrl(photo)}
                alt={studentName}
                className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                onError={() => setPhotoLoadFailed(true)}
              />
            </>
          ) : null}
          <div
            className="w-full h-full bg-gray-100 flex items-center justify-center"
            style={{ display: photo && !photoLoadFailed ? 'none' : 'flex' }}
          >
            <User className="w-20 h-20 text-gray-300" />
          </div>
        </div>

        {/* Student Name */}
        <div
          className="absolute z-10 left-0 w-full text-center px-2"
          style={{ top: '57.5mm' }}
        >
          <h2 className="font-black text-[#0A2368] tracking-wide leading-tight line-clamp-1" style={{ fontSize: '13pt' }}>
            {studentName}
          </h2>
        </div>

        {/* Class & Section */}
        <div
          className="absolute z-10 left-0 w-full text-center px-2"
          style={{ top: '62.5mm' }}
        >
          <p className="font-black text-[#8B6508] tracking-wider uppercase" style={{ fontSize: '8pt' }}>
            {classDisplay}
          </p>
        </div>

        {/* Principal Signature */}
        <div
          className="absolute z-10 text-right pr-4 flex flex-col items-end"
          style={{ top: '67.5mm', right: '0px' }}
        >
          <span
            className="font-bold text-[#16A34A] tracking-wide select-none leading-none"
            style={{ fontFamily: "'Alex Brush', cursive", fontSize: '10pt' }}
          >
            M. Vijayakumar
          </span>
          <span className="font-normal text-[#8B6508] tracking-wide leading-none" style={{ fontSize: '6pt' }}>
            Principal
          </span>
        </div>

        {/* Student Address */}
        <div
          className="absolute z-10 left-0 w-full flex flex-col items-center text-center text-[#8B6508]"
          style={{ top: '72.5mm', fontFamily: "Arial, sans-serif" }}
        >
          <div className="w-[38mm]">
            {studentAddress.split('\n').map((line, idx) => (
              <p key={idx} className="font-bold leading-snug" style={{ fontSize: '7.25pt' }}>
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* Student Phone */}
        <div
          className="absolute z-10 left-0 w-full text-center text-[#8B6508]"
          style={{ top: '78.5mm', fontFamily: "Arial, sans-serif" }}
        >
          <p className="font-normal tracking-wide" style={{ fontSize: '7.25pt' }}>
            {studentPhone}
          </p>
        </div>
      </div>
    </>
  );
});

StudentIdCard.displayName = 'StudentIdCard';

export default StudentIdCard;
