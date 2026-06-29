import { Outlet } from 'react-router-dom'
import { SidebarLayout } from '../components/Sidebar'
import { PageTransition } from '../components/PageTransition'

export function MainLayout() {
  return (
    <SidebarLayout>
      <PageTransition>
        <Outlet />
      </PageTransition>
    </SidebarLayout>
  )
}
