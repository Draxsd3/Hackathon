/**
 * Shape do aluno.
 * Estes "models" servem como contrato/documentacao no MVP.
 * Em producao, podem virar entidades de ORM (Prisma/Sequelize/Drizzle).
 */
function buildStudent({
  id,
  name,
  registration,
  course,
  classGroup,
  email,
  photo,
  faceDescriptor,
  active = true,
  createdAt,
  updatedAt,
}) {
  return {
    id,
    name,
    registration,
    course: course || '',
    classGroup,
    email: email || null,
    photo: photo || null,
    faceDescriptor: faceDescriptor || null,
    active,
    createdAt: createdAt || new Date().toISOString(),
    updatedAt: updatedAt || new Date().toISOString(),
  };
}

module.exports = { buildStudent };
