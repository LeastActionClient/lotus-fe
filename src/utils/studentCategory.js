export const isRccStudent = (student) => {
  if (!student) return false;
  if (typeof student.isRcc === 'boolean') return student.isRcc;
  const value = `${student.rcc || ''}`.trim().toLowerCase();
  return ['rcc', 'yes', 'true', '1'].includes(value);
};

export const getStudentCategoryLabel = (student) => (isRccStudent(student) ? 'RCC' : 'General');

