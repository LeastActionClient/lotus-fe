import React, { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';
import templateImg from '../assets/id_card_template.png';

export const TeacherIdCard = React.forwardRef(({ teacher }, ref) => {
  if (!teacher) return null;

  const photo = teacher.photo || '';
  const teacherName = (teacher.name || 'TEACHER NAME').toUpperCase();
  const designation = (teacher.designation || 'TEACHER').toUpperCase();
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false);

  useEffect(() => {
    setPhotoLoadFailed(false);
  }, [photo]);

  const phone = teacher.phoneNumber || '';
  const formatAddress = (addr) => {
    if (!addr) return 'No.35, Pasapathan Mettu st,\nSaidapet, Vellore-12.';
    return addr.replace(/,/g, ', ').replace(/ +/g, ' ').trim();
  };
  const address = formatAddress(teacher.address);

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
          alt="Teacher ID Card Template"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
        />

        {/* Teacher Photo inside Template Circle Frame */}
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
                alt={teacherName}
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

        {/* Teacher Name */}
        <div
          className="absolute z-10 left-0 w-full text-center px-4"
          style={{ top: '679px' }}
        >
          <h2 className="font-black text-[#0A2368] tracking-wide leading-tight line-clamp-1 uppercase" style={{ fontSize: '40pt' }}>
            {teacherName}
          </h2>
        </div>
        
        {/* Designation */}
        <div
          className="absolute z-10 left-0 w-full text-center px-4"
          style={{ top: '738px' }}
        >
          <p className="font-black text-[#8B6508] tracking-wider uppercase" style={{ fontSize: '25pt' }}>
            {designation}
          </p>
        </div>

        {/* Principal Signature */}
        <div
          className="absolute z-10 text-right pr-6 flex flex-col items-end"
          style={{ top: '797px', right: '10px' }}
        >
          <span
            className="font-bold text-[#16A34A] tracking-wide select-none leading-none"
            style={{ fontFamily: "'Alex Brush', cursive", fontSize: '31pt' }}
          >
            M. Vijayakumar
          </span>
          <span className="font-normal text-[#8B6508] tracking-wide leading-none mt-1" style={{ fontSize: '19pt' }}>
            Principal
          </span>
        </div>

        {/* Address */}
        <div
          className="absolute z-10 left-0 w-full flex flex-col items-center text-center text-[#8B6508]"
          style={{ top: '857px', fontFamily: "Arial, sans-serif" }}
        >
          <div style={{ width: '449px' }}>
            {address.split('\n').map((line, idx) => (
              <p key={idx} className="font-bold leading-snug" style={{ fontSize: '22pt' }}>
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* Phone number */}
        <div
          className="absolute z-10 left-0 w-full text-center text-[#8B6508]"
          style={{ top: '927px', fontFamily: "Arial, sans-serif" }}
        >
          <p className="font-bold tracking-wide" style={{ fontSize: '22pt' }}>
            Ph: {phone}
          </p>
        </div>

      </div>
    </>
  );
});

TeacherIdCard.displayName = 'TeacherIdCard';

export default TeacherIdCard;
