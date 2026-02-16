import { neon } from "@neondatabase/serverless"
import { config } from "dotenv"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: join(__dirname, "..", ".env") })

const sql = neon(process.env.DATABASE_URL)

async function migrate() {
  console.log("Executando migração 004-add-capacity-features...\n")

  try {
    console.log("1. Adicionando coluna capacity em services...")
    await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 1`
    console.log("   ✓ OK")

    console.log("2. Adicionando coluna price_type em services...")
    await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS price_type TEXT DEFAULT 'total'`
    console.log("   ✓ OK")

    console.log("3. Adicionando coluna meeting_point em services...")
    await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS meeting_point TEXT`
    console.log("   ✓ OK")

    console.log("4. Adicionando coluna meeting_instructions em services...")
    await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS meeting_instructions TEXT`
    console.log("   ✓ OK")

    console.log("5. Adicionando coluna spots em appointments...")
    await sql`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS spots INTEGER DEFAULT 1`
    console.log("   ✓ OK")

    console.log("6. Adicionando coluna show_weather_warning em businesses...")
    await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS show_weather_warning BOOLEAN DEFAULT true`
    console.log("   ✓ OK")

    console.log("7. Adicionando coluna timezone em businesses...")
    await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Sao_Paulo'`
    console.log("   ✓ OK")

    console.log("8. Adicionando coluna cancellation_policy em businesses...")
    await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS cancellation_policy TEXT`
    console.log("   ✓ OK")

    console.log("9. Adicionando coluna requires_advance_payment em businesses...")
    await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS requires_advance_payment BOOLEAN DEFAULT false`
    console.log("   ✓ OK")

    console.log("10. Criando índice para consultas de capacidade...")
    await sql`CREATE INDEX IF NOT EXISTS idx_appointments_business_time ON appointments(business_id, start_time, end_time)`
    console.log("   ✓ OK")

    console.log("\n✅ Migração concluída com sucesso!")
  } catch (error) {
    console.error("❌ Erro:", error)
    process.exit(1)
  }
}

migrate()
