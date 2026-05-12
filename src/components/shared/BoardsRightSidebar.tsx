import { type FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Settings, Trash2 } from 'lucide-react'

import { BoardSettingsDialog } from '@/components/shared/BoardSettingsDialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/features/auth/store'
import { useBoards, useCreateBoard, useDeleteBoard } from '@/hooks/useBoards'
import { cn } from '@/lib/utils'

export function BoardsRightSidebar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const { data: boards = [], isFetching } = useBoards()
  const createBoard = useCreateBoard()
  const deleteBoard = useDeleteBoard()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [boardSettingsOpen, setBoardSettingsOpen] = useState(false)
  const [boardSettingsBoardId, setBoardSettingsBoardId] = useState<
    string | null
  >(null)
  const [boardSettingsTitle, setBoardSettingsTitle] = useState<string | null>(
    null,
  )
  const [boardSettingsOwnerId, setBoardSettingsOwnerId] = useState<
    string | null
  >(null)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    title: string
  } | null>(null)

  useEffect(() => {
    if (!deleteTarget) return
    deleteBoard.reset()
  }, [deleteTarget, deleteBoard])

  function resetDialog() {
    setTitle('')
    createBoard.reset()
  }

  function handleOpenChange(next: boolean) {
    setDialogOpen(next)
    if (!next) resetDialog()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    createBoard.reset()
    try {
      const board = await createBoard.mutateAsync(title)
      setDialogOpen(false)
      resetDialog()
      void navigate(`/board/${board.id}`)
    } catch {
      // error surfaced via mutation state
    }
  }

  const busy = createBoard.isPending

  return (
    <>
      <div className="sticky top-6 rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {t('boardsSidebar.title')}
            </p>
            <p className="text-xs text-muted-foreground">
              {isFetching
                ? t('common.loading')
                : t('boardsSidebar.total', { count: boards.length })}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setDialogOpen(true)}
          >
            {t('boardsSidebar.createBoard')}
          </Button>
        </div>

        <div className="max-h-[calc(100vh-10rem)] overflow-auto p-2">
          {isFetching ? (
            <div className="space-y-1">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={`board-list-skel-${idx}`}
                  className="h-8 w-full animate-pulse rounded-md bg-muted"
                />
              ))}
            </div>
          ) : boards.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">
              {t('boardsSidebar.noBoardsYet')}
            </div>
          ) : (
            <div className="space-y-1">
              {boards.map((b) => (
                <div
                  key={b.id}
                  className="flex min-w-0 items-center gap-0.5 rounded-md hover:bg-muted/60"
                >
                  <NavLink
                    to={`/board/${b.id}`}
                    className={({ isActive }) =>
                      cn(
                        'flex min-w-0 flex-1 items-center rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                        isActive && 'bg-accent text-accent-foreground',
                      )
                    }
                  >
                    <span className="truncate">{b.title}</span>
                  </NavLink>
                  {user?.id === b.user_id ? (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                        aria-label={t('boardsSidebar.ariaSettings', {
                          title: b.title,
                        })}
                        onClick={(e) => {
                          e.preventDefault()
                          setBoardSettingsBoardId(b.id)
                          setBoardSettingsTitle(b.title)
                          setBoardSettingsOwnerId(b.user_id)
                          setBoardSettingsOpen(true)
                        }}
                      >
                        <Settings />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label={t('boardsSidebar.ariaDelete', {
                          title: b.title,
                        })}
                        disabled={deleteBoard.isPending}
                        onClick={(e) => {
                          e.preventDefault()
                          setDeleteTarget({ id: b.id, title: b.title })
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="gap-4 sm:max-w-[22rem]" showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              {t('boardsSidebar.dialogCreateTitle')}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t('boardsSidebar.dialogCreateDescription')}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="create-board-title">{t('common.title')}</Label>
              <Input
                id="create-board-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('boardsSidebar.namePlaceholder')}
                autoComplete="off"
                disabled={busy}
                required
                minLength={1}
                aria-invalid={Boolean(createBoard.error)}
              />
            </div>
            {createBoard.error ? (
              <p className="text-sm text-destructive" role="alert">
                {createBoard.error.message}
              </p>
            ) : null}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => handleOpenChange(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? t('common.creating') : t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent className="gap-4 sm:max-w-[22rem]" showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              {t('boardsSidebar.deleteConfirmTitle')}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {deleteTarget
                ? t('boardsSidebar.deleteConfirmDescription', {
                    title: deleteTarget.title,
                  })
                : null}
            </DialogDescription>
          </DialogHeader>
          {deleteBoard.error ? (
            <p className="text-sm text-destructive" role="alert">
              {deleteBoard.error.message}
            </p>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={deleteBoard.isPending}
              onClick={() => setDeleteTarget(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteBoard.isPending || deleteTarget == null}
              onClick={() => {
                if (deleteTarget == null) return
                const boardId = deleteTarget.id
                deleteBoard.mutate(boardId, {
                  onSuccess: () => {
                    setDeleteTarget(null)
                    if (location.pathname === `/board/${boardId}`) {
                      void navigate('/boards')
                    }
                  },
                })
              }}
            >
              {deleteBoard.isPending ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BoardSettingsDialog
        open={boardSettingsOpen}
        onOpenChange={(next) => {
          setBoardSettingsOpen(next)
          if (!next) {
            setBoardSettingsBoardId(null)
            setBoardSettingsTitle(null)
            setBoardSettingsOwnerId(null)
          }
        }}
        boardId={boardSettingsBoardId}
        boardTitle={boardSettingsTitle}
        ownerUserId={boardSettingsOwnerId}
      />
    </>
  )
}
