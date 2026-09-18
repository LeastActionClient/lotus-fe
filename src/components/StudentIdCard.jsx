import React, { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';
import templateImg from '../assets/id_card_template.png';
import principalSignatureImg from '../assets/principal_signature.png';

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
    
    // Inject spaces after commas if missing, and replace newlines with commas
    let formatted = addr.replace(/\n/g, ', ').replace(/,/g, ', ').replace(/ +/g, ' ').trim();
    
    // Split into parts to remove redundant "Vellore" entries (keeping only the last one)
    let parts = formatted.split(',').map(p => p.trim()).filter(p => p !== '');
    let velloreFound = false;
    let newParts = [];
    
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i].toLowerCase().includes('vellore')) {
        if (!velloreFound) {
          newParts.unshift(parts[i]);
          velloreFound = true;
        }
      } else {
        newParts.unshift(parts[i]);
      }
    }
    
    return newParts.join(', ');
  };

  const getPhoneNumbers = () => {
    let nums = [];
    if (student.fatherPhone) {
      nums.push(student.fatherPhone);
    }
    if (student.motherPhone) {
      nums.push(student.motherPhone);
    }
    
    if (nums.length === 0) {
      if (student.whatsappNumber) nums.push(student.whatsappNumber);
      else if (student.phone) nums.push(student.phone);
      else return 'Ph: 63790 41414';
    }
    
    return `Ph: ${nums.join(', ')}`;
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
          width: '638px',
          height: '1004px',
          borderRadius: '35px',
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
            top: '288px',
            left: '124px',
            width: '390px',
            height: '390px',
            borderRadius: '50%',
            border: '8px solid #ae8041',
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
          className="absolute z-10 left-0 w-full text-center px-4 flex justify-center"
          style={{ top: '679px' }}
        >
          <h2 
            className="font-black text-[#0A2368] tracking-wide leading-tight whitespace-nowrap" 
            style={{ 
              fontSize: studentName.length > 22 ? '24pt' : studentName.length > 18 ? '28pt' : studentName.length > 14 ? '32pt' : '40pt' 
            }}
          >
            {studentName}
          </h2>
        </div>

        {/* Class & Section */}
        <div
          className="absolute z-10 left-0 w-full text-center px-4"
          style={{ top: '735px' }}
        >
          <p className="font-black text-[#8B6508] tracking-wider uppercase" style={{ fontSize: '25pt' }}>
            {classDisplay}
          </p>
        </div>

        {/* Principal Signature */}
        <div
          className="absolute z-10 text-center flex flex-col items-center"
          style={{ top: '765px', right: '15px', width: '213px' }}
        >
          <div style={{ width: '213px', height: '60px', overflow: 'visible', position: 'relative' }}>
            <img
              src={principalSignatureImg}
              alt="Principal Signature"
              style={{
                position: 'absolute',
                top: '-26px',
                left: '-30px',
                width: '213px',
                height: '113px',
                objectFit: 'contain',
                filter: 'drop-shadow(0px 0px 0.5px rgba(0,0,0,0.4)) contrast(1.2)'
              }}
              className="select-none"
            />
          </div>
          <span className="font-bold text-[#8B6508] tracking-wide leading-none" style={{ fontSize: '19pt', marginTop: '2px' }}>
            Principal
          </span>
        </div>

        {/* Contact Info (Address + Phone) */}
        <div
          className="absolute z-10 left-0 w-full flex flex-col items-center text-center text-[#8B6508] px-4"
          style={{ bottom: '30px', fontFamily: "Arial, sans-serif" }}
        >
          <div style={{ maxWidth: '560px' }}>
            <p className="font-black" style={{ fontSize: '20pt', lineHeight: '1.2', fontWeight: 900 }}>
              {studentAddress}
            </p>
          </div>
          <p className="font-black tracking-wide mt-1" style={{ fontSize: '20pt', fontWeight: 900 }}>
            {studentPhone}
          </p>
        </div>
      </div>
    </>
  );
});

StudentIdCard.displayName = 'StudentIdCard';

export default StudentIdCard;
