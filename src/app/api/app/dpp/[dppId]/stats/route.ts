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

    // Nutzung: Scans aus DppScan (Fallback wenn Tabelle/Client fehlt)
    let totalScans = 0
    let topRegions: Array<{ region: string; scans: number }> = []
    let scanTimeSeries: Array<{ date: string; scans: number }> = []

    if (typeof prisma.dppScan?.count === "function") {
      try {
        const [totalScansResult, topRegionsResult, scanTimeSeriesRaw] = await Promise.all([
          prisma.dppScan.count({ where: { dppId } }),
          prisma.dppScan.groupBy({
            by: ["region"],
            where: {
              dppId,
              region: { not: null },
            },
            _count: { id: true },
          }),
          prisma.$queryRaw<Array<{ date: string; scans: bigint }>>`
            SELECT date_trunc('day', "scannedAt")::date::text AS date, count(*)::bigint AS scans
            FROM dpp_scans
            WHERE "dppId" = ${dppId}
              AND "scannedAt" >= (current_date - interval '30 days')
            GROUP BY date_trunc('day', "scannedAt")
            ORDER BY date ASC
          `,
        ])
        totalScans = totalScansResult
        topRegions = topRegionsResult
          .sort((a, b) => b._count.id - a._count.id)
          .slice(0, 3)
          .map((r) => ({
            region: r.region ?? "Unbekannt",
            scans: r._count.id,
          }))
        scanTimeSeries = (scanTimeSeriesRaw ?? []).map((row) => ({
          date: row.date,
          scans: Number(row.scans),
        }))
      } catch (scanErr) {
        console.warn("[DPP Stats API] DppScan abfrage fehlgeschlagen (Tabelle fehlt?), Fallback 0:", scanErr)
      }
    }

    // Umfragen: Poll-Blöcke aus published content
    const dppContent = await prisma.dppContent.findFirst({
      where: { dppId, isPublished: true },
      select: { blocks: true },
    })

    const blocks = Array.isArray(dppContent?.blocks) ? dppContent.blocks : []
    const pollBlocks = (blocks as { id?: string; type?: string; config?: { questions?: unknown[]; title?: string }; content?: { questions?: unknown[]; title?: string } }[]).filter(
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

      // Blöcke werden mit content.questions gespeichert (Editor), ggf. Legacy config.questions
      const blockConfig = pollBlock.config || {}
      const blockContent = pollBlock.content || {}
      const questions = (blockContent.questions ?? blockConfig.questions ?? []) as Array<{ question?: string; options?: string[] }>

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
      const title = (blockContent as { title?: string }).title ?? (blockConfig as { title?: string }).title ?? firstQuestion ?? "Umfrage"

      surveys.push({
        pollBlockId,
        title,
        totalVotes,
        questions: questionResults,
      })
    }

    return NextResponse.json({
      dpp: { id: dpp.id, name: dpp.name, status: dpp.status },
      usage: { totalScans, topRegions, scanTimeSeries },
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
