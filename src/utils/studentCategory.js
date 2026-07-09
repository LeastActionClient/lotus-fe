export const isRTEStudent = (student) => {
  if (!student) return false;
  if (typeof student.isRTE === 'boolean') return student.isRTE;
  const value = `${student.RTE || ''}`.trim().toLowerCase();
  return ['rte', 'yes', 'true', '1'].includes(value);
};

export const getStudentCategoryLabel = (student) => (isRTEStudent(student) ? 'RTE' : 'General');

