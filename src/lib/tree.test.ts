import { describe, expect, it } from "vitest"

import {
  isGuessed,
  isSynthesised,
  matches,
  nodeStatus,
  packRows,
  passesFilters,
  visibleTechs,
  NO_FILTERS,
} from "./tree.ts"
import { pointsLabel } from "@/lib/i18n"
import type { Technology } from "@/types/tech"

function tech(id: string, over: Partial<Technology> = {}): Technology {
  return {
    id,
    name: { en: id, ru: id },
    description: { en: "", ru: "" },
    level: 1,
    cost: 1,
    ancient: false,
    category: "Items",
    iconName: id,
    reqTech: null,
    reqBoss: null,
    reqResearch: null,
    unlockBuild: [],
    unlockItems: [id],
    ...over,
  }
}

const sphere = tech("Special_PalSphere_Grade_01", {
  name: { en: "Pal Sphere", ru: "Пал-сфера" },
  level: 2,
})

describe("состояние узла", () => {
  it("изучено побеждает уровень", () => {
    expect(nodeStatus(sphere, new Set([sphere.id]), 1)).toBe("researched")
  })

  it("доступно, когда уровень набран", () => {
    expect(nodeStatus(sphere, new Set(), 2)).toBe("available")
    expect(nodeStatus(sphere, new Set(), 80)).toBe("available")
  })

  it("заблокировано, пока уровень не набран", () => {
    expect(nodeStatus(sphere, new Set(), 1)).toBe("locked")
  })

  it("гейты по боссу и лаборатории узел не красят", () => {
    // Игра не сообщает, побеждён ли босс, поэтому догадываться нельзя —
    // такие требования живут в панели деталей, а не в цвете плитки.
    const gated = tech("Gated", { reqBoss: "Boss", reqResearch: "Lab", level: 1 })
    expect(nodeStatus(gated, new Set(), 1)).toBe("available")
  })
})

describe("поиск", () => {
  it("находит по русскому и английскому названию одинаково", () => {
    expect(matches(sphere, "сфера")).toBe(true)
    expect(matches(sphere, "sphere")).toBe(true)
  })

  it("не зависит от регистра и внешних пробелов", () => {
    expect(matches(sphere, "  СФЕРА ")).toBe(true)
    expect(matches(sphere, "PAL")).toBe(true)
  })

  it("приводит ё к е — в игре пишут так, ищут иначе", () => {
    const pouch = tech("Pouch", { name: { en: "Pouch", ru: "Мешочек" } })
    expect(matches(pouch, "мешочек")).toBe(true)
    expect(matches(pouch, "мешочeк".replace("e", "ё"))).toBe(true)
  })

  it("находит склонённую форму: «сфера» ловит «фабрика сфер»", () => {
    const factory = tech("Line", { name: { en: "Sphere Assembly Line", ru: "Конвейерная фабрика сфер" } })
    expect(matches(factory, "сфера")).toBe(true)
    expect(matches(factory, "sphere")).toBe(true)
  })

  it("не ищет по внутреннему идентификатору", () => {
    // SphereModule_Curve называется «Модуль дуги» — по запросу «sphere»
    // такая строка выглядит случайной, и из-за неё расходились наборы
    // результатов на русском и английском.
    const module = tech("SphereModule_Curve", { name: { en: "Curve Module", ru: "Модуль дуги" } })
    expect(matches(module, "sphere")).toBe(false)
    expect(matches(module, "модуль")).toBe(true)
  })

  it("короткий запрос не расширяется до корня", () => {
    const bow = tech("Bow", { name: { en: "Bow", ru: "Лук" } })
    expect(matches(bow, "лук")).toBe(true)
    // «лука» короче пяти букв: корень не отбрасывается. Иначе поиск ушёл бы
    // на «лу» и поймал полсловаря — порог выбран ради этого.
    expect(matches(bow, "лука")).toBe(false)

    const onion = tech("Onion", { name: { en: "Onion", ru: "Луковица" } })
    expect(matches(onion, "лук")).toBe(true)
  })

  it("пустой запрос пропускает всё", () => {
    expect(matches(sphere, "")).toBe(true)
    expect(matches(sphere, "   ")).toBe(true)
  })

  it("не находит то, чего нет", () => {
    expect(matches(sphere, "дракон")).toBe(false)
  })
})

