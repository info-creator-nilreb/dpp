export const dynamic = "force-dynamic"

export default function TestPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Test Page</h1>
      <p>If you can see this, the route is working.</p>
    </div>
  )
}

