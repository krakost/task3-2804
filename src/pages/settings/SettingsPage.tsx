import { useTranslation } from 'react-i18next'

export default function SettingsPage() {
  const { t } = useTranslation()
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t('settingsPage.title')}
      </h1>
      <p className="text-muted-foreground">{t('settingsPage.description')}</p>
    </div>
  )
}