describe("фильтры", () => {
  it("«только доступные» убирает и изученные, и запертые", () => {
    const filters = { ...NO_FILTERS, availableOnly: true }
    expect(passesFilters(sphere, "available", filters)).toBe(true)
    expect(passesFilters(sphere, "researched", filters)).toBe(false)
    expect(passesFilters(sphere, "locked", filters)).toBe(false)
  })

  it("«только древние» оставляет древние технологии", () => {
    const filters = { ...NO_FILTERS, ancientOnly: true }
    const relic = tech("Relic", { ancient: true })
    expect(passesFilters(relic, "available", filters)).toBe(true)
    expect(passesFilters(sphere, "available", filters)).toBe(false)
  })

  it("«скрыть изученные» не трогает остальные состояния", () => {
    const filters = { ...NO_FILTERS, hideResearched: true }
    expect(passesFilters(sphere, "researched", filters)).toBe(false)
    expect(passesFilters(sphere, "available", filters)).toBe(true)
    expect(passesFilters(sphere, "locked", filters)).toBe(true)
  })

  it("фильтры складываются", () => {
    const relic = tech("Relic", { ancient: true })
    const filters = { availableOnly: true, ancientOnly: true, hideResearched: true }
    expect(passesFilters(relic, "available", filters)).toBe(true)
    expect(passesFilters(relic, "locked", filters)).toBe(false)
  })
})

describe("отбор целиком", () => {
  it("размечает статусом и уважает и поиск, и фильтры", () => {
    const list = [
      sphere,
      tech("Relic", { name: { en: "Ancient Sphere", ru: "Древняя сфера" }, ancient: true, level: 40 }),
      tech("Axe", { name: { en: "Stone Axe", ru: "Каменный топор" } }),
    ]
    const result = visibleTechs(list, new Set(), 10, "сфера", NO_FILTERS)

    expect(result.map((item) => item.tech.id)).toEqual(["Special_PalSphere_Grade_01", "Relic"])
    expect(result.map((item) => item.status)).toEqual(["available", "locked"])
  })
})

describe("пометки достоверности", () => {
  it("помечается всё, кроме связей из игры", () => {
    expect(isSynthesised("hard")).toBe(false)
    expect(isSynthesised("manual")).toBe(true)
    expect(isSynthesised("stem")).toBe(true)
    expect(isSynthesised("name")).toBe(true)
  })

  it("догадка алгоритма отделена от вычитанного человеком", () => {
    expect(isGuessed("stem")).toBe(true)
    expect(isGuessed("name")).toBe(true)
    expect(isGuessed("manual")).toBe(false)
    expect(isGuessed("hard")).toBe(false)
  })
})

describe("раскладка узлов без цепочки", () => {
  it("узлы одного уровня разъезжаются по разным рядам", () => {
    const rows = packRows([tech("A", { level: 5 }), tech("B", { level: 5 })], 2)
    expect(rows).toHaveLength(2)
  })

  it("далеко стоящие узлы делят один ряд", () => {
    const rows = packRows([tech("A", { level: 1 }), tech("B", { level: 40 })], 2)
    expect(rows).toHaveLength(1)
    expect(rows[0].map((item) => item.id)).toEqual(["A", "B"])
  })

  it("ни один узел не теряется и не дублируется", () => {
    const members = Array.from({ length: 40 }, (_, index) =>
      tech(`T${index}`, { level: (index % 8) + 1 }),
    )
    const flat = packRows(members, 3).flat().map((item) => item.id)
    expect(flat).toHaveLength(members.length)
    expect(new Set(flat).size).toBe(members.length)
  })
})

describe("склонение очков", () => {
  it("русский требует трёх форм", () => {
    expect(pointsLabel(1, "ru", false)).toBe("очко")
    expect(pointsLabel(2, "ru", false)).toBe("очка")
    expect(pointsLabel(4, "ru", false)).toBe("очка")
    expect(pointsLabel(5, "ru", false)).toBe("очков")
    expect(pointsLabel(9, "ru", false)).toBe("очков")
  })

  it("подростковые числа — исключение из правила последней цифры", () => {
    expect(pointsLabel(11, "ru", false)).toBe("очков")
    expect(pointsLabel(12, "ru", false)).toBe("очков")
    expect(pointsLabel(14, "ru", false)).toBe("очков")
    expect(pointsLabel(21, "ru", false)).toBe("очко")
    expect(pointsLabel(22, "ru", false)).toBe("очка")
    expect(pointsLabel(111, "ru", false)).toBe("очков")
  })

  it("древние очки склоняются так же", () => {
    expect(pointsLabel(1, "ru", true)).toBe("древнее очко")
    expect(pointsLabel(3, "ru", true)).toBe("древних очка")
    expect(pointsLabel(8, "ru", true)).toBe("древних очков")
  })

  it("английскому хватает двух форм", () => {
    expect(pointsLabel(1, "en", false)).toBe("point")
    expect(pointsLabel(2, "en", false)).toBe("points")
    expect(pointsLabel(1, "en", true)).toBe("ancient point")
    expect(pointsLabel(11, "en", true)).toBe("ancient points")
  })
})
