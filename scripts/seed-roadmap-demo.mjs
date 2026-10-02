// Datos de prueba para HU-12 (ver README, "Probar el roadmap como grafo").
//
// Contra usuarios-service y cursos-service reales:
//   1. el publicador de prueba crea un catálogo de cursos con prerequisitos reales
//      (si ya existen por título, los reutiliza: se puede correr varias veces)
//   2. genera el roadmap del usuario de prueba con el mismo perfil que tiene
//      "Ana Torres" en el frontend (Ing. de Sistemas + Administración, intermedio)
//   3. marca un par de cursos como completados para ver los distintos estados
//
// Uso: npm run seed:roadmap
// Variables opcionales: USUARIOS_SERVICE_URL (http://localhost:8080), CURSOS_SERVICE_URL (http://localhost:8086)

const USUARIOS = process.env.USUARIOS_SERVICE_URL ?? 'http://localhost:8080';
const CURSOS = process.env.CURSOS_SERVICE_URL ?? 'http://localhost:8086';

// key -> curso. `pre` usa keys de este mismo catálogo y tiene que ir en orden
// (los prerequisitos antes que quien los requiere).
const CATALOGO = [
  { key: 'mat1', titulo: 'Matemáticas Discretas', categoria: 'MATEMATICAS', nivel: 'PRINCIPIANTE', pre: [] },
  { key: 'sis1', titulo: 'Fundamentos de Programación', categoria: 'INGENIERIA_SISTEMAS', nivel: 'PRINCIPIANTE', pre: [] },
  { key: 'sis2', titulo: 'Bases de Datos Relacionales', categoria: 'INGENIERIA_SISTEMAS', nivel: 'PRINCIPIANTE', pre: [] },
  { key: 'adm1', titulo: 'Contabilidad para no Contadores', categoria: 'ADMINISTRACION_EMPRESAS', nivel: 'PRINCIPIANTE', pre: [] },
  { key: 'sis3', titulo: 'Programación Orientada a Objetos', categoria: 'INGENIERIA_SISTEMAS', nivel: 'PRINCIPIANTE', pre: ['sis1'] },
  { key: 'adm2', titulo: 'Gestión de Proyectos Ágiles', categoria: 'ADMINISTRACION_EMPRESAS', nivel: 'INTERMEDIO', pre: ['adm1', 'sis1'] },
  { key: 'sis4', titulo: 'Estructuras de Datos y Algoritmos', categoria: 'INGENIERIA_SISTEMAS', nivel: 'INTERMEDIO', pre: ['sis3', 'mat1'] },
  { key: 'sis5', titulo: 'Desarrollo Web Backend', categoria: 'INGENIERIA_SISTEMAS', nivel: 'INTERMEDIO', pre: ['sis3', 'sis2'] },
  { key: 'sis6', titulo: 'Arquitectura de Software', categoria: 'INGENIERIA_SISTEMAS', nivel: 'INTERMEDIO', pre: ['sis4', 'sis5'] },
  { key: 'adm3', titulo: 'Liderazgo de Equipos Técnicos', categoria: 'ADMINISTRACION_EMPRESAS', nivel: 'INTERMEDIO', pre: ['adm2', 'sis5'] },
  { key: 'sis7', titulo: 'Sistemas Distribuidos y Concurrencia', categoria: 'INGENIERIA_SISTEMAS', nivel: 'AVANZADO', pre: ['sis6'] },
];

const PERFIL = {
  metas: 'Convertirme en líder técnica de un equipo de desarrollo de software.',
  intereses: ['INGENIERIA_SISTEMAS', 'ADMINISTRACION_EMPRESAS'],
  nivel: 'INTERMEDIO',
};

const COMPLETADOS = ['sis1', 'adm1'];

async function call(base, path, { token, method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${base}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(`No se pudo conectar con ${base}. ¿Está corriendo el servicio?`);
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(`${method} ${base}${path} respondió ${res.status}: ${data?.message ?? text}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

async function loginComo(rol) {
  const usuarios = await call(USUARIOS, '/api/auth/usuarios');
  const usuario = usuarios.find((u) => u.rol === rol);
  if (!usuario) throw new Error(`usuarios-service no tiene un usuario de prueba con rol ${rol}`);
  const { token } = await call(USUARIOS, '/api/auth/login', { method: 'POST', body: { usuarioId: usuario.id } });
  return { ...usuario, token };
}

async function main() {
  const publicador = await loginComo('PUBLICADOR');
  const usuario = await loginComo('USUARIO');
  console.log(`Publicador: ${publicador.nombre} (id ${publicador.id}) · Usuario: ${usuario.nombre} (id ${usuario.id})\n`);

  const existentes = await call(CURSOS, `/api/cursos?publicadorUsuarioId=${publicador.id}`, { token: publicador.token });
  const idPorKey = {};
  for (const c of CATALOGO) {
    const ya = existentes.find((e) => e.titulo === c.titulo);
    if (ya) {
      idPorKey[c.key] = ya.id;
      console.log(`  = ${c.titulo} (ya existía, id ${ya.id})`);
      continue;
    }
    const creado = await call(CURSOS, '/api/cursos', {
      token: publicador.token,
      method: 'POST',
      body: {
        titulo: c.titulo,
        descripcion: `Curso de prueba para HU-12 (${c.nivel.toLowerCase()}).`,
        categoria: c.categoria,
        nivel: c.nivel,
        habilidadIds: [],
        publicadorUsuarioId: publicador.id,
        prerequisitoIds: c.pre.map((k) => idPorKey[k]),
      },
    });
    idPorKey[c.key] = creado.id;
    const req = c.pre.length ? ` ← requiere ${c.pre.map((k) => CATALOGO.find((x) => x.key === k).titulo).join(', ')}` : '';
    console.log(`  + ${c.titulo} (id ${creado.id})${req}`);
  }

  for (const key of COMPLETADOS) {
    try {
      await call(CURSOS, `/api/cursos/${idPorKey[key]}/completar`, {
        token: usuario.token,
        method: 'POST',
        body: { usuarioId: usuario.id },
      });
    } catch (e) {
      if (e.status !== 409) throw e; // 409 = ya estaba completado
    }
  }

  const roadmap = await call(CURSOS, '/api/roadmap/generar', {
    token: usuario.token,
    method: 'POST',
    body: { usuarioId: usuario.id, ...PERFIL },
  });

  console.log(`\nRoadmap ${roadmap.id} de ${usuario.nombre}: ${roadmap.cursos.length} cursos`);
  for (const c of roadmap.cursos) {
    console.log(`  ${String(c.orden + 1).padStart(2)}. ${c.titulo}`);
  }
  console.log(`\nCompletados: ${COMPLETADOS.map((k) => CATALOGO.find((x) => x.key === k).titulo).join(', ')}`);
  console.log('\nListo. Abre http://localhost:5173, entra como "Ana Torres" y ve a Roadmap.');
}

main().catch((e) => {
  console.error(`\n✗ ${e.message}`);
  process.exit(1);
});
