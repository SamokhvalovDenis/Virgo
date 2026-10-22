/** Reviews supplied by the studio from its paper guestbook. */
export interface StudioReview {
  id: string;
  rating: number;
  date?: string; // YYYY-MM-DD, only when supplied; current reviews have no dates.
  text: string;
  service: string;
  source: 'guestbook';
}

export const reviews: StudioReview[] = [
  {
    id: 'guestbook-1',
    rating: 5,
    service: 'Masáž zad',
    text: 'Studio mohu jen doporučit. Paní masérka má opravdu šikovné ruce. Přišla jsem se zablokovanou páteří a po masáži se cítím jako znovuzrozená, uvolněná a lehká. Moc děkuji!',
    source: 'guestbook',
  },
  {
    id: 'guestbook-2',
    rating: 5,
    service: 'Maderoterapie',
    text: 'Na maderoterapii jsem byla poprvé a nadchla mě. Skvělá úleva pro unavené a bolavé nohy. Masérka je milá, pozorná a šikovná. Ráda se brzy vrátím.',
    source: 'guestbook',
  },
  {
    id: 'guestbook-3',
    rating: 4.5,
    service: 'Masáž zad a obličeje',
    text: 'Děkuji za masáž zad a následnou masáž obličeje, odvedená práce je výborná. Byla jsem poprvé, ale rozhodně ne naposledy. Jen by mi vyhovovalo mít na zadní masáž o trochu více času. Už se těším na další péči.',
    source: 'guestbook',
  },
  {
    id: 'guestbook-4',
    rating: 5,
    service: 'Lymfatická masáž a lash lifting',
    text: 'Do studia se vracím pravidelně. Při lymfatické masáži jsem se krásně uvolnila, lash lifting byl velmi pečlivý a doporučuji i laserovou epilaci třísel. Oceňuji online rezervaci a možnost platit kartou.',
    source: 'guestbook',
  },
  {
    id: 'guestbook-5',
    rating: 5,
    service: 'Čokoládová masáž',
    text: 'Příjemné prostředí a čokoládová masáž byla dokonalý relax. K tomu velmi sympatická paní masérka. Doporučuji!',
    source: 'guestbook',
  },
  {
    id: 'guestbook-6',
    rating: 5,
    service: 'Medová masáž',
    text: 'Milá obsluha a čisté, útulné místo. Medová masáž byla vynikající a nabídka služeb je opravdu široká. Vřele doporučuji.',
    source: 'guestbook',
  },
  {
    id: 'guestbook-7',
    rating: 5,
    service: 'Lash lifting',
    text: 'Na lash lifting jsem přišla s malými očekáváními a odcházela nadšená. Výsledek je krásný, ošetření rychlé a práce mnohem pečlivější než v jiných salonech, které jsem zkoušela.',
    source: 'guestbook',
  },
  {
    id: 'guestbook-8',
    rating: 4.5,
    service: 'Laserová epilace podpaží',
    text: 'S laserovou epilací podpaží jsem spokojená. Ošetření je rychlé a příjemné, jen mě na začátku překvapilo, že je cítit mírné štípání. Už po několika návštěvách vidím, že chloupků ubývá a rostou pomaleji.',
    source: 'guestbook',
  },
  {
    id: 'guestbook-9',
    rating: 5,
    service: 'Laserová epilace',
    text: 'Laserovou epilaci jsem dlouho odkládala, ale jsem ráda, že jsem se rozhodla. Vše proběhlo profesionálně a cítila jsem se příjemně. Chloupků postupně opravdu ubývá.',
    source: 'guestbook',
  },
];
