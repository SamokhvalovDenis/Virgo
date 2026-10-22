import type { ServiceCategoryId } from './categories'

export type DetailText = { text: string; needsApproval?: boolean }
export type DetailContent =
  | ({ type: 'paragraph' } & DetailText)
  | { type: 'list'; items: DetailText[] }
export type ServiceDetail = {
  id: string
  sourceTitle: string
  title: string
  image: { src: string; alt: string; width: number; height: number }
  content: DetailContent[]
}
export type ServiceDetailPage = {
  categoryId: ServiceCategoryId
  path: `/sluzby/${string}`
  title: string
  blocks: ServiceDetail[]
}

export const serviceDetailUi = {
  eyebrow: 'Naše služby',
  back: 'Zpět na všechny služby',
  missingImage: 'Fotografie této procedury není dostupná.',
  notFound: 'Stránka nebyla nalezena',
}

const paragraph = (text: string, needsApproval = false): DetailContent => ({ type: 'paragraph', text, needsApproval })
const list = (items: string[], reviewIndices: number[] = []): DetailContent => ({
  type: 'list', items: items.map((text, index) => ({ text, needsApproval: reviewIndices.includes(index) })),
})
const photo = (file: string, alt: string, width = 600, height = 300) => ({ src: `/images/virgo-original/${file}.jpg`, alt, width, height })

