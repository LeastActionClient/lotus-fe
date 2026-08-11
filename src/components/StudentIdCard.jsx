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

  const studentAddress = student.address || '#15&44, Eda Street, Saidapet, Vellore-12.';
  const studentPhone = student.phone || student.fatherPhone || student.motherPhone || student.whatsappNumber || '63790 41414';

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Playfair+Display:wght@700;800&family=Alex+Brush&display=swap');
        `}
      </style>

      <div
        ref={ref}
        className="id-card-container relative overflow-hidden text-gray-900 shadow-2xl border border-gray-200 select-none shrink-0"
        style={{
          width: '340px',
          height: '530px',
          borderRadius: '16px',
          boxSizing: 'border-box',
          backgroundColor: '#FFFFFF',
          fontFamily: "'Montserrat', sans-serif"
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
            top: '165px',
            left: '75px',
            width: '182px',
            height: '182px',
            borderRadius: '50%',
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
          className="absolute z-10 left-0 w-full text-center px-3"
          style={{ top: '362px' }}
        >
          <h2 className="text-[20px] font-black text-[#0A2368] tracking-wide leading-tight line-clamp-1">
            {studentName}
          </h2>
        </div>

        {/* Class & Section */}
        <div
          className="absolute z-10 left-0 w-full text-center px-3"
          style={{ top: '390px' }}
        >
          <p className="text-[14px] font-black text-[#8B6508] tracking-wider uppercase">
            {classDisplay}
          </p>
        </div>

        {/* Principal Signature */}
        <div
          className="absolute z-10 text-right pr-6 flex flex-col items-end"
          style={{ top: '412px', right: '0px' }}
        >
          <span
            className="text-[15px] font-bold text-[#16A34A] tracking-wide select-none"
            style={{ fontFamily: "'Alex Brush', cursive" }}
          >
            M. Vijayakumar
          </span>
          <span className="text-[11px] font-extrabold text-[#8B6508] tracking-wide leading-none mt-0.5">
            Principal
          </span>
        </div>

        {/* Student Address */}
        <div
          className="absolute z-10 left-0 w-full text-center px-4 text-[#8B6508]"
          style={{ top: '456px', fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {studentAddress.split('\n').map((line, idx) => (
            <p key={idx} className="text-[12.5px] font-bold leading-snug">
              {line}
            </p>
          ))}
        </div>

        {/* Student Phone */}
        <div
          className="absolute z-10 left-0 w-full text-center text-[#8B6508]"
          style={{ top: '496px', fontFamily: "'Montserrat', sans-serif" }}
        >
          <p className="text-[13px] font-black tracking-wide">
            Ph: {studentPhone}
          </p>
        </div>
      </div>
    </>
  );
});

StudentIdCard.displayName = 'StudentIdCard';

export default StudentIdCard;
