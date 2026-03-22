import { AppWrapper } from '@/components/providers/app/app-wrapper'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppWrapper>{children}</AppWrapper>
}