// Source: https://virgostudio.godaddysites.com/, Naše služby, checked 2026-10-16.
// Preserve the original section/ABOUT_* index pairing, not the approximate image-report labels.
// Unverified claims are flagged internally for the owner's review, without public editorial notes.
export const serviceDetailPages: ServiceDetailPage[] = [
  {
    categoryId: 'massage', path: '/sluzby/masaze', title: 'Masáže',
    blocks: [
      {
        id: 'massage-classic-group', sourceTitle: 'Sportovní, klasické, regenerační a rekondiční...',
        title: 'Sportovní, klasické, regenerační a rekondiční masáže',
        image: photo('virgo-57e4e1920ab5', 'Masáž zad a ramen muže na masážním lehátku.'),
        content: [paragraph('Tyto druhy masáží působí pozitivně na celý organismus, zlepšují prokrvení, snižují bolestivost svalů a stres a uvolňují napětí. Povzbuzují cirkulaci tělesných tekutin v celém těle a zlepšují přísun živin. Zvyšují úroveň energie.', true)],
      },
      {
        id: 'massage-honey', sourceTitle: 'Medová a detoxikační', title: 'Medová a detoxikační masáž',
        image: photo('virgo-e08883f6e9ba', 'Nanášení medu na záda při medové masáži.', 600, 299),
        content: [paragraph('Používáme přírodní med, který při masáži absorbuje a extrahuje škodlivé látky a nečistoty z hloubky pokožky. Masáž doporučujeme při revmatických onemocněních svalů a kloubů, chronickém únavovém syndromu, bolestech hlavy a migrénách, depresi a celulitidě. Tato masáž urychluje metabolismus a zlepšuje imunitu i krevní a lymfatický oběh. Po masáži je pokožka jemná, hladká a příjemně voní po medu.', true)],
      },
      {
        id: 'massage-hot-stones', sourceTitle: 'Lavovými kameny', title: 'Masáž lávovými kameny',
        image: photo('virgo-e462497b5730', 'Masáž zad zahřátými lávovými kameny.'),
        content: [paragraph('Uvolňuje svaly, mysl i duši, prohřívá celé tělo, přináší hlubokou relaxaci a harmonizuje organismus. Je také jemným, ale účinným prostředkem proti bolestem zad, svalů a hlavy. Tato masáž se doporučuje v období chronického stresu, při zpomaleném metabolismu nebo při problémech s lymfatickým a krevním systémem.', true)],
      },
      {
        id: 'massage-chocolate', sourceTitle: 'Čokoládová', title: 'Čokoládová masáž',
        image: photo('virgo-ad46cdec38ca', 'Čokoládová masáž zad.'),
        content: [paragraph('Zahřátý olej pokožku vyživuje, hydratuje a dodává jí sametový pocit. Teplá čokoládová masáž navíc prohřeje klouby končetin. Procedura uvolňuje napětí, zklidňuje nervový systém a zlepšuje celkovou pohodu. Při vdechování čokoládového aroma začíná mozek vysílat signály k tvorbě hormonu štěstí, který má pozitivní vliv na zdraví.', true)],
      },
      {
        id: 'massage-cupping', sourceTitle: 'Baňkování', title: 'Baňkování',
        image: photo('virgo-04aa20c10c49', 'Skleněné baňky na zádech při baňkování.'),
        content: [paragraph('Baňkování je oblíbená procedura využívaná při osteochondróze páteře a šíje, celulitidě, korekci postavy a bolestech zad. Příznivě ovlivňuje funkci vnitřních orgánů a detoxikuje organismus. Příznivě působí na lymfatický systém a přináší úlevu při astmatu, zánětech průdušek a kašli.', true)],
      },
      {
        id: 'massage-anticellulite', sourceTitle: 'Proti celulitidě', title: 'Masáž proti celulitidě',
        image: photo('virgo-9f3e933515fe', 'Ruční masáž stehen a pokožky nohou.'),
        content: [paragraph('Anticelulitidová masáž pomáhá vyhlazovat takzvanou pomerančovou kůži a zlepšovat krevní oběh. Může zlepšit vzhled celulitidy odstraněním přebytečné tekutiny z těla, redistribucí tukových buněk a zvýšením elasticity pokožky.', true)],
      },
      {
        id: 'massage-maderotherapy', sourceTitle: 'Maderoterapie', title: 'Maderoterapie',
        image: photo('virgo-1a1a8b2c68a7', 'Masáž dřevěnými válečky při maderoterapii.', 526, 300),
        content: [
          paragraph('Maderoterapie je unikátní masážní technika, která se provádí pomocí anatomicky tvarovaných dřevěných válečků.'),
          paragraph('Masážní účinky:'),
          list(['Snižuje objem těla.', 'Zlepšuje odbourávání tuků.', 'Podporuje odstraňování toxinů a odpadních látek.', 'Redukuje projevy celulitidy.', 'Zvyšuje svalový tonus.'], [0, 1, 2, 3, 4]),
          paragraph('Pomocí maderoterapie se pokožka stává pružnější a napnutější.', true),
        ],
      },
      {
        id: 'massage-ayurveda', sourceTitle: 'Ayurvédská', title: 'Ájurvédská masáž',
        image: photo('virgo-36d0ce4d8c4c', 'Olejová masáž zad a ramen.', 391, 300),
        content: [
          paragraph('Ájurvédská olejová masáž je unikátní technika indické masáže založená na hluboké práci s měkkými tkáněmi lidského těla. Je považována za nejdůležitější proceduru, která má zklidňující účinek na celý nervový systém. Ájurvédská masáž umožňuje dosáhnout následujících výsledků:', true),
          list(['Zlepšení krevního oběhu.', 'Odstranění toxinů z těla.', 'Zlepšení elasticity svalů a tkání.', 'Zvýšení pružnosti kloubů.', 'Zjemnění pokožky a dodání lesku.'], [0, 1, 2, 3]),
        ],
      },
      {
        id: 'massage-indian-head', sourceTitle: 'Indická masáž hlavy', title: 'Indická masáž hlavy',
        image: photo('virgo-1d773a971214', 'Masáž pokožky hlavy a vlasové části hlavy.'),
        content: [paragraph('Hlava je středem všech myšlenek a činů člověka. Při péči o tělo však zdaleka nebývá na prvním místě. Masáž hlavy je nejen užitečná pro každého, ale přináší i mnoho příjemných pocitů. Navozuje celkovou i místní svalovou relaxaci, snižuje celkovou únavu, depresi a stres, zlepšuje paměť, zvyšuje pracovní výkonnost, zmírňuje bolesti hlavy, obnovuje spánek, normalizuje krevní tlak a zlepšuje sekreční funkci mazových a potních žláz i mikrocirkulaci vlasové pokožky, což pomáhá stimulovat vlasové folikuly.', true)],
      },
      {
        id: 'massage-thai-feet', sourceTitle: 'Thajská masáž nohou', title: 'Thajská masáž nohou',
        image: photo('virgo-822fa23c1df2', 'Masáž chodidla pomocí dřevěné tyčinky.', 600, 298),
        content: [paragraph('Technika thajské masáže nohou je považována za jednu z nejstarších masážních technik. Přišla k nám z východní Asie a získala si důvěru Evropanů. Thajská masáž nohou je umění doteku zaměřené na obnovení energetické rovnováhy těla a probuzení jeho vnitřních zásob. Tento typ masáže je založen na teorii vnějších linií, které procházejí chodidly a odrážejí stav celého těla. Provádí se pomocí dřevěných tyčinek zaměřených na ošetření aktivních bodů.', true)],
      },
    ],
  },
  {
    categoryId: 'depilation', path: '/sluzby/depilace', title: 'Depilace',
    blocks: [
      {
        id: 'depilation-sugaring', sourceTitle: 'Depilace cukrovou pastou (sugaring)', title: 'Depilace cukrovou pastou (sugaring)',
        image: photo('virgo-0f0fb8661ddc', 'Cukrová pasta na špachtli při depilaci.'),
        content: [paragraph('Chloupky odstraňujeme přírodní cukrovou pastou.'), list(['Šetrný a jemný způsob depilace.', 'Vhodný pro ženy i muže.', 'Ideální pro intimní partie.', 'Odstraňuje odumřelé kožní buňky.', 'Dlouhodobý efekt.'])],
      },
      {
        id: 'depilation-wax', sourceTitle: 'Vosková depilace', title: 'Vosková depilace',
        image: photo('virgo-d4e7458b47ef', 'Depilační vosk a vosková depilace nohy.'),
        content: [list(['Používáme výhradně kvalitní vosk.', 'Důkladné odstranění chloupků.', 'Sametově hladká pokožka.', 'Dlouhotrvající výsledky.'])],
      },
      {
        id: 'depilation-vajacial', sourceTitle: 'Vajacial/manjacial', title: 'Vajacial / manjacial',
        image: photo('virgo-00cad37d37f4', 'Koláž péče o intimní oblast, pokožku a depilace.'),
        content: [
          paragraph('Speciální kosmetické ošetření intimní oblasti.'),
          paragraph('Ošetření zahrnuje očištění pokožky, jemný peeling, odstranění zarostlých chloupků a odumřelých kožních buněk. Následuje přístrojové ošetření podle typu pokožky a problémů klienta, pečující maska a sérum.'),
          paragraph('Mezi výhody ošetření vajacial / manjacial patří znatelně čistší a hladší pokožka intimní oblasti. Ošetření pomáhá nejen s regenerací pokožky v nejintimnějších partiích, ale také s odstraněním zarostlých chloupků a černých teček, zlepšením krevního oběhu a elasticity pokožky, odstraněním odumřelých buněk, prevencí akné a zesvětlením hyperpigmentace. Dodává také pocit hygienické jistoty.', true),
        ],
      },
    ],
  },
  {
    categoryId: 'hair-removal', path: '/sluzby/trvale-odstraneni-chloupku', title: 'Trvalé odstranění chloupků',
    blocks: [
      {
        id: 'hair-removal-why', sourceTitle: 'Proč přijít na odstránění chloupků?', title: 'Proč přijít na odstranění chloupků?',
        image: photo('virgo-0d9eb7910850', 'Přístrojové odstranění chloupků na nohou.', 600, 800),
        content: [
          paragraph('Díky nejmodernějšímu přístroji jsme schopni odstranit chloupky téměř kdekoli na těle: na obličeji, v podpaží, na rukou, nohou, tříslech, intimních partiích, hrudníku, břiše či zádech.'),
          paragraph('Naše zařízení je bezpečné, špičkové a certifikované. Naše zkušená odbornice vám pomůže zapomenout na žiletku, ať už jste žena, nebo muž.', true),
          paragraph('Eliminujeme problémy se zarůstajícími chloupky a podrážděním pokožky. Díky dynamickému chlazení pokožky probíhá ošetření bezbolestně.', true),
        ],
      },
      {
        id: 'hair-removal-information', sourceTitle: 'Důležité informace o proceduře', title: 'Důležité informace o proceduře',
        image: photo('virgo-8505d6a20e52', 'Přístrojové ošetření pokožky břicha.', 600, 800),
        content: [paragraph('Procedura ničí pouze pigmentované chloupky v aktivní fázi růstu. Chloupky nevypadávají hned, ale během 14–21 dnů po proceduře. Po jednom sezení vypadne přibližně 25 až 50 % chloupků. Pro dosažení trvalých výsledků se obvykle doporučuje 6 až 10 sezení v závislosti na typu pokožky, barvě a hustotě chloupků. Po absolvování hlavní série je potřeba provádět udržovací procedury 1–2krát ročně. Vše je individuální.', true)],
      },
    ],
  },
  {
    categoryId: 'brows-lashes', path: '/sluzby/oboci-a-rasy', title: 'Péče o obočí a řasy',
    blocks: [
      {
        id: 'brows-lash-lifting', sourceTitle: 'Lash lifting', title: 'Lash lifting',
        image: photo('virgo-502a15dc4066', 'Detail oka a natočených řas.', 600, 451),
        content: [paragraph('Je pro vás vhodný, pokud:'), list(['Máte rovné, nevýrazné řasy.', 'Chcete opticky zvětšit objem svých řas.', 'Chcete zlepšit kvalitu, vyživit a posílit vlastní řasy.'], [2])],
      },
      {
        id: 'brows-lamination', sourceTitle: 'Laminace obočí', title: 'Laminace obočí',
        image: photo('virgo-6fe049d7d58f', 'Detail upravených a vyčesaných chloupků obočí.'),
        content: [paragraph('Laminace obočí je metoda úpravy obočí.'), paragraph('Je pro vás vhodná, pokud:'), list(['Máte neposedné chloupky obočí, které se kroutí.', 'Chcete dlouhodobě fixovat tvar obočí.', 'Chcete zlepšit kvalitu svého obočí.'], [2])],
      },
      {
        id: 'brows-color', sourceTitle: 'Barvení obočí a řas', title: 'Barvení obočí a řas',
        image: photo('virgo-f39a8a85b2b1', 'Barvení řas s ochrannou podložkou pod okem.', 600, 451),
        content: [paragraph('Je pro vás vhodné, pokud:'), list(['Chcete dlouhodobě zvýraznit barvu a tvar obočí a řas.', 'Chcete zlepšit kvalitu svého obočí a řas.'], [1])],
      },
    ],
  },
]
