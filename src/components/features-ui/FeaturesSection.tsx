import {
  Bot,
  Layers,
  MessageCircle,
  Rocket,
  Sparkles,
  SquareKanban,
} from 'lucide-react'

import { FeatureCard } from '@/components/features-ui/FeatureCard'

const items = [
  {
    icon: SquareKanban,
    title: 'Kanban-дошка',
    text: 'Зручныя слупкі, задачы на ўвазе: перацягнуць — стан зменіць, без усходжання ў меню.',
  },
  {
    icon: Sparkles,
    title: 'AI-разбор задач',
    text: 'Вялікая задача — у меншыя крокі: прапанова падзадаў, каб было прасцей брацца ў працу.',
  },
  {
    icon: MessageCircle,
    title: 'Telegram',
    text: 'Паведамленняў дастаткова для нагадванняў і статусаў — не губляйце паток у іншых каналах.',
  },
  {
    icon: Layers,
    title: 'Прасцей працэс',
    text: 'Меньш клікаў, больш зразумелага: ад дошкі да дэталей без звязаных майстроў.',
  },
  {
    icon: Bot,
    title: 'Толькі сутнасць',
    text: 'Ніякіх зайвых экранаў: фокус на задачах і руху, а не на «навігацыі дзеля навігацыі».',
  },
  {
    icon: Rocket,
    title: 'Шпаркі старт',
    text: 'Дошка і першыя карткі за хвіліны — каб хутка перайсці да рэальнай працы.',
  },
] as const

/**
 * Візуальны блок у стылі тёмнага прома (чорны фон, залаты акцэнт, сетка картак).
 * Не з’яўляецца лендынгам — гэта гатовы фрагмент для ўстаўкі куды патрэбна.
 */
export function FeaturesSection() {
  return (
    <section
      className="bg-feature-bg px-4 py-16 text-white sm:px-6 lg:px-8"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-14 text-center">
          <h2
            id="features-heading"
            className="mb-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Усё неабходнае, нічога лішняга
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-sm leading-relaxed text-feature-muted sm:text-base">
            Фокус на зразумелых задачах і хуткім руху — для распрацоўшчыкаў, студэнтаў і
            невялікіх каманд, якім важна не губляць зрок на галоўным.
          </p>
        </header>

        <ul className="grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon, title, text }) => (
            <li key={title}>
              <FeatureCard icon={icon} title={title}>
                {text}
              </FeatureCard>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
