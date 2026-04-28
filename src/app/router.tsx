import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppLayout } from '@/components/shared/AppLayout'
import BoardPage from '@/pages/board/BoardPage'
import BoardsPage from '@/pages/boards/BoardsPage'
import SettingsPage from '@/pages/settings/SettingsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/boards" replace /> },
      { path: 'boards', element: <BoardsPage /> },
      { path: 'board/:id', element: <BoardPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])
