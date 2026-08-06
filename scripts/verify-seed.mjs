import { Prisma, PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const quote = (value) => `"${String(value).replaceAll('"', '""')}"`;
const delegate = (name) => db[name[0].toLowerCase() + name.slice(1)];

async function verify() {
  const counts = {};
  for (const model of Prisma.dmmf.datamodel.models) counts[model.name] = await delegate(model.name).count();

  const constraints = await db.$queryRawUnsafe(`
    SELECT c.conname,
           child_ns.nspname AS child_schema, child.relname AS child_table,
           parent_ns.nspname AS parent_schema, parent.relname AS parent_table,
           ARRAY(SELECT a.attname FROM pg_attribute a WHERE a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey) ORDER BY array_position(c.conkey, a.attnum)) AS child_columns,
           ARRAY(SELECT a.attname FROM pg_attribute a WHERE a.attrelid = c.confrelid AND a.attnum = ANY(c.confkey) ORDER BY array_position(c.confkey, a.attnum)) AS parent_columns
    FROM pg_constraint c
    JOIN pg_class child ON child.oid = c.conrelid
    JOIN pg_namespace child_ns ON child_ns.oid = child.relnamespace
    JOIN pg_class parent ON parent.oid = c.confrelid
    JOIN pg_namespace parent_ns ON parent_ns.oid = parent.relnamespace
    WHERE c.contype = 'f' AND child_ns.nspname = 'public'
    ORDER BY child.relname, c.conname
  `);

  const fkViolations = [];
  for (const constraint of constraints) {
    const joins = constraint.child_columns.map((column, index) => `c.${quote(column)} = p.${quote(constraint.parent_columns[index])}`).join(" AND ");
    const populated = constraint.child_columns.map((column) => `c.${quote(column)} IS NOT NULL`).join(" AND ");
    const missing = `p.${quote(constraint.parent_columns[0])} IS NULL`;
    const sql = `SELECT COUNT(*)::int AS count FROM ${quote(constraint.child_schema)}.${quote(constraint.child_table)} c LEFT JOIN ${quote(constraint.parent_schema)}.${quote(constraint.parent_table)} p ON ${joins} WHERE ${populated} AND ${missing}`;
    const [{ count }] = await db.$queryRawUnsafe(sql);
    if (count) fkViolations.push({ constraint: constraint.conname, table: constraint.child_table, count });
  }

  const emptyTables = Object.entries(counts).filter(([, count]) => count === 0).map(([name]) => name);
  console.log(JSON.stringify({ modelCount: Object.keys(counts).length, counts, emptyTables, foreignKeyCount: constraints.length, fkViolations }, null, 2));
  if (emptyTables.length || fkViolations.length) process.exitCode = 1;
}

verify().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
