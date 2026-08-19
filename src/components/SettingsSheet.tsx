import type { ReactNode } from "react"
import { LaptopIcon, MoonIcon, SettingsIcon, SunIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { Theme } from "@/hooks/useProgress"
import { t } from "@/lib/i18n"
import { NODE_SIZE_KEYS, nodeMetrics, type NodeSizeKey } from "@/lib/nodeSize"
import { cn } from "@/lib/utils"
import type { Locale } from "@/types/tech"

type UiKey = Parameters<typeof t>[0]

const THEMES: { value: Theme; label: UiKey; icon: typeof SunIcon }[] = [
  { value: "system", label: "themeSystem", icon: LaptopIcon },
  { value: "light", label: "themeLight", icon: SunIcon },
  { value: "dark", label: "themeDark", icon: MoonIcon },
]

const SIZE_LABEL: Record<NodeSizeKey, UiKey> = {
  s: "sizeS",
  m: "sizeM",
  l: "sizeL",
  xl: "sizeXl",
  xxl: "sizeXxl",
}

interface SettingsSheetProps {
  locale: Locale
  theme: Theme
  nodeSize: NodeSizeKey
  triggerClassName?: string
  onLocale: (locale: Locale) => void
  onTheme: (theme: Theme) => void
  onNodeSize: (size: NodeSizeKey) => void
}

/**
 * Настройки живут в листе, а не в шапке: язык и тема нужны раз в жизни, а
 * место в тулбаре — постоянно, особенно на телефоне.
 */
export function SettingsSheet({
  locale,
  theme,
  nodeSize,
  triggerClassName,
  onLocale,
  onTheme,
  onNodeSize,
}: SettingsSheetProps) {
  return (
    <Sheet>
      <SheetTrigger
        className={cn(
          "grid aspect-square shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors",
          "hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
          triggerClassName,
        )}
        aria-label={t("settings", locale)}
        title={t("settings", locale)}
      >
        <SettingsIcon className="size-4" />
      </SheetTrigger>

      <SheetContent side="right" className="overflow-y-auto" showCloseButton={false}>
        {/* Своя кнопка вместо штатной: та 28 px и подписана по-английски. */}
        <SheetClose
          render={
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 size-11">
              <XIcon />
            </Button>
          }
          aria-label={t("close", locale)}
        />
        <SheetHeader className="pr-12">
          <SheetTitle>{t("settings", locale)}</SheetTitle>
          <SheetDescription className="sr-only">{t("settings", locale)}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-6">
          <Group title={t("settingsLanguage", locale)}>
            <Segmented>
              {(["ru", "en"] as const).map((code) => (
                <Option
                  key={code}
                  active={locale === code}
                  label={code === "ru" ? "Русский" : "English"}
                  onSelect={() => onLocale(code)}
                />
              ))}
            </Segmented>
          </Group>

          <Group title={t("settingsTheme", locale)}>
            <Segmented>
              {THEMES.map((item) => {
                const Icon = item.icon
                return (
                  <Option
                    key={item.value}
                    active={theme === item.value}
                    label={t(item.label, locale)}
                    icon={<Icon className="size-4" />}
                    onSelect={() => onTheme(item.value)}
                  />
                )
              })}
            </Segmented>
          </Group>

          <Group title={t("settingsNodeSize", locale)}>
            <div className="flex flex-col gap-2">
              {NODE_SIZE_KEYS.map((key) => {
                const { tile } = nodeMetrics(key).step
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onNodeSize(key)}
                    aria-pressed={nodeSize === key}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                      nodeSize === key
                        ? "border-ring bg-accent"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {/* Предпросмотр той же плитки, что увидишь в дереве. */}
                    <span
                      aria-hidden
                      className="shrink-0 rounded-md border bg-card shadow-sm"
                      style={{ width: tile / 2, height: tile / 2 }}
                    />
                    <span className="flex-1">{t(SIZE_LABEL[key], locale)}</span>
                    <span className="font-mono text-xs tabular-nums">{tile}</span>
                  </button>
                )
              })}
            </div>
          </Group>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      {children}
    </section>
  )
}

function Segmented({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-1 rounded-lg bg-muted p-1">{children}</div>
}

function Option({
  active,
  label,
  icon,
  onSelect,
}: {
  active: boolean
  label: string
  icon?: ReactNode
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md px-2 text-xs transition-colors pointer-coarse:min-h-11",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        active
          ? "bg-background text-foreground shadow-xs"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  )
}
