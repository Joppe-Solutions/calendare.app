import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      slug, 
      serviceId, 
      clientName, 
      clientPhone, 
      clientEmail,
      clientCpfCnpj,
      date, 
      time, 
      notes, 
      spots = 1,
      paymentMethod = 'pix'
    } = body

    if (!slug || !serviceId || !clientName || !date || !time) {
      return NextResponse.json({ error: "Campos obrigatórios não informados" }, { status: 400 })
    }

    const businesses = await sql`
      SELECT id, name, payment_gateway, payment_access_token 
      FROM businesses 
      WHERE slug = ${slug}
    `
    if (businesses.length === 0) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 })
    }

    const business = businesses[0]
    const apiKey = business.payment_access_token as string | null

    const serviceRows = await sql`
      SELECT id, name, duration_minutes, capacity, price_cents, price_type, payment_type, deposit_percentage 
      FROM services 
      WHERE id = ${serviceId} AND business_id = ${business.id} AND is_active = true
    `
    if (serviceRows.length === 0) {
      return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 })
    }

    const service = serviceRows[0]
    
    if (service.payment_type === 'on_site' || !apiKey) {
      return NextResponse.json({ 
        error: "Este serviço não requer pagamento antecipado ou gateway não configurado" 
      }, { status: 400 })
    }

    let totalAmount = 0
    const basePrice = service.price_cents as number || 0
    
    if (service.price_type === 'per_person') {
      totalAmount = (basePrice / 100) * spots
    } else {
      totalAmount = basePrice / 100
    }

    if (service.payment_type === 'deposit') {
      const depositPercentage = (service.deposit_percentage as number) || 50
      totalAmount = totalAmount * (depositPercentage / 100)
    }

    if (totalAmount <= 0) {
      return NextResponse.json({ error: "Valor do pagamento inválido" }, { status: 400 })
    }

    const durationMinutes = service.duration_minutes as number
    const [hours, mins] = time.split(":").map(Number)
    const startTime = new Date(`${date}T${time}:00`)
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000)

    const isSandbox = apiKey.startsWith('$aact_') && !apiKey.includes('prod')
    const baseUrl = isSandbox 
      ? 'https://api-sandbox.asaas.com' 
      : 'https://api.asaas.com'

    let customerData = null
    if (clientCpfCnpj) {
      const customerRes = await fetch(`${baseUrl}/v3/customers?cpfCnpj=${clientCpfCnpj.replace(/\D/g, '')}`, {
        headers: {
          'access_token': apiKey,
          'Content-Type': 'application/json'
        }
      })
      const customerJson = await customerRes.json()
      if (customerJson.data && customerJson.data.length > 0) {
        customerData = customerJson.data[0]
      }
    }

    if (!customerData) {
      const createCustomerRes = await fetch(`${baseUrl}/v3/customers`, {
        method: 'POST',
        headers: {
          'access_token': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: clientName,
          email: clientEmail || undefined,
          phone: clientPhone ? clientPhone.replace(/\D/g, '') : undefined,
          cpfCnpj: clientCpfCnpj ? clientCpfCnpj.replace(/\D/g, '') : undefined,
          externalReference: `booking_${Date.now()}`
        })
      })

      if (!createCustomerRes.ok) {
        const error = await createCustomerRes.json()
        console.error("Asaas customer error:", error)
        return NextResponse.json({ error: "Erro ao criar cliente no gateway de pagamento" }, { status: 500 })
      }

      customerData = await createCustomerRes.json()
    }

    const billingType = paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'credit_card' ? 'CREDIT_CARD' : 'BOLETO'

    const paymentRes = await fetch(`${baseUrl}/v3/payments`, {
      method: 'POST',
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer: customerData.id,
        billingType: billingType,
        value: totalAmount,
        dueDate: date,
        description: `${service.name} - ${date} às ${time}${spots > 1 ? ` (${spots} pessoas)` : ''}`,
        externalReference: `${business.id}_${serviceId}_${Date.now()}`,
        postalService: false
      })
    })

    if (!paymentRes.ok) {
      const error = await paymentRes.json()
      console.error("Asaas payment error:", error)
      return NextResponse.json({ error: "Erro ao criar cobrança" }, { status: 500 })
    }

    const payment = await paymentRes.json()

    let qrCode = null
    if (billingType === 'PIX') {
      const qrCodeRes = await fetch(`${baseUrl}/v3/payments/${payment.id}/pixQrCode`, {
        headers: {
          'access_token': apiKey
        }
      })
      if (qrCodeRes.ok) {
        qrCode = await qrCodeRes.json()
      }
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        value: totalAmount,
        billingType: billingType,
        status: payment.status,
        invoiceUrl: payment.invoiceUrl,
        bankSlipUrl: payment.bankSlipUrl,
        qrCode: qrCode ? {
          payload: qrCode.payload,
          encodedImage: qrCode.encodedImage
        } : null
      }
    })

  } catch (error) {
    console.error("Payment create error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
