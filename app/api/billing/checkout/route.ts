import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const PLAN_PRICES = {
  pro: {
    price: 4900, // R$ 49.00 in cents
    name: "Plano Pro - Calendare",
  },
  business: {
    price: 14900, // R$ 149.00 in cents
    name: "Plano Business - Calendare",
  },
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { planId } = await request.json()

    if (!planId || !PLAN_PRICES[planId as keyof typeof PLAN_PRICES]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const plan = PLAN_PRICES[planId as keyof typeof PLAN_PRICES]
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const email = user.emailAddresses[0]?.emailAddress

    // For now, return a simple success response
    // In production, you would integrate with Asaas or Mercado Pago
    // and create a checkout session
    
    // Example with Asaas (you'd need to install asaas-sdk):
    // const checkout = await asaas.checkout.create({
    //   customer: { email, name: user.firstName },
    //   billingType: "UNDEFINED",
    //   value: plan.price / 100,
    //   description: plan.name,
    // })

    return NextResponse.json({ 
      message: "Em desenvolvimento",
      plan: planId,
      price: plan.price / 100,
      email,
    })

  } catch (error) {
    console.error("Billing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}