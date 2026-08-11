import React from 'react';
import { User } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';
import teacherTemplateImg from '../assets/teacher_id_card_template.png';

export const TeacherIdCard = React.forwardRef(({ teacher }, ref) => {
  if (!teacher) return null;

  const photo = teacher.photo || '';
  const teacherName = (teacher.name || 'TEACHER NAME').toUpperCase();
  const designation = (teacher.designation || 'TEACHER').toUpperCase();
  const phone = teacher.phoneNumber || '';
  const address = teacher.address || 'No.35, Pasapathan Mettu st,\nSaidapet, Vellore-12.';

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
          src={teacherTemplateImg}
          alt="Teacher ID Card Template"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
        />

        {/* Teacher Photo inside Template Circle Frame */}
        <div
          className="absolute z-10 overflow-hidden flex items-center justify-center bg-white"
          style={{
            top: '173px',
            left: '168px',
            transform: 'translateX(-50%)',
            width: '184px',
            height: '184px',
            borderRadius: '50%'
          }}
        >
          {photo ? (
            <img
              src={getImageUrl(photo)}
              alt={teacherName}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                if (e.target.nextSibling) {
                  e.target.nextSibling.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div
            className="w-full h-full bg-gray-100 flex items-center justify-center"
            style={{ display: photo ? 'none' : 'flex' }}
          >
            <User className="w-20 h-20 text-gray-300" />
          </div>
        </div>

        {/* Teacher Name */}
        <div
          className="absolute z-10 left-0 w-full text-center px-3"
          style={{ top: '365px' }}
        >
          <h2 className="text-[22px] font-black text-[#0A2368] tracking-wide leading-tight line-clamp-1 uppercase">
            {teacherName}
          </h2>
        </div>
        
        {/* Designation */}
        <div
          className="absolute z-10 left-0 w-full text-center px-3"
          style={{ top: '394px' }}
        >
          <h3 className="text-[16px] font-bold text-[#8B6508] tracking-wider uppercase">
            {designation}
          </h3>
        </div>

        {/* Principal Signature */}
        <div
          className="absolute z-10 text-right pr-6 flex flex-col items-end"
          style={{ top: '415px', right: '0px' }}
        >
          <span
            className="text-[15px] font-bold text-[#16A34A] tracking-wide select-none"
            style={{ fontFamily: "'Alex Brush', cursive" }}
          >
            M. Vijayakumar
          </span>
          <span className="text-[12px] font-extrabold text-[#8B6508] tracking-wide leading-none mt-0.5">
            Principal
          </span>
        </div>

        {/* Address */}
        <div
          className="absolute z-10 left-0 w-full text-center px-4 flex flex-col items-center justify-center text-[#8B6508]"
          style={{ top: '445px', height: '40px', fontFamily: "Georgia, serif" }}
        >
          <p className="text-[14px] font-bold leading-snug break-words line-clamp-2 whitespace-pre-wrap">
            {address}
          </p>
        </div>

        {/* Phone number */}
        <div
          className="absolute z-10 left-0 w-full text-center px-3 text-[#8B6508]"
          style={{ top: '492px', fontFamily: "Georgia, serif" }}
        >
          <p className="text-[14px] font-bold tracking-wide">
            Ph: {phone}
          </p>
        </div>

      </div>
    </>
  );
});

TeacherIdCard.displayName = 'TeacherIdCard';

export default TeacherIdCard;
