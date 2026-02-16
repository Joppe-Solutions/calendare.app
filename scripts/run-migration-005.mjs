import { neon } from "@neondatabase/serverless"
import { config } from "dotenv"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: join(__dirname, "..", ".env") })

const sql = neon(process.env.DATABASE_URL)

async function migrate() {
  console.log("Executando migração 005-add-logo-upload...\n")

  try {
    console.log("1. Adicionando coluna logo_url em businesses...")
    await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS logo_url TEXT`
    console.log("   ✓ OK")

    console.log("2. Adicionando coluna cover_url em businesses...")
    await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS cover_url TEXT`
    console.log("   ✓ OK")

    console.log("3. Adicionando coluna primary_color em businesses...")
    await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#10B981'`
    console.log("   ✓ OK")

    console.log("\n✅ Migração concluída com sucesso!")
  } catch (error) {
    console.error("❌ Erro:", error)
    process.exit(1)
  }
}

migrate()
