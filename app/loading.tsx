export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin mx-auto mb-4 border-4 border-muted-foreground border-t-primary rounded-full"></div>
        <p className="text-muted-foreground text-lg">Cargando...</p>
      </div>
    </div>
  )
}
