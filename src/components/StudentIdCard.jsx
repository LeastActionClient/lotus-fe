import React, { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';
import finalTemplateImg from '../assets/final_template.png';
import principalSignatureImg from '../assets/a_padmini_sign.png';

export const StudentIdCard = React.forwardRef(({ student }, ref) => {
  if (!student) return null;

  const photo = student.passport_photo || student.photoUrl || '';
  const studentName = (student.studentName || 'STUDENT NAME').toUpperCase();
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false);

  useEffect(() => {
    setPhotoLoadFailed(false);
  }, [photo]);

  const rawClass = (student.currentClass || '').toUpperCase();
  const getRomanClass = (cls) => {
    const num = parseInt(cls, 10);
    const romanMap = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X' };
    return romanMap[num] || cls;
  };
  const formattedClass = getRomanClass(rawClass);
  const classDisplay = `${formattedClass} STD`;

  const formatAddressLines = (addr) => {
    if (!addr) return ['380 ARCOT ROAD,', 'KAGITHAPATTARAI,', 'VELLORE-12'];
    let cleanStr = addr.replace(/\n/g, ', ').replace(/,+/g, ',').replace(/ +/g, ' ').trim();
    let parts = cleanStr.split(',').map(p => p.trim()).filter(p => p !== '');
    
    let lines = parts;
    if (parts.length === 4) {
       lines = [`${parts[0]}, ${parts[1]}`, parts[2], parts[3]];
    } else if (parts.length === 5) {
       lines = [`${parts[0]}, ${parts[1]}`, `${parts[2]}, ${parts[3]}`, parts[4]];
    } else if (parts.length > 5) {
       let third = Math.ceil(parts.length / 3);
       lines = [
         parts.slice(0, third).join(', '),
         parts.slice(third, third * 2).join(', '),
         parts.slice(third * 2).join(', ')
       ];
    }
    
    // Prevent dangling numbers or hyphens by replacing spaces with non-breaking spaces
    return lines.map(line => line.replace(/ (\d+)/g, '\u00A0$1').replace(/ - /g, '\u00A0-\u00A0'));
  };

  const getPhoneNumbers = () => {
    let nums = [];
    if (student.fatherPhone) nums.push(student.fatherPhone);
    if (student.motherPhone) nums.push(student.motherPhone);
    if (nums.length === 0) {
      if (student.whatsappNumber) nums.push(student.whatsappNumber);
      else if (student.phone) nums.push(student.phone);
      else return 'PH: 9566820327';
    }
    return `PH: ${nums.join(', ')}`;
  };

  const addressLines = formatAddressLines(student.address);
  const studentPhone = getPhoneNumbers();

  const renderTwoToneName = (name) => {
    if (name.length <= 4) return <span style={{ color: '#013e8b' }}>{name}</span>;
    if (name === 'K.LUKIESWARAN') {
      return (
        <>
          <span style={{ color: '#013e8b' }}>K.LUKIES</span>
          <span style={{ color: '#ea5b2c' }}>WARAN</span>
        </>
      );
    }
    const splitIndex = Math.ceil(name.length * 0.6);
    return (
      <>
        <span style={{ color: '#013e8b' }}>{name.substring(0, splitIndex)}</span>
        <span style={{ color: '#ea5b2c' }}>{name.substring(splitIndex)}</span>
      </>
    );
  };

  return (
    <div
      ref={ref}
      className="id-card-container relative overflow-hidden shadow-2xl select-none shrink-0"
      style={{
        width: '614px',
        height: '950px',
        borderRadius: '35px',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        fontFamily: "Arial, sans-serif"
      }}
    >
      <img
        src={finalTemplateImg}
        alt="ID Card Template"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
      />

      <div
        className="absolute z-10 flex items-center justify-center bg-white overflow-hidden"
        style={{
          top: '280px',
          left: '180px',
          width: '254px',
          height: '298px',
          boxSizing: 'border-box'
        }}
      >
        {photo && !photoLoadFailed ? (
          <img
            src={getImageUrl(photo)}
            alt={studentName}
            className="w-full h-full object-cover"
            style={{ objectPosition: 'top' }}
            onError={() => setPhotoLoadFailed(true)}
          />
        ) : (
          <User className="w-20 h-20 text-gray-300" />
        )}
      </div>

      <div
        className="absolute z-10 w-full text-center px-4 flex justify-center"
        style={{ top: '595px' }}
      >
        <h2 
          className="tracking-tighter whitespace-nowrap" 
          style={{ 
            fontFamily: "'Arial Black', Impact, Arial, sans-serif",
            fontWeight: 900,
            fontSize: studentName.length > 20 ? '36px' : '48px' 
          }}
        >
          {renderTwoToneName(studentName)}
        </h2>
      </div>

      <div
        className="absolute z-10 w-full text-center px-4"
        style={{ top: '655px' }}
      >
        <p 
          className="uppercase tracking-wider" 
          style={{ 
            color: '#013e8b', 
            fontSize: '28px',
            fontFamily: "Arial, sans-serif",
            fontWeight: 800
          }}
        >
          {classDisplay}
        </p>
      </div>

      {/* Signature & Principal */}
      <div
        className="absolute z-10 flex flex-col items-center justify-center"
        style={{ top: '670px', right: '40px', width: '200px' }}
      >
        <img
          src={principalSignatureImg}
          alt="Signature"
          style={{
            width: '140px',
            height: 'auto',
            objectFit: 'contain'
          }}
          className="select-none"
        />
        <p style={{ color: '#013e8b', fontSize: '24px', fontFamily: "Arial, sans-serif", fontWeight: 800, marginTop: '-5px' }}>
          Principal
        </p>
      </div>

      <div
        className="absolute z-10 w-full flex flex-col items-center text-center px-4"
        style={{ top: '780px' }}
      >
        {addressLines.map((line, idx) => (
          <p key={idx} className="whitespace-nowrap" style={{ color: '#013e8b', fontSize: '26px', lineHeight: '1.3', fontFamily: "Arial, sans-serif", fontWeight: 700 }}>
            {line.toUpperCase()}
          </p>
        ))}
        <p className="tracking-wide mt-2 whitespace-nowrap" style={{ color: '#013e8b', fontSize: '26px', fontFamily: "Arial, sans-serif", fontWeight: 900 }}>
          {studentPhone}
        </p>
      </div>
    </div>
  );
});

StudentIdCard.displayName = 'StudentIdCard';

export default StudentIdCard;
