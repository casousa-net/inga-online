import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const codigos = await prisma.codigopautal.findMany();
        return NextResponse.json(codigos);
    } catch (error) {
        console.error('Erro ao buscar códigos pautais:', error);
        return NextResponse.json({ 
            error: "Erro ao buscar códigos pautais",
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        // Validação básica
        if (!body.codigo || !body.descricao) {
            return NextResponse.json(
                { error: "Código e descrição são obrigatórios" },
                { status: 400 }
            );
        }
        
        // Validar formato do código (8 dígitos)
        if (!/^\d{8}$/.test(body.codigo)) {
            return NextResponse.json(
                { error: "O código pautal deve conter exatamente 8 dígitos" },
                { status: 400 }
            );
        }
        
        // Verificar se o código já existe
        const existingCodigo = await prisma.codigopautal.findUnique({
            where: { codigo: body.codigo }
        });
        
        if (existingCodigo) {
            return NextResponse.json(
                { error: "Código pautal já cadastrado" },
                { status: 409 }
            );
        }
        
        // Criar o código pautal
        const codigoPautal = await prisma.codigopautal.create({
            data: {
                codigo: body.codigo,
                descricao: body.descricao,
                taxa: 0 // valor padrão
            }
        });
        
        return NextResponse.json(codigoPautal, { status: 201 });
    } catch (error) {
        console.error("Erro ao criar código pautal:", error);
        return NextResponse.json(
            { 
                error: "Erro ao processar a solicitação",
                details: error instanceof Error ? error.message : 'Erro desconhecido'
            },
            { status: 500 }
        );
    }
}
