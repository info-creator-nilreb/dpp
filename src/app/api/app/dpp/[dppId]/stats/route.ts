/**
 * GET /api/app/dpp/[dppId]/stats
 *
 * Liefert DPP-Statistiken: Nutzung (Scans) + Umfrage-Auswertung
 * Nur aggregierte Daten, mandantentrennend.
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canViewDppStats } from "@/lib/permissions"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ dppId: string }> }
) {
  try {
    const { dppId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const canView = await canViewDppStats(session.user.id, dppId)
    if (!canView) {
      return NextResponse.json(
        { error: "Kein Zugriff auf die Statistiken dieses DPPs" },
        { status: 403 }
      )
    }

    const dpp = await prisma.dpp.findUnique({
      where: { id: dppId },
      select: {
        id: true,
        name: true,
        status: true,
      },
    })

    if (!dpp) {
      return NextResponse.json({ error: "DPP nicht gefunden" }, { status: 404 })
    }

    // Nutzung: Scans (MVP: kein Scan-Tracking, immer 0)
    const totalScans = 0

    // Top-Regionen nach Scans (datenbasiert; MVP: leer, später aus Scan-Events mit region)
    const topRegions: Array<{ region: string; scans: number }> = []

    // Umfragen: Poll-Blöcke aus published content
    const dppContent = await prisma.dppContent.findFirst({
      where: { dppId, isPublished: true },
      select: { blocks: true },
    })

    const blocks = Array.isArray(dppContent?.blocks) ? dppContent.blocks : []
    const pollBlocks = (blocks as { id?: string; type?: string; config?: { questions?: unknown[] } }[]).filter(
      (b) => b.type === "multi_question_poll"
    )

    const surveys: Array<{
      pollBlockId: string
      title: string
      totalVotes: number
      questions: Array<{
        question: string
        options: Array<{ option: string; count: number; percentage: number }>
      }>
    }> = []

    for (const pollBlock of pollBlocks) {
      const pollBlockId = pollBlock.id
      if (!pollBlockId) continue

      const responses = await prisma.pollResponse.findMany({
        where: { pollBlockId, dppId },
      })

      const config = pollBlock.config || {}
      const questions = (config.questions || []) as Array<{ question?: string; options?: string[] }>

      const questionResults = questions.map((q, questionIndex) => {
        const questionResponses = responses
          .map((r) => (r.responses as { questionIndex?: number; answer?: string }[] | null)?.find((resp) => resp.questionIndex === questionIndex))
          .filter(Boolean)
          .map((resp) => (resp as { answer: string }).answer)

        const optionCounts: Record<string, number> = {}
        ;(q.options || []).forEach((opt: string) => {
          optionCounts[opt] = 0
        })
        questionResponses.forEach((answer) => {
          if (optionCounts[answer] !== undefined) optionCounts[answer]++
        })

        const total = questionResponses.length
        const options = (q.options || []).map((option: string) => ({
          option,
          count: optionCounts[option] || 0,
          percentage: total > 0 ? Math.round(((optionCounts[option] || 0) / total) * 100) : 0,
        }))

        return {
          question: q.question || "Frage",
          options,
        }
      })

      const totalVotes = responses.length
      const firstQuestion = questionResults[0]?.question
      const title = (config as { title?: string }).title || firstQuestion || "Umfrage"

      surveys.push({
        pollBlockId,
        title,
        totalVotes,
        questions: questionResults,
      })
    }

    return NextResponse.json({
      dpp: { id: dpp.id, name: dpp.name, status: dpp.status },
      usage: { totalScans, topRegions },
      surveys,
    })
  } catch (error) {
    console.error("[DPP Stats API] Error:", error)
    return NextResponse.json(
      { error: "Fehler beim Laden der Statistiken" },
      { status: 500 }
    )
  }
}
