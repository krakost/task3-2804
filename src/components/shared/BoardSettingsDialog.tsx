import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/features/auth/store'
import {
  useAddBoardMember,
  useBoardMembers,
  useRemoveBoardMember,
  useSearchProfiles,
} from '@/hooks/useBoardMembers'

export type BoardSettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  boardId: string | null
  boardTitle?: string | null
  ownerUserId: string | null
}

export function BoardSettingsDialog({
  open,
  onOpenChange,
  boardId,
  boardTitle,
  ownerUserId,
}: BoardSettingsDialogProps) {
  const { t } = useTranslation()
  const currentUser = useAuthStore((s) => s.user)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 400)
    return () => window.clearTimeout(timer)
  }, [query])

  const membersQuery = useBoardMembers(boardId, open)
  const searchQuery = useSearchProfiles(debouncedQuery)
  const addMember = useAddBoardMember()
  const removeMember = useRemoveBoardMember()

  const [addingId, setAddingId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setDebouncedQuery('')
    }
  }, [open])

  const memberIds = useMemo(
    () => new Set(membersQuery.data?.map((m) => m.userId) ?? []),
    [membersQuery.data],
  )

  const rawSearchHits = useMemo(
    () => searchQuery.data ?? [],
    [searchQuery.data],
  )

  const searchHits = useMemo(() => {
    const hits = rawSearchHits
    if (!currentUser?.id || ownerUserId == null || ownerUserId === '')
      return hits
    return hits.filter(
      (h) =>
        h.id !== currentUser.id &&
        h.id !== ownerUserId &&
        !memberIds.has(h.id),
    )
  }, [rawSearchHits, currentUser, ownerUserId, memberIds])

  async function handleAdd(userId: string) {
    if (!boardId) return
    setAddingId(userId)
    addMember.reset()
    try {
      await addMember.mutateAsync({ boardId, userId })
    } finally {
      setAddingId(null)
    }
  }

  async function handleRemove(userId: string) {
    if (!boardId) return
    setRemovingId(userId)
    removeMember.reset()
    try {
      await removeMember.mutateAsync({ boardId, userId })
    } finally {
      setRemovingId(null)
    }
  }

  const membersBusy = membersQuery.isFetching

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(90vh,36rem)] flex-col gap-4 sm:max-w-md"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {t('boardSettings.dialogTitle')}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {boardTitle ? (
              <>{t('boardSettings.descriptionNamed', { title: boardTitle })}</>
            ) : (
              <>{t('boardSettings.descriptionGeneric')}</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <section className="shrink-0 space-y-2">
            <h3 className="text-sm font-medium text-foreground">
              {t('boardSettings.membersHeading')}
            </h3>
            <div className="max-h-40 overflow-auto rounded-md border border-border">
              {membersBusy ? (
                <p className="p-3 text-sm text-muted-foreground">
                  {t('common.loading')}
                </p>
              ) : !membersQuery.data?.length ? (
                <p className="p-3 text-sm text-muted-foreground">
                  {t('boardSettings.membersEmpty')}
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {membersQuery.data.map((m) => (
                    <li
                      key={m.userId}
                      className="flex items-center justify-between gap-2 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{m.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {m.email}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="shrink-0 text-destructive hover:bg-destructive/10"
                        disabled={
                          removingId === m.userId || removeMember.isPending
                        }
                        onClick={() => void handleRemove(m.userId)}
                      >
                        {removingId === m.userId
                          ? '…'
                          : t('boardSettings.memberRemove')}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {removeMember.error ? (
              <p className="text-sm text-destructive" role="alert">
                {removeMember.error.message}
              </p>
            ) : null}
          </section>

          <section className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
            <Label htmlFor="board-settings-user-search">
              {t('boardSettings.userSearchLabel')}
            </Label>
            <Input
              id="board-settings-user-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('boardSettings.userSearchPlaceholder')}
              autoComplete="off"
            />
            {addMember.error ? (
              <p className="text-sm text-destructive" role="alert">
                {addMember.error.message}
              </p>
            ) : null}
            <div className="min-h-0 flex-1 overflow-auto rounded-md border border-border">
              {query.trim().length < 2 ? (
                <p className="p-3 text-sm text-muted-foreground">
                  {t('boardSettings.queryHint')}
                </p>
              ) : searchQuery.isError ? (
                <p className="p-3 text-sm text-destructive" role="alert">
                  {searchQuery.error instanceof Error
                    ? searchQuery.error.message
                    : t('common.searchError')}
                </p>
              ) : debouncedQuery.length < 2 ? (
                <p className="p-3 text-sm text-muted-foreground">
                  {t('boardSettings.searching')}
                </p>
              ) : searchQuery.isFetching ? (
                <p className="p-3 text-sm text-muted-foreground">
                  {t('boardSettings.searching')}
                </p>
              ) : searchHits.length === 0 ? (
                rawSearchHits.length > 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">
                    {t('boardSettings.allFilteredOut')}
                  </p>
                ) : (
                  <p className="p-3 text-sm text-muted-foreground">
                    {t('boardSettings.noMatches')}
                    <strong className="font-medium text-foreground">
                      {' '}
                      {t('boardSettings.noMatchesBold')}
                    </strong>{' '}
                    {t('boardSettings.noMatchesTail')}
                  </p>
                )
              ) : (
                <ul className="divide-y divide-border">
                  {searchHits.map((u) => (
                    <li
                      key={u.id}
                      className="flex items-center justify-between gap-2 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{u.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {u.email}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={
                          addingId === u.id ||
                          addMember.isPending ||
                          !boardId
                        }
                        onClick={() => void handleAdd(u.id)}
                      >
                        {addingId === u.id
                          ? '…'
                          : t('boardSettings.memberAdd')}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
