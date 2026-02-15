import { neon } from "@neondatabase/serverless"
import { config } from "dotenv"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: join(__dirname, "..", ".env") })

const sql = neon(process.env.DATABASE_URL)

async function migrate() {
  console.log("Iniciando migração para Clerk...")
  console.log("⚠️  AVISO: Todos os dados existentes serão removidos!\n")

  try {
    // Drop sessions table
    console.log("1. Removendo tabela sessions...")
    await sql`DROP TABLE IF EXISTS sessions`
    console.log("   ✓ OK")

    // Drop foreign key constraint on businesses FIRST
    console.log("2. Removendo constraint foreign key de businesses...")
    await sql`ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_user_id_fkey`
    console.log("   ✓ OK")

    // Clear old data from businesses (they reference old users)
    console.log("3. Limpando dados antigos de businesses...")
    await sql`DELETE FROM appointments`
    await sql`DELETE FROM time_blocks`
    await sql`DELETE FROM working_hours`
    await sql`DELETE FROM services`
    await sql`DELETE FROM clients`
    await sql`DELETE FROM businesses`
    console.log("   ✓ OK")

    // Drop old users table
    console.log("4. Removendo tabela users antiga...")
    await sql`DROP TABLE IF EXISTS users`
    console.log("   ✓ OK")

    // Create new users table with TEXT id
    console.log("5. Criando tabela users nova...")
    await sql`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
    console.log("   ✓ OK")

    // Change user_id column type
    console.log("6. Alterando tipo da coluna user_id para TEXT...")
    await sql`ALTER TABLE businesses ALTER COLUMN user_id TYPE TEXT`
    console.log("   ✓ OK")

    // Add new foreign key constraint
    console.log("7. Adicionando nova constraint foreign key...")
    await sql`
      ALTER TABLE businesses 
      ADD CONSTRAINT businesses_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    `
    console.log("   ✓ OK")

    console.log("\n✅ Migração concluída com sucesso!")
    console.log("\nPróximos passos:")
    console.log("1. Configure as variáveis do Clerk no .env")
    console.log("2. Configure o webhook no dashboard do Clerk")
    console.log("3. Crie uma nova conta no sistema")
  } catch (error) {
    console.error("❌ Erro na migração:", error)
    process.exit(1)
  }
}

migrate()
