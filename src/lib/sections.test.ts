import { describe, expect, it } from "vitest"

import { sectionFromHash } from "./sections.ts"

describe("разбор адреса раздела", () => {
  it("пустой адрес во всех его формах открывает экран выбора", () => {
    expect(sectionFromHash("")).toBe("home")
    expect(sectionFromHash("#")).toBe("home")
    expect(sectionFromHash("#/")).toBe("home")
  })

  it("исследования открываются со слэшем на конце, без него и без ведущего слэша", () => {
    expect(sectionFromHash("#/research")).toBe("research")
    expect(sectionFromHash("#/research/")).toBe("research")
    expect(sectionFromHash("#research")).toBe("research")
  })

  it("хвост адреса раздел не меняет: он зарезервирован под диплинк", () => {
    expect(sectionFromHash("#/research/pal-sphere")).toBe("research")
    expect(sectionFromHash("#/research?level=30")).toBe("research")
  })

  it("навыки палов открываются своим адресом", () => {
    expect(sectionFromHash("#/pal-skills")).toBe("pal-skills")
    expect(sectionFromHash("#/pal-skills/")).toBe("pal-skills")
    expect(sectionFromHash("#/pal-skills?work=Mining")).toBe("pal-skills")
  })

  it("неизвестный адрес ведёт на экран выбора, а не в пустоту", () => {
    expect(sectionFromHash("#/nope")).toBe("home")
    expect(sectionFromHash("#/breeding")).toBe("home")
    expect(sectionFromHash("#//research")).toBe("home")
    // Регистр намеренно не приводим: адреса пишем сами, а угадывать чужие опечатки
    // значит однажды увести на раздел того, кто метил в якорь.
    expect(sectionFromHash("#/Research")).toBe("home")
  })
})
