/**
 * GET /api/polls/results
 * 
 * Gibt die Ergebnisse einer Poll zurück
 * 
 * Query Params:
 *   pollBlockId: string  // ID des Poll-Blocks im DppContent.blocks Array
 *   dppId: string
 * 
 * Returns: {
 *   totalResponses: number,
 *   questions: Array<{
 *     question: string,
 *     options: Array<{
 *       option: string,
 *       count: number,
 *       percentage: number
 *     }>
 *   }>
 * }
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pollBlockId = searchParams.get("pollBlockId")
    const dppId = searchParams.get("dppId")

    if (!pollBlockId || !dppId) {
      return NextResponse.json(
        { error: "pollBlockId und dppId sind erforderlich" },
        { status: 400 }
      )
    }

    // Prüfe ob DPP existiert
    const dpp = await prisma.dpp.findUnique({
      where: { id: dppId },
      include: {
        organization: true
      }
    })

    if (!dpp) {
      return NextResponse.json(
        { error: "DPP nicht gefunden" },
        { status: 404 }
      )
    }

    // Prüfe Berechtigung (nur Organisationsmitglieder können Ergebnisse sehen)
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      )
    }

    // Prüfe ob User Mitglied der Organisation ist
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: dpp.organizationId
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      )
    }

    // Hole alle Antworten für diesen Poll
    const responses = await prisma.pollResponse.findMany({
      where: {
        pollBlockId,
        dppId
      }
    })

    // Hole Poll-Konfiguration aus DppContent
    const dppContent = await prisma.dppContent.findFirst({
      where: {
        dppId,
        isPublished: true
      }
    })

    if (!dppContent) {
      return NextResponse.json(
        { error: "DPP Content nicht gefunden" },
        { status: 404 }
      )
    }

    const blocks = dppContent.blocks as any[]
    const pollBlock = blocks.find((block: any) => block.id === pollBlockId)

    if (!pollBlock || pollBlock.type !== 'multi_question_poll') {
      return NextResponse.json(
        { error: "Poll Block nicht gefunden" },
        { status: 404 }
      )
    }

    const config = pollBlock.config || {}
    const questions = config.questions || []

    // Aggregiere Antworten
    const results = questions.map((question: any, questionIndex: number) => {
      const questionResponses = responses
        .map(r => (r.responses as any[]).find((resp: any) => resp.questionIndex === questionIndex))
        .filter(Boolean)
        .map((resp: any) => resp.answer)

      const optionCounts: Record<string, number> = {}
      question.options.forEach((option: string) => {
        optionCounts[option] = 0
      })

      questionResponses.forEach((answer: string) => {
        if (optionCounts[answer] !== undefined) {
          optionCounts[answer]++
        }
      })

      const total = questionResponses.length
      const options = question.options.map((option: string) => ({
        option,
        count: optionCounts[option] || 0,
        percentage: total > 0 ? Math.round((optionCounts[option] || 0) / total * 100) : 0
      }))

      return {
        question: question.question,
        options
      }
    })

    return NextResponse.json({
      totalResponses: responses.length,
      questions: results
    })
  } catch (error) {
    console.error("Error fetching poll results:", error)
    return NextResponse.json(
      { error: "Fehler beim Abrufen der Ergebnisse" },
      { status: 500 }
    )
  }
}
