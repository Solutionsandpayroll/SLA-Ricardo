
import { NextResponse } from "next/server";
import { authenticateWithDeviceCode } from "@/lib/graph-device-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await authenticateWithDeviceCode();

    return NextResponse.json({
      success: true,
      message: "Autenticación completada.",
      account: result.account?.username ?? null,
      expiresOn: result.expiresOn?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Error en autenticación por dispositivo:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "No fue posible iniciar sesión.",
      },
      { status: 500 }
    );
  }
}
